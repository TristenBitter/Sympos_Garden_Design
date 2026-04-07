import React, { useState, useEffect } from "react";
import { useAuth, useNav, Garden } from "../App";
import { gardens } from "../api";

export default function Dashboard() {
  const { user } = useAuth();
  const { navigate } = useNav();
  const [gardenList, setGardenList] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    gardens
      .getByUser(user.id)
      .then((r) => {
        setGardenList(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const climateEmoji: Record<string, string> = {
    tundra: "🏔️",
    temperate: "🌲",
    subtropical: "🌴",
    tropical: "🌺",
  };

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name?.split(" ")[0]}!{" "}
          </h1>
          <p className="page-subtitle">Your gardens are growing beautifully.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate({ name: "new-garden" })}
        >
          + New Garden
        </button>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="loading-spinner" />
          <span>Loading gardens...</span>
        </div>
      ) : gardenList.length === 0 ? (
        <div>
          <div className="empty-state">
            <div className="empty-state-icon">🌱</div>
            <div className="empty-state-title">No gardens yet</div>
            <p style={{ marginBottom: 24 }}>
              Create your first garden to get started!
            </p>
          </div>
          <button
            className="create-btn"
            onClick={() => navigate({ name: "new-garden" })}
          >
            <div className="create-btn-icon">+</div>
            <div className="create-btn-text">Create Your First Garden</div>
            <p
              style={{
                color: "var(--text-mid)",
                fontSize: "0.85rem",
                marginTop: 4,
              }}
            >
              Add plants, plan your layout, and grow something amazing
            </p>
          </button>
        </div>
      ) : (
        <div>
          <div className="section-title">My Gardens</div>
          <div className="gardens-grid">
            {gardenList.map((g) => (
              <div key={g.id} className="garden-card">
                <div
                  className="garden-card-header"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate({ name: "garden-view", gardenId: g.id })
                  }
                >
                  <div className="garden-card-name">{g.name}</div>
                  <div className="garden-card-zone">
                    {climateEmoji[g.climate_type] || "🌿"} Zone {g.zone} ·{" "}
                    {g.climate_type}
                  </div>
                </div>
                <div className="garden-card-body">
                  <div className="garden-card-stat">
                    Location <span>{g.location || "Unknown"}</span>
                  </div>
                  <div className="garden-card-stat">
                    Size{" "}
                    <span>
                      {g.width} × {g.height} ft
                    </span>
                  </div>
                  <div className="garden-card-stat">
                    Created{" "}
                    <span>{new Date(g.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() =>
                        navigate({ name: "garden-view", gardenId: g.id })
                      }
                    >
                      🌿 View Garden
                    </button>
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() =>
                        navigate({ name: "garden-view", gardenId: g.id })
                      }
                      title="Manage plants and search new ones"
                    >
                      🌱 Plants
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() =>
                        navigate({ name: "garden-view", gardenId: g.id })
                      }
                      title="Edit map layout"
                    >
                      🗺️ Layout
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              className="create-btn"
              onClick={() => navigate({ name: "new-garden" })}
              style={{ minHeight: 200 }}
            >
              <div className="create-btn-icon">+</div>
              <div className="create-btn-text">New Garden</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
