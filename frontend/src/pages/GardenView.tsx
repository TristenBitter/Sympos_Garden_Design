import React, { useState, useEffect, useCallback } from 'react';
import { useNav, useAuth, Garden, Plant } from '../App';
import { gardens, plants as plantsApi, gardens as gardensApi } from '../api';

// ─── Plant detail modal (reused from PlantSelection) ────────────────
function PlantDetailModal({ plant, onClose, onRemove, onAdd, inGarden }: {
  plant: Plant; onClose: () => void;
  onRemove?: () => void; onAdd?: () => void; inGarden: boolean;
}) {
  const sunPct = Math.min((plant.sun_hours / 8) * 100, 100);
  const waterColor: Record<string, string> = { low: '#27ae60', moderate: '#f39c12', high: '#3498db' };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <span className="plant-detail-emoji">{plant.emoji}</span>
          <div className="plant-detail-title">{plant.name}</div>
          <div style={{ textAlign: 'center', marginBottom: 12, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{plant.category.replace('_', ' ')}</span>
            <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{plant.climate_type}</span>
            {plant.is_nitrogen_fixing && <span className="badge badge-n">🌿 N-Fixing</span>}
            {plant.category === 'aquatic' && <span className="badge badge-blue">🌊 Aquatic</span>}
          </div>

          <div className="plant-detail-grid">
            <div className="plant-stat">
              <div className="plant-stat-label">☀️ Sun Needed</div>
              <div className="plant-stat-value">{plant.sun_hours}+ hrs/day</div>
              <div style={{ background: 'var(--gray-mid)', borderRadius: 4, height: 6, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ width: `${sunPct}%`, background: 'var(--accent-gold)', height: '100%', borderRadius: 4 }} />
              </div>
            </div>
            <div className="plant-stat">
              <div className="plant-stat-label">💧 Water Needs</div>
              <div className="plant-stat-value" style={{ color: waterColor[plant.water_needs] || 'var(--text)', textTransform: 'capitalize' }}>
                {plant.water_needs}
              </div>
            </div>
            <div className="plant-stat">
              <div className="plant-stat-label">🌡️ Zones</div>
              <div className="plant-stat-value">{plant.min_zone} – {plant.max_zone}</div>
            </div>
            <div className="plant-stat">
              <div className="plant-stat-label">🔧 Maintenance</div>
              <div className="plant-stat-value" style={{ textTransform: 'capitalize' }}>{plant.maintenance_level}</div>
            </div>
            <div className="plant-stat">
              <div className="plant-stat-label">🌱 Plant Time</div>
              <div className="plant-stat-value" style={{ fontSize: '0.85rem' }}>{plant.planting_time}</div>
            </div>
            <div className="plant-stat">
              <div className="plant-stat-label">🌾 Harvest</div>
              <div className="plant-stat-value" style={{ fontSize: '0.85rem' }}>{plant.harvest_time}</div>
            </div>
          </div>

          {plant.soil_preferences && (
            <div className="plant-stat" style={{ marginBottom: 8 }}>
              <div className="plant-stat-label">🪱 Soil</div>
              <div style={{ fontSize: '0.9rem', marginTop: 2 }}>{plant.soil_preferences}</div>
            </div>
          )}
          {plant.yield_info && (
            <div className="plant-stat" style={{ marginBottom: 8 }}>
              <div className="plant-stat-label">📦 Yield</div>
              <div style={{ fontSize: '0.9rem', marginTop: 2 }}>{plant.yield_info}</div>
            </div>
          )}
          {plant.fun_facts && (
            <div className="fun-fact-box">{plant.fun_facts}</div>
          )}
          {plant.category === 'aquatic' && (
            <div style={{ background: '#d6eaf8', border: '2px solid #5dade2', borderRadius: 8, padding: 12, marginTop: 12, fontSize: '0.9rem' }}>
              🌊 <strong>Aquatic:</strong> Place on a Water tile in the layout to be happy.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            {inGarden ? (
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onRemove}>
                ✕ Remove from Garden
              </button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onAdd}>
                + Add to Garden
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mini plant card ────────────────────────────────────────────────
function PlantCard({ plant, inGarden, onInfo }: { plant: Plant; inGarden: boolean; onInfo: () => void }) {
  return (
    <div className="plant-card" onClick={onInfo} style={{ position: 'relative' }}>
      {inGarden && (
        <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, background: 'var(--green-mid)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 900 }}>✓</div>
      )}
      <span className="plant-emoji">{plant.emoji}</span>
      <div className="plant-name">{plant.name}</div>
      <div className="plant-category">{plant.category.replace('_', ' ')}</div>
      <div className="plant-badges">
        <span className="badge badge-gold">☀️{plant.sun_hours}h</span>
        <span className="badge badge-blue">💧{plant.water_needs}</span>
        {plant.is_nitrogen_fixing && <span className="badge badge-n">N</span>}
      </div>
    </div>
  );
}

const CATEGORIES = ['all', 'tree', 'bush', 'leafy', 'root_crop', 'herb', 'ground_cover', 'aquatic'];
const CAT_LABELS: Record<string, string> = {
  all: 'All', tree: '🌳 Tree', bush: '🌿 Bush', leafy: '🥬 Leafy', root_crop: '🥕 Root',
  herb: '🌸 Herb', ground_cover: '☘️ Ground', aquatic: '🌊 Aquatic'
};
const CLIMATES = ['all', 'tundra', 'temperate', 'subtropical', 'tropical'];
const CLIMATE_LABELS: Record<string, string> = {
  all: '🌍 All', tundra: '🏔️ Tundra', temperate: '🌲 Temperate', subtropical: '🌴 Subtropical', tropical: '🌺 Tropical'
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function GardenView({ gardenId }: { gardenId: number }) {
  const { navigate } = useNav();
  const { user } = useAuth();

  const [garden, setGarden]             = useState<Garden | null>(null);
  const [gardenPlants, setGardenPlants] = useState<Plant[]>([]);   // plants belonging to this garden
  const [allPlants, setAllPlants]       = useState<Plant[]>([]);   // search results
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<'plants' | 'search'>('plants');

  // Search state
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [climateFilter, setClimateFilter] = useState('all');
  const [searchLoading, setSearchLoading] = useState(false);

  // Detail modal
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');

  // ── Load garden data ──────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    gardensApi.getOne(gardenId)
      .then(r => {
        setGarden(r.data);
        setGardenPlants(r.data.plants || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gardenId]);

  // ── Search all plants ─────────────────────────────────────────
  const runSearch = useCallback(() => {
    const params: any = {};
    if (catFilter !== 'all') params.category = catFilter;
    if (climateFilter !== 'all') params.climate_type = climateFilter;
    if (search.trim()) params.search = search.trim();
    setSearchLoading(true);
    plantsApi.getAll(params)
      .then(r => { setAllPlants(r.data); setSearchLoading(false); })
      .catch(() => setSearchLoading(false));
  }, [search, catFilter, climateFilter]);

  useEffect(() => {
    if (activeTab === 'search') runSearch();
  }, [activeTab, catFilter, climateFilter, runSearch]);

  // debounce search text
  useEffect(() => {
    if (activeTab !== 'search') return;
    const t = setTimeout(runSearch, 350);
    return () => clearTimeout(t);
  }, [search, activeTab, runSearch]);

  // ── Add / remove plant ────────────────────────────────────────
  const isInGarden = (plantId: number) => gardenPlants.some(p => p.id === plantId);

  const addPlant = async (plant: Plant) => {
    if (isInGarden(plant.id)) return;
    const updated = [...gardenPlants, plant];
    setGardenPlants(updated);
    setDetailPlant(null);
    await persistPlants(updated);
    flashSave('Plant added ✓');
  };

  const removePlant = async (plantId: number) => {
    const updated = gardenPlants.filter(p => p.id !== plantId);
    setGardenPlants(updated);
    setDetailPlant(null);
    await persistPlants(updated);
    flashSave('Plant removed');
  };

  const persistPlants = async (list: Plant[]) => {
    if (!garden) return;
    setSaving(true);
    try {
      await gardensApi.savePlants(garden.id, list.map(p => p.id));
    } catch {}
    setSaving(false);
  };

  const flashSave = (msg: string) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(''), 2500);
  };

  // ── Open layout builder with current plants + saved layout ────
  const openBuilder = () => {
    if (!garden) return;
    navigate({
      name: 'garden-builder',
      garden,
      selectedPlants: gardenPlants,
      savedLayout: garden.layout || [],
    });
  };

  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="loading-center" style={{ minHeight: '50vh' }}><div className="loading-spinner" /><span>Loading garden...</span></div>;
  }
  if (!garden) {
    return <div className="page"><p>Garden not found.</p></div>;
  }

  const climateEmoji: Record<string, string> = {
    tundra: '🏔️', temperate: '🌲', subtropical: '🌴', tropical: '🌺'
  };

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button
            className="btn btn-sm btn-secondary"
            style={{ marginBottom: 10 }}
            onClick={() => navigate({ name: 'dashboard' })}
          >
            ← My Gardens
          </button>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{garden.name}</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {climateEmoji[garden.climate_type] || '🌿'} Zone {garden.zone} &nbsp;·&nbsp; {garden.location} &nbsp;·&nbsp; {garden.width} × {garden.height} ft
          </p>
        </div>

        {/* Layout button — prominent */}
        <button
          className="btn btn-gold btn-lg"
          onClick={openBuilder}
          style={{ alignSelf: 'flex-end' }}
        >
          🗺️ Edit Layout
        </button>
      </div>

      {/* ── Zone banner ── */}
      <div className="zone-banner" style={{ marginBottom: 28 }}>
        <span style={{ fontSize: '2rem' }}>🌡️</span>
        <div style={{ flex: 1 }}>
          <div className="zone-label">Zone {garden.zone} — {garden.climate_type}</div>
          <div className="zone-desc">{gardenPlants.length} plant{gardenPlants.length !== 1 ? 's' : ''} in this garden</div>
        </div>
        {saveMsg && (
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem' }}>
            {saveMsg}
          </div>
        )}
        {saving && <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Saving...</div>}
      </div>

      {/* ── Tab selector ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'white', borderRadius: 12, padding: 4, boxShadow: 'var(--shadow)', width: 'fit-content', border: '2px solid var(--gray-mid)' }}>
        <button
          onClick={() => setActiveTab('plants')}
          style={{
            padding: '10px 28px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem',
            background: activeTab === 'plants' ? 'var(--green-mid)' : 'transparent',
            color: activeTab === 'plants' ? 'white' : 'var(--text-mid)',
            transition: 'all 0.2s',
          }}
        >
          🌿 My Plants ({gardenPlants.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '10px 28px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem',
            background: activeTab === 'search' ? 'var(--green-mid)' : 'transparent',
            color: activeTab === 'search' ? 'white' : 'var(--text-mid)',
            transition: 'all 0.2s',
          }}
        >
          🔍 Find & Add Plants
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: MY PLANTS
      ══════════════════════════════════════════════════ */}
      {activeTab === 'plants' && (
        <div>
          {gardenPlants.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <div className="empty-state-title">No plants yet</div>
              <p style={{ marginBottom: 20 }}>Switch to "Find & Add Plants" to search the database and add plants to this garden.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('search')}>
                🔍 Find Plants
              </button>
            </div>
          ) : (
            <>
              {/* Group by category */}
              {Array.from(new Set(gardenPlants.map(p => p.category))).map(cat => (
                <div key={cat} style={{ marginBottom: 32 }}>
                  <div className="section-title" style={{ textTransform: 'capitalize' }}>
                    {CAT_LABELS[cat] || cat.replace('_', ' ')}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-mid)', fontFamily: 'var(--font-body)', fontWeight: 400, marginLeft: 8 }}>
                      {gardenPlants.filter(p => p.category === cat).length} plant{gardenPlants.filter(p => p.category === cat).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="plants-grid">
                    {gardenPlants.filter(p => p.category === cat).map(p => (
                      <PlantCard key={p.id} plant={p} inGarden={true} onInfo={() => setDetailPlant(p)} />
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16, padding: '14px 20px', background: 'var(--gray-light)', borderRadius: 12, fontSize: '0.85rem', color: 'var(--text-mid)' }}>
                💡 Click any plant to see details, or switch to <strong>Find & Add Plants</strong> to expand your garden.
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: SEARCH + ADD
      ══════════════════════════════════════════════════ */}
      {activeTab === 'search' && (
        <div>
          {/* Search bar */}
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <input
              className="search-input"
              placeholder="Search plants by name or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" onClick={runSearch}>Search</button>
          </div>

          {/* Climate filter */}
          <div className="filter-bar" style={{ marginBottom: 10 }}>
            <strong style={{ fontSize: '0.8rem', alignSelf: 'center', color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>Climate:</strong>
            {CLIMATES.map(c => (
              <button key={c} className={`filter-chip ${climateFilter === c ? 'active' : ''}`} onClick={() => setClimateFilter(c)}>
                {CLIMATE_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="filter-bar" style={{ marginBottom: 20 }}>
            <strong style={{ fontSize: '0.8rem', alignSelf: 'center', color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>Category:</strong>
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Results */}
          {searchLoading ? (
            <div className="loading-center"><div className="loading-spinner" /><span>Searching...</span></div>
          ) : allPlants.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No plants found</div>
              <p>Try different filters or a different search term.</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14, fontSize: '0.85rem', color: 'var(--text-mid)' }}>
                {allPlants.length} plant{allPlants.length !== 1 ? 's' : ''} found
                &nbsp;·&nbsp; ✓ = already in your garden
              </div>
              <div className="plants-grid">
                {allPlants.map(p => (
                  <PlantCard key={p.id} plant={p} inGarden={isInGarden(p.id)} onInfo={() => setDetailPlant(p)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bottom action bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--green-deep)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.25)', zIndex: 900,
      }}>
        <div style={{ color: 'var(--green-light)', fontSize: '0.9rem' }}>
          <strong style={{ color: 'white' }}>{garden.name}</strong>
          &nbsp;·&nbsp; {gardenPlants.length} plant{gardenPlants.length !== 1 ? 's' : ''}
          {saving && <span style={{ marginLeft: 10, opacity: 0.7 }}>Saving...</span>}
          {saveMsg && <span style={{ marginLeft: 10, color: '#b7e4a7' }}>{saveMsg}</span>}
        </div>
        <button className="btn btn-gold" onClick={openBuilder}>
          🗺️ Open Layout Editor
        </button>
      </div>
      <div style={{ height: 64 }} />

      {/* ── Detail modal ── */}
      {detailPlant && (
        <PlantDetailModal
          plant={detailPlant}
          inGarden={isInGarden(detailPlant.id)}
          onClose={() => setDetailPlant(null)}
          onAdd={() => addPlant(detailPlant)}
          onRemove={() => removePlant(detailPlant.id)}
        />
      )}
    </div>
  );
}
