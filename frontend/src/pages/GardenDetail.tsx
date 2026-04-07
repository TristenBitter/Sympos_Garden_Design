import React, { useState, useEffect } from 'react';
import { useNav, Garden, Plant } from '../App';
import { gardens } from '../api';

export default function GardenDetail({ gardenId }: { gardenId: number }) {
  const { navigate } = useNav();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gardens.getOne(gardenId)
      .then(r => { setGarden(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [gardenId]);

  if (loading) return <div className="loading-center"><div className="loading-spinner" /></div>;
  if (!garden) return <div className="page"><p>Garden not found.</p></div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{garden.name}</h1>
          <p className="page-subtitle">Zone {garden.zone} · {garden.location}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate({ name: 'dashboard' })}>← Back</button>
          <button className="btn btn-primary" onClick={() => navigate({ name: 'plant-selection', garden })}>Edit Plants</button>
        </div>
      </div>

      {garden.plants && garden.plants.length > 0 && (
        <div className="card">
          <div className="section-title">🌿 Plants in this Garden</div>
          <div className="plants-grid">
            {garden.plants.map((p: any) => (
              <div key={p.id} className="plant-card">
                <span className="plant-emoji">{p.emoji}</span>
                <div className="plant-name">{p.name}</div>
                <div className="plant-category">{p.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
