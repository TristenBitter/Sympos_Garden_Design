import React, { useState, useEffect, useCallback } from 'react';
import { useNav, Garden, Plant } from '../App';
import { plants, gardens, ai } from '../api';

interface PlantDetailModalProps {
  plant: Plant;
  selected: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function PlantDetailModal({ plant, selected, onToggle, onClose }: PlantDetailModalProps) {
  const sunBar = (hours: number) => {
    const pct = Math.min((hours / 8) * 100, 100);
    return <div style={{ background: 'var(--gray-mid)', borderRadius: 4, height: 8, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${pct}%`, background: 'var(--accent-gold)', height: '100%', borderRadius: 4 }} />
    </div>;
  };

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
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{plant.category.replace('_', ' ')}</span>
            {' '}
            <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{plant.climate_type}</span>
            {plant.is_nitrogen_fixing && <>{' '}<span className="badge badge-n">🌿 N-Fixing</span></>}
          </div>

          <div className="plant-detail-grid">
            <div className="plant-stat">
              <div className="plant-stat-label">☀️ Sun Needed</div>
              <div className="plant-stat-value">{plant.sun_hours}+ hrs/day</div>
              {sunBar(plant.sun_hours)}
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
              <div className="plant-stat-value" style={{ fontWeight: 'normal', fontSize: '0.9rem' }}>{plant.soil_preferences}</div>
            </div>
          )}

          {plant.yield_info && (
            <div className="plant-stat" style={{ marginBottom: 8 }}>
              <div className="plant-stat-label">📦 Yield</div>
              <div className="plant-stat-value" style={{ fontWeight: 'normal', fontSize: '0.9rem' }}>{plant.yield_info}</div>
            </div>
          )}

          {plant.fun_facts && (
            <div className="fun-fact-box">{plant.fun_facts}</div>
          )}

          {plant.ai_reason && (
            <div style={{ background: '#e8f5e9', border: '2px solid var(--green-light)', borderRadius: 8, padding: 12, marginTop: 12, fontSize: '0.9rem' }}>
              🤖 <strong>AI says:</strong> {plant.ai_reason}
            </div>
          )}

          {plant.category === 'aquatic' && (
            <div style={{ background: '#d6eaf8', border: '2px solid #5dade2', borderRadius: 8, padding: 12, marginTop: 12, fontSize: '0.9rem' }}>
              🌊 <strong>Aquatic plant:</strong> Place this on a <strong>Water tile</strong> in the Garden Builder for it to be happy. It will show red if placed on soil.
            </div>
          )}

          <button
            className={`btn ${selected ? 'btn-danger' : 'btn-primary'} btn-lg`}
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
            onClick={onToggle}
          >
            {selected ? '✕ Remove from Garden' : '+ Add to Garden'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlantCard({ plant, selected, onToggle, onInfo }: { plant: Plant; selected: boolean; onToggle: () => void; onInfo: () => void; }) {
  return (
    <div className={`plant-card ${selected ? 'selected' : ''}`} onClick={onToggle}>
      <button style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
        onClick={e => { e.stopPropagation(); onInfo(); }}>ℹ️</button>
      {selected && <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, background: 'var(--green-mid)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>✓</div>}
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
const CLIMATES = ['all', 'tundra', 'temperate', 'subtropical', 'tropical'];

export default function PlantSelection({ garden }: { garden: Garden }) {
  const { navigate } = useNav();
  const [allPlants, setAllPlants] = useState<Plant[]>([]);
  const [selected, setSelected] = useState<Plant[]>([]);
  const [companions, setCompanions] = useState<Plant[]>([]);
  const [aiRecs, setAiRecs] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [climateFilter, setClimateFilter] = useState(garden.climate_type || 'all');
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const [stage, setStage] = useState<'browse' | 'companions'>('browse');
  const [savingPlants, setSavingPlants] = useState(false);

  useEffect(() => {
    const params: any = {};
    if (climateFilter !== 'all') params.climate_type = climateFilter;
    if (catFilter !== 'all') params.category = catFilter;
    if (search) params.search = search;

    setLoading(true);
    plants.getAll(params)
      .then(r => { setAllPlants(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [climateFilter, catFilter, search]);

  const togglePlant = useCallback((plant: Plant) => {
    setSelected(prev =>
      prev.find(p => p.id === plant.id)
        ? prev.filter(p => p.id !== plant.id)
        : [...prev, plant]
    );
  }, []);

  const goToCompanions = async () => {
    if (selected.length === 0) return;
    setStage('companions');
    try {
      const compRes = await plants.getCompanions(selected.map(p => p.id));
      setCompanions(compRes.data);
    } catch {}
    // AI recommendations
    try {
      const recRes = await ai.recommendations({
        zone: garden.zone,
        climate_type: garden.climate_type,
        garden_size: garden.width * garden.height,
        selected_plants: selected.map(p => p.name),
      });
      setAiRecs(recRes.data);
    } catch {}
  };

  const continueToBuilder = async () => {
    setSavingPlants(true);
    try {
      await gardens.savePlants(garden.id, selected.map(p => p.id));
    } catch {}
    setSavingPlants(false);
    navigate({ name: 'garden-builder', garden, selectedPlants: selected });
  };

  const isSelected = (p: Plant) => !!selected.find(s => s.id === p.id);

  if (stage === 'companions') {
    const companionNotSelected = companions.filter(c => !isSelected(c));
    const aiNotSelected = aiRecs.filter(a => !isSelected(a) && !companions.find(c => c.id === a.id));

    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h1 className="page-title">🤝 Companion Suggestions</h1>
            <p className="page-subtitle">Plants that work well with your selections</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setStage('browse')}>← Back</button>
        </div>

        <div className="zone-banner" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: '1.5rem' }}>🌿</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Your selections ({selected.length} plants)</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{selected.map(p => `${p.emoji} ${p.name}`).join(' · ')}</div>
          </div>
        </div>

        {companionNotSelected.length > 0 && (
          <>
            <div className="section-title">🌸 Companion Plants</div>
            <p style={{ color: 'var(--text-mid)', fontSize: '0.9rem', marginBottom: 16 }}>These plants grow especially well alongside your selections.</p>
            <div className="plants-grid" style={{ marginBottom: 32 }}>
              {companionNotSelected.map(p => (
                <PlantCard key={p.id} plant={p} selected={isSelected(p)} onToggle={() => togglePlant(p)} onInfo={() => setDetailPlant(p)} />
              ))}
            </div>
          </>
        )}

        {aiNotSelected.length > 0 && (
          <>
            <div className="section-title">🤖 AI Recommendations</div>
            <p style={{ color: 'var(--text-mid)', fontSize: '0.9rem', marginBottom: 16 }}>Claude analyzed your zone and selections and suggests these additions.</p>
            <div className="plants-grid" style={{ marginBottom: 32 }}>
              {aiNotSelected.map(p => (
                <PlantCard key={p.id} plant={p} selected={isSelected(p)} onToggle={() => togglePlant(p)} onInfo={() => setDetailPlant(p)} />
              ))}
            </div>
          </>
        )}

        {companionNotSelected.length === 0 && aiNotSelected.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🌱</div>
            <div className="empty-state-title">Loading suggestions...</div>
          </div>
        )}

        <div style={{ height: 80 }} />
        <div className="cart-bar visible">
          <div className="cart-plants">
            {selected.map(p => (
              <span key={p.id} className="cart-plant-chip">{p.emoji} {p.name}</span>
            ))}
          </div>
          <button className="btn btn-gold btn-lg" onClick={continueToBuilder} disabled={savingPlants}>
            {savingPlants ? '...' : `Build Garden (${selected.length}) 🗺️`}
          </button>
        </div>
        {detailPlant && <PlantDetailModal plant={detailPlant} selected={isSelected(detailPlant)} onToggle={() => togglePlant(detailPlant)} onClose={() => setDetailPlant(null)} />}
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">🌿 Pick Your Plants</h1>
          <p className="page-subtitle">{garden.name} · Zone {garden.zone}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate({ name: 'dashboard' })}>← Dashboard</button>
      </div>

      <div className="zone-banner">
        <span style={{ fontSize: '2rem' }}>🌡️</span>
        <div>
          <div className="zone-label">Zone {garden.zone}</div>
          <div className="zone-desc">{garden.climate_type} climate · {garden.location}</div>
        </div>
      </div>

      <div className="search-bar">
        <input className="search-input" placeholder="Search plants..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="filter-bar">
        <strong style={{ fontSize: '0.8rem', alignSelf: 'center', color: 'var(--text-mid)' }}>Climate:</strong>
        {CLIMATES.map(c => (
          <button key={c} className={`filter-chip ${climateFilter === c ? 'active' : ''}`}
            onClick={() => setClimateFilter(c)}>
            {c === 'all' ? '🌍 All' : c === 'tundra' ? '🏔️ Tundra' : c === 'temperate' ? '🌲 Temperate' : c === 'subtropical' ? '🌴 Subtropical' : '🌺 Tropical'}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <strong style={{ fontSize: '0.8rem', alignSelf: 'center', color: 'var(--text-mid)' }}>Category:</strong>
        {CATEGORIES.map(c => (
          <button key={c} className={`filter-chip ${catFilter === c ? 'active' : ''}`}
            onClick={() => setCatFilter(c)}>
            {c === 'all' ? 'All' : c === 'aquatic' ? '🌊 Aquatic' : c.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="loading-spinner" /><span>Loading plants...</span></div>
      ) : allPlants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No plants found</div>
          <p>Try different filters or search terms</p>
        </div>
      ) : (
        <div className="plants-grid">
          {allPlants.map(p => (
            <PlantCard key={p.id} plant={p} selected={isSelected(p)} onToggle={() => togglePlant(p)} onInfo={() => setDetailPlant(p)} />
          ))}
        </div>
      )}

      <div style={{ height: 80 }} />

      <div className={`cart-bar ${selected.length > 0 ? 'visible' : ''}`}>
        <div className="cart-plants">
          {selected.slice(0, 5).map(p => (
            <span key={p.id} className="cart-plant-chip">{p.emoji} {p.name}</span>
          ))}
          {selected.length > 5 && <span className="cart-plant-chip">+{selected.length - 5} more</span>}
        </div>
        <button className="btn btn-gold" onClick={goToCompanions}>
          Next: Companions ({selected.length}) →
        </button>
      </div>

      {detailPlant && (
        <PlantDetailModal
          plant={detailPlant}
          selected={isSelected(detailPlant)}
          onToggle={() => togglePlant(detailPlant)}
          onClose={() => setDetailPlant(null)}
        />
      )}
    </div>
  );
}
