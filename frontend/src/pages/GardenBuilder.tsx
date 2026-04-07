import React, { useState, useCallback, useMemo } from "react";
import { useNav, Garden, Plant } from "../App";
import { gardens } from "../api";

// ─────────────────────────────────────────────
// TILE TYPES
// ─────────────────────────────────────────────
export type TileKind =
  | "soil"
  | "water"
  | "grass"
  | "wall"
  | "sand"
  | "pit"
  | "lava"
  | "fountain";

interface TileDef {
  kind: TileKind;
  label: string;
  bg: string;
  fg?: string;
  border?: string;
}

const TILES: TileDef[] = [
  { kind: "soil", label: "Soil", bg: "#8b5e3c", border: "rgba(0,0,0,0.25)" },
  { kind: "water", label: "Water", bg: "#5dade2", border: "#2e86c1" },
  { kind: "grass", label: "Grass", bg: "#58d68d", border: "#27ae60" },
  { kind: "wall", label: "Wall", bg: "#808b96", border: "#566573" },
  { kind: "sand", label: "Sand", bg: "#f9e79f", border: "#d4ac0d" },
  { kind: "pit", label: "Pit", bg: "#1c2833", border: "#000" },
  { kind: "lava", label: "Lava", bg: "#e74c3c", border: "#a93226" },
  {
    kind: "fountain",
    label: "Fountain",
    bg: "#5dade2",
    border: "#2e86c1",
    fg: "⛲",
  },
];
const TILE_MAP = Object.fromEntries(TILES.map((t) => [t.kind, t])) as Record<
  TileKind,
  TileDef
>;

// ─────────────────────────────────────────────
// STATE TYPES
// Trees are "stickers" floating over the grid at pixel coordinates.
// Small plants live in grid cells (one per cell).
// ─────────────────────────────────────────────
interface GridCell {
  tile: TileKind;
  plantId?: number;
}

interface TreeSticker {
  id: string;
  plantId: number;
  cx: number; // grid-corner x (0..GRID_W), placed between 4 cells
  cy: number; // grid-corner y (0..GRID_H)
}

// ─────────────────────────────────────────────
// COMPANION MAP  plant id → set of beneficial companion ids
// Built from the companions array attached to each plant by the API
// ─────────────────────────────────────────────
function buildCompanionMap(plants: Plant[]): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  for (const p of plants) {
    if (!p.companions || p.companions.length === 0) continue;
    for (const c of p.companions) {
      if (c.relationship_type === "beneficial") {
        // companion_plant_id is the id of the plant that benefits THIS plant
        const cid = c.companion_plant_id ?? c.id;
        if (cid == null) continue;
        if (!map.has(p.id)) map.set(p.id, new Set());
        map.get(p.id)!.add(Number(cid));
      }
    }
  }
  return map;
}

// ─────────────────────────────────────────────
// HEALTH
// Score 0-4:
//  Sun position:       0-2 pts
//  Companion adjacent: +1 pt (orthogonal)
//  N-fixer adjacent:   +1 pt (orthogonal OR diagonal — 8 directions)
// Result: ≥3 = happy, 1-2 = okay, 0 = unhappy
// ─────────────────────────────────────────────
function getHealth(
  plant: Plant,
  posX: number,
  posY: number,
  gridW: number,
  cellTile: TileKind,
  grid: Record<string, { tile: TileKind; plantId?: number }>,
  allPlants: Plant[],
  companionMap: Map<number, Set<number>>,
): "happy" | "okay" | "unhappy" {
  const isAquatic = plant.category === "aquatic";
  const onWater = cellTile === "water" || cellTile === "fountain";

  if (isAquatic) return onWater ? "happy" : "unhappy";
  if (onWater) return "unhappy";

  // Sun score 0-2 based on horizontal position
  const sunZone = posX / gridW;
  const fullSun = sunZone > 0.6;
  const partSun = sunZone > 0.3;
  let sunScore: number;
  if (plant.sun_hours >= 6) sunScore = fullSun ? 2 : partSun ? 1 : 0;
  else if (plant.sun_hours >= 4) sunScore = fullSun ? 1 : partSun ? 2 : 1;
  else sunScore = fullSun ? 0 : partSun ? 1 : 2;

  // Orthogonal neighbours (4 directions) for companion bonus
  const orthoDirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  // All 8 directions for N-fixer bonus
  const allDirs: [number, number][] = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];

  const myCompanions = companionMap.get(plant.id) || new Set<number>();

  let companionBonus = 0;
  let nFixerBonus = 0;

  for (const [dx, dy] of allDirs) {
    const nk = `${posX + dx},${posY + dy}`;
    const nc = grid[nk];
    if (!nc || nc.plantId === undefined) continue;
    const neighborPlant = allPlants.find((p) => p.id === nc.plantId);
    if (!neighborPlant) continue;

    // N-fixer bonus: any nitrogen-fixing neighbor boosts THIS plant (all 8 directions)
    // N-fixers are superheroes — they boost everyone around them, not just other N-fixers
    if (neighborPlant.is_nitrogen_fixing && nFixerBonus === 0) {
      nFixerBonus = 1;
    }

    // Companion bonus: orthogonal only — must be a listed beneficial companion
    const isOrtho = orthoDirs.some(([ox, oy]) => ox === dx && oy === dy);
    if (isOrtho && myCompanions.has(nc.plantId) && companionBonus === 0) {
      companionBonus = 1;
    }
  }

  const score = sunScore + companionBonus + nFixerBonus; // 0-4
  return score >= 3 ? "happy" : score >= 1 ? "okay" : "unhappy";
}

const HC = { happy: "#27ae60", okay: "#f39c12", unhappy: "#c0392b" };

// ─────────────────────────────────────────────
// TILE SWATCH
// ─────────────────────────────────────────────
function TileSwatch({
  tile,
  selected,
  onClick,
}: {
  tile: TileDef;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      title={tile.label}
      style={{
        width: 44,
        height: 44,
        background: tile.bg,
        border: `3px solid ${selected ? "#d4a017" : tile.border || "#555"}`,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "1.2rem",
        boxShadow: selected ? "0 0 0 3px rgba(212,160,23,0.4)" : "none",
        transition: "all 0.15s",
      }}
    >
      {tile.fg}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
const CELL = 48;

export default function GardenBuilder({
  garden,
  selectedPlants,
  savedLayout,
}: {
  garden: Garden;
  selectedPlants: Plant[];
  savedLayout?: any[];
}) {
  const { navigate } = useNav();
  const GRID_W = Math.min(Math.max(Math.round(garden.width), 10), 26);
  const GRID_H = Math.min(Math.max(Math.round(garden.height), 8), 22);

  const companionMap = useMemo(
    () => buildCompanionMap(selectedPlants),
    [selectedPlants],
  );

  // ── Restore saved state ──────────────────────
  const initState = () => {
    const g: Record<string, GridCell> = {};
    for (let y = 0; y < GRID_H; y++)
      for (let x = 0; x < GRID_W; x++) g[`${x},${y}`] = { tile: "soil" };

    const stickers: TreeSticker[] = [];
    if (savedLayout && savedLayout.length > 0) {
      for (const item of savedLayout) {
        const tile = (item.tile as TileKind) || "soil";
        const k = `${item.pos_x},${item.pos_y}`;

        // Restore tile on any cell that has one stored
        if (g[k]) g[k] = { ...g[k], tile };

        if (item.type === "plant" && item.ref_id) {
          const plant = selectedPlants.find((p) => p.id === item.ref_id);
          if (!plant) continue;
          if (plant.category === "tree") {
            // Use saved sticker_cx/cy if present, else derive from pos
            const cx = item.sticker_cx ?? item.pos_x + 1;
            const cy = item.sticker_cy ?? item.pos_y + 1;
            // Dedupe: only one sticker per unique cx,cy,plantId
            const sid = `tree-${item.ref_id}-${cx}-${cy}`;
            if (!stickers.find((s) => s.id === sid)) {
              stickers.push({ id: sid, plantId: item.ref_id, cx, cy });
            }
          } else {
            if (g[k]) g[k].plantId = item.ref_id;
          }
        }
      }
    }
    return { g, stickers };
  };

  const init = initState();
  const [grid, setGrid] = useState<Record<string, GridCell>>(init.g);
  const [stickers, setStickers] = useState<TreeSticker[]>(init.stickers);

  const [mode, setMode] = useState<"tile" | "plant" | "erase">("tile");
  const [selectedTile, setSelectedTile] = useState<TileKind | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const k = (x: number, y: number) => `${x},${y}`;

  const selectedIsTree = useMemo(
    () =>
      selectedPlantId !== null &&
      selectedPlants.find((p) => p.id === selectedPlantId)?.category === "tree",
    [selectedPlantId, selectedPlants],
  );

  // ── Apply paint to a cell ────────────────────
  const applyToCell = useCallback(
    (x: number, y: number) => {
      setGrid((prev) => {
        const next = { ...prev };
        const cell = next[k(x, y)] || { tile: "soil" };
        if (mode === "erase") {
          next[k(x, y)] = { tile: cell.tile }; // remove plant, keep tile
          return next;
        }
        if (mode === "tile" && selectedTile) {
          next[k(x, y)] = { ...cell, tile: selectedTile };
          return next;
        }
        if (mode === "plant" && selectedPlantId !== null && !selectedIsTree) {
          next[k(x, y)] = { ...cell, plantId: selectedPlantId };
          return next;
        }
        return prev;
      });
    },
    [mode, selectedTile, selectedPlantId, selectedIsTree],
  );

  const handleCellDown = (x: number, y: number) => {
    setIsDragging(true);
    applyToCell(x, y);
  };
  const handleCellEnter = (x: number, y: number) => {
    if (isDragging) applyToCell(x, y);
  };
  const handleMouseUp = () => setIsDragging(false);

  // ── Place tree sticker on grid click ─────────
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "plant" || !selectedIsTree || selectedPlantId === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawCx = (e.clientX - rect.left) / CELL;
    const rawCy = (e.clientY - rect.top) / CELL;
    // Snap to nearest grid corner
    const cx = Math.max(1, Math.min(GRID_W - 1, Math.round(rawCx)));
    const cy = Math.max(1, Math.min(GRID_H - 1, Math.round(rawCy)));
    const sid = `tree-${selectedPlantId}-${cx}-${cy}`;
    // Don't duplicate at same spot
    setStickers((prev) =>
      prev.find((s) => s.id === sid)
        ? prev
        : [...prev, { id: sid, plantId: selectedPlantId, cx, cy }],
    );
  };

  // ── Erase tree sticker ───────────────────────
  const eraseSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "erase")
      setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // ── Save ─────────────────────────────────────
  const saveLayout = async () => {
    setSaving(true);
    const layout: any[] = [];

    // Cells that have a non-default tile or a plant
    for (const [ck, c] of Object.entries(grid)) {
      if (c.tile === "soil" && c.plantId === undefined) continue;
      const [x, y] = ck.split(",").map(Number);
      layout.push({
        // 'hardscape' = tile-only cell (no plant), 'plant' = has a plant
        type: c.plantId !== undefined ? "plant" : "hardscape",
        ref_id: c.plantId ?? 0,
        pos_x: x,
        pos_y: y,
        tile: c.tile,
      });
    }

    // Tree stickers — saved as type='plant' with sticker coords
    for (const s of stickers) {
      const ax = Math.max(0, Math.floor(s.cx) - 1);
      const ay = Math.max(0, Math.floor(s.cy) - 1);
      layout.push({
        type: "plant",
        ref_id: s.plantId,
        pos_x: ax,
        pos_y: ay,
        tile: grid[k(ax, ay)]?.tile || "soil",
        sticker_cx: s.cx,
        sticker_cy: s.cy,
      });
    }

    try {
      await gardens.saveLayout(garden.id, layout);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Save failed:", err);
      alert(
        "Save failed: " +
          (err?.response?.data?.error || err?.message || "Unknown error"),
      );
    }
    setSaving(false);
  };

  const saveAndReturn = async () => {
    await saveLayout();
    navigate({ name: "garden-view", gardenId: garden.id });
  };

  // ── Render one grid cell ─────────────────────
  const renderCell = (x: number, y: number) => {
    const c = grid[k(x, y)] || { tile: "soil" };
    const td = TILE_MAP[c.tile] || TILE_MAP.soil;
    const plant =
      c.plantId !== undefined
        ? selectedPlants.find((p) => p.id === c.plantId)
        : undefined;
    const health = plant
      ? getHealth(
          plant,
          x,
          y,
          GRID_W,
          c.tile,
          grid,
          selectedPlants,
          companionMap,
        )
      : null;

    return (
      <div
        key={k(x, y)}
        onMouseDown={() => handleCellDown(x, y)}
        onMouseEnter={() => handleCellEnter(x, y)}
        onMouseUp={handleMouseUp}
        title={plant ? `${plant.name} · ${health}` : td.label}
        style={{
          width: CELL,
          height: CELL,
          background: td.bg,
          border: `1px solid ${td.border || "rgba(0,0,0,0.18)"}`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: mode === "erase" ? "crosshair" : "pointer",
          fontSize: "1.55rem",
          userSelect: "none",
          flexShrink: 0,
        }}
        onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(1.12)")}
        onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      >
        {!plant && td.fg && (
          <span style={{ pointerEvents: "none" }}>{td.fg}</span>
        )}
        {plant && (
          <span
            style={{
              pointerEvents: "none",
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))",
            }}
          >
            {plant.emoji}
          </span>
        )}
        {health && (
          <div
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: HC[health],
              border: "1.5px solid rgba(255,255,255,0.9)",
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  };

  const gridPxW = GRID_W * CELL;
  const gridPxH = GRID_H * CELL;
  const categories = Array.from(new Set(selectedPlants.map((p) => p.category)));

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h1 className="page-title">🗺️ Garden Builder</h1>
          <p className="page-subtitle">
            {garden.name} · {GRID_W} × {GRID_H} ft
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              navigate({ name: "garden-view", gardenId: garden.id })
            }
          >
            ← Garden
          </button>
          <button
            className={`btn btn-sm ${saved ? "btn-gold" : "btn-primary"}`}
            onClick={saveLayout}
            disabled={saving}
          >
            {saving ? "..." : saved ? "✓ Saved!" : "💾 Save"}
          </button>
          <button
            className="btn btn-gold btn-sm"
            onClick={saveAndReturn}
            disabled={saving}
          >
            💾 Save & Exit
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate({ name: "dashboard" })}
          >
            🏠 Home
          </button>
        </div>
      </div>

      {/* Tips */}
      <div
        style={{
          background: "white",
          border: "2px solid var(--gray-mid)",
          borderRadius: 10,
          padding: "10px 16px",
          marginBottom: 14,
          fontSize: "0.8rem",
          color: "var(--text-mid)",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span>🟫 Paint tiles first, then place plants</span>
        <span>🌊 Aquatic plants need water tiles to be happy</span>
        <span>
          🌳 Select a tree then <strong>click the grid</strong> — it floats over
          everything
        </span>
        <span>🗑️ Erase mode removes plants &amp; tree stickers</span>
        <span>🤝 Plant companions nearby to boost happiness badges</span>
      </div>

      <div className="builder-container">
        {/* ── SIDEBAR ── */}
        <div className="builder-sidebar">
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {(["tile", "plant", "erase"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  border: `2px solid ${mode === m ? "var(--green-mid)" : "var(--gray-mid)"}`,
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  cursor: "pointer",
                  background: mode === m ? "var(--green-mid)" : "white",
                  color: mode === m ? "white" : "var(--text-mid)",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                }}
              >
                {m === "tile"
                  ? "🟫 Tile"
                  : m === "plant"
                    ? "🌿 Plant"
                    : "🗑️ Erase"}
              </button>
            ))}
          </div>

          {mode === "tile" && (
            <>
              <h3
                style={{
                  marginBottom: 10,
                  fontFamily: "var(--font-pixel)",
                  fontSize: "0.52rem",
                  textTransform: "uppercase",
                }}
              >
                Ground Tiles
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  justifyItems: "center",
                  marginBottom: 12,
                }}
              >
                {TILES.map((t) => (
                  <div
                    key={t.kind}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <TileSwatch
                      tile={t}
                      selected={selectedTile === t.kind}
                      onClick={() => setSelectedTile(t.kind)}
                    />
                    <span
                      style={{
                        fontSize: "0.57rem",
                        color: "var(--text-mid)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
              {selectedTile && (
                <div
                  style={{
                    padding: 10,
                    background: "#fef3cd",
                    border: "2px solid var(--accent-gold)",
                    borderRadius: 8,
                    fontSize: "0.8rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      background: TILE_MAP[selectedTile].bg,
                      border: `2px solid ${TILE_MAP[selectedTile].border}`,
                      borderRadius: 4,
                      margin: "0 auto 4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {TILE_MAP[selectedTile].fg}
                  </div>
                  <strong>{TILE_MAP[selectedTile].label}</strong> — drag to
                  paint
                </div>
              )}
            </>
          )}

          {mode === "plant" && (
            <>
              <h3
                style={{
                  marginBottom: 10,
                  fontFamily: "var(--font-pixel)",
                  fontSize: "0.52rem",
                  textTransform: "uppercase",
                }}
              >
                Your Plants
              </h3>
              {selectedPlants.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text-mid)" }}>
                  No plants selected.
                </p>
              ) : (
                categories.map((cat) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        color: "var(--text-mid)",
                        fontWeight: 700,
                        marginBottom: 5,
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {cat.replace("_", " ")}
                      {cat === "tree" ? " 🌳" : ""}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 5,
                      }}
                    >
                      {selectedPlants
                        .filter((p) => p.category === cat)
                        .map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPlantId(p.id)}
                            style={{
                              border: `2px solid ${selectedPlantId === p.id ? "var(--accent-gold)" : "var(--gray-mid)"}`,
                              borderRadius: 6,
                              padding: "6px 3px",
                              textAlign: "center",
                              cursor: "pointer",
                              background:
                                selectedPlantId === p.id ? "#fef3cd" : "white",
                              transition: "all 0.15s",
                            }}
                          >
                            <div style={{ fontSize: "1.3rem" }}>{p.emoji}</div>
                            <div
                              style={{
                                fontSize: "0.58rem",
                                fontWeight: 700,
                                marginTop: 2,
                                lineHeight: 1.2,
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              {p.name}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              )}
              {selectedPlantId !== null &&
                (() => {
                  const p = selectedPlants.find(
                    (pl) => pl.id === selectedPlantId,
                  );
                  if (!p) return null;
                  return (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        background: "#fef3cd",
                        border: "2px solid var(--accent-gold)",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "1.8rem" }}>{p.emoji}</div>
                      <strong>{p.name}</strong>
                      <div
                        style={{
                          color: "var(--text-mid)",
                          marginTop: 3,
                          fontSize: "0.74rem",
                        }}
                      >
                        {p.category === "tree"
                          ? "🌳 Click anywhere on the grid to place"
                          : "Click or drag on the grid to paint"}
                      </div>
                    </div>
                  );
                })()}
            </>
          )}

          {mode === "erase" && (
            <div
              style={{
                background: "#f8d7da",
                border: "2px solid var(--red)",
                borderRadius: 8,
                padding: 12,
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🗑️</div>
              <strong>Erase Mode</strong>
              <p
                style={{
                  marginTop: 4,
                  color: "var(--text-mid)",
                  fontSize: "0.78rem",
                }}
              >
                Click cells to remove plants.
                <br />
                Click a tree to remove it.
                <br />
                Tiles stay.
              </p>
            </div>
          )}
        </div>

        {/* ── GRID ── */}
        <div>
          <div className="garden-grid-wrapper">
            <div className="garden-grid-title">
              {garden.name} — Aerial View ({GRID_W}×{GRID_H} ft)
            </div>

            {/* Wrapper that holds both the grid and the tree sticker layer */}
            <div
              style={{
                position: "relative",
                width: gridPxW,
                height: gridPxH,
                border: "4px solid #5c3d1e",
                boxShadow: "var(--shadow-deep)",
                cursor:
                  mode === "plant" && selectedIsTree ? "crosshair" : "default",
              }}
              onClick={handleGridClick}
              onMouseLeave={handleMouseUp}
            >
              {/* Cell grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${GRID_W}, ${CELL}px)`,
                  width: gridPxW,
                  height: gridPxH,
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              >
                {Array.from({ length: GRID_H }, (_, y) =>
                  Array.from({ length: GRID_W }, (_, x) => renderCell(x, y)),
                )}
              </div>

              {/* Tree stickers — sit above the grid, don't block mouse on cells */}
              {stickers.map((s) => {
                const plant = selectedPlants.find((p) => p.id === s.plantId);
                if (!plant) return null;
                const SIZE = CELL * 2.4;
                const px = s.cx * CELL;
                const py = s.cy * CELL;
                return (
                  <div
                    key={s.id}
                    onClick={(e) => eraseSticker(s.id, e)}
                    title={
                      mode === "erase" ? `Remove ${plant.name}` : plant.name
                    }
                    style={{
                      position: "absolute",
                      left: px - SIZE / 2,
                      top: py - SIZE / 2,
                      width: SIZE,
                      height: SIZE,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: SIZE * 0.72,
                      pointerEvents: mode === "erase" ? "auto" : "none",
                      cursor: mode === "erase" ? "pointer" : "default",
                      filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.5))${mode === "erase" ? " brightness(1.1)" : ""}`,
                      zIndex: 30,
                      lineHeight: 1,
                      userSelect: "none",
                    }}
                  >
                    {plant.emoji}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 10,
                flexWrap: "wrap",
                fontSize: "0.8rem",
                color: "var(--text-mid)",
                alignItems: "center",
              }}
            >
              {(["happy", "okay", "unhappy"] as const).map((h) => (
                <div
                  key={h}
                  style={{ display: "flex", gap: 5, alignItems: "center" }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: HC[h],
                    }}
                  />
                  <span style={{ textTransform: "capitalize" }}>{h}</span>
                </div>
              ))}
              <span style={{ marginLeft: "auto", fontSize: "0.78rem" }}>
                {
                  Object.values(grid).filter((c) => c.plantId !== undefined)
                    .length
                }{" "}
                plants · {stickers.length} tree
                {stickers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Summary cards */}
          {(() => {
            const placed = new Map<
              number,
              { plant: Plant; count: number; cells: string[] }
            >();
            for (const [ck, c] of Object.entries(grid)) {
              if (c.plantId === undefined) continue;
              const p = selectedPlants.find((pl) => pl.id === c.plantId);
              if (!p) continue;
              if (!placed.has(c.plantId))
                placed.set(c.plantId, { plant: p, count: 0, cells: [] });
              placed.get(c.plantId)!.count++;
              placed.get(c.plantId)!.cells.push(ck);
            }
            for (const s of stickers) {
              const p = selectedPlants.find((pl) => pl.id === s.plantId);
              if (!p) continue;
              if (!placed.has(s.plantId))
                placed.set(s.plantId, { plant: p, count: 0, cells: [] });
              placed.get(s.plantId)!.count++;
            }
            if (placed.size === 0) return null;
            return (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="section-title">🌿 Placed Plants</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(138px, 1fr))",
                    gap: 8,
                  }}
                >
                  {Array.from(placed.values()).map(
                    ({ plant, count, cells }) => {
                      let dominant: "happy" | "okay" | "unhappy" = "happy";
                      if (plant.category !== "tree" && cells.length > 0) {
                        const counts: Record<string, number> = {};
                        for (const ck of cells) {
                          const [x, y] = ck.split(",").map(Number);
                          const tile = grid[ck]?.tile || "soil";
                          const h = getHealth(
                            plant,
                            x,
                            y,
                            GRID_W,
                            tile,
                            grid,
                            selectedPlants,
                            companionMap,
                          );
                          counts[h] = (counts[h] || 0) + 1;
                        }
                        dominant =
                          (["happy", "okay", "unhappy"] as const).find(
                            (h) => counts[h],
                          ) || "okay";
                      }
                      return (
                        <div
                          key={plant.id}
                          style={{
                            background: "var(--gray-light)",
                            borderRadius: 8,
                            padding: "8px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: "1.3rem" }}>
                            {plant.emoji}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {plant.name}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 2,
                              }}
                            >
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: HC[dominant],
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  color: "var(--text-mid)",
                                  textTransform: "capitalize",
                                }}
                              >
                                {dominant}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  color: "var(--text-mid)",
                                }}
                              >
                                · ×{count}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
