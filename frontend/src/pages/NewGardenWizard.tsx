import React, { useState } from "react";
import { useAuth, useNav } from "../App";
import { gardens, zone } from "../api";

type Step = "info" | "locating" | "zone" | "size";

export default function NewGardenWizard() {
  const { user } = useAuth();
  const { navigate } = useNav();

  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState({
    name: "",
    location: "",
    width: "20",
    height: "15",
  });
  const [coords, setCoords] = useState({ lat: 40.0, lon: -100.0 });
  const [detectedZone, setDetectedZone] = useState<{
    zone: string;
    climate_type: string;
    description: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const detectZone = async () => {
    if (!form.location.trim()) {
      setError("Please enter a location");
      return;
    }
    setError("");
    setLoading(true);
    setStep("locating");

    try {
      // Geocode the location string using OpenStreetMap Nominatim (free, no key needed)
      let lat = 40.0;
      let lon = -100.0;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.location)}&format=json&limit=1`,
          {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "Sympos-Garden-App/1.0",
            },
          },
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lon = parseFloat(geoData[0].lon);
          console.log("Geocoded", form.location, "to", lat, lon);
          setCoords({ lat, lon });
        }
      } catch (geoErr) {
        console.warn("Geocoding failed, using default coords");
      }

      const res = await zone.detect({
        latitude: lat,
        longitude: lon,
        location: form.location,
      });
      setDetectedZone(res.data);
      setStep("zone");
    } catch (e) {
      setError("Could not detect zone. Please try again.");
      setStep("info");
    }
    setLoading(false);
  };

  const createGarden = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await gardens.create({
        user_id: user.id,
        name: form.name,
        location: form.location,
        latitude: coords.lat,
        longitude: coords.lon,
        zone: detectedZone?.zone || "7b",
        climate_type: detectedZone?.climate_type || "temperate",
        width: parseFloat(form.width),
        height: parseFloat(form.height),
      });
      navigate({ name: "plant-selection", garden: res.data });
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to create garden");
    }
    setLoading(false);
  };

  const stepNums: Record<Step, number> = {
    info: 1,
    locating: 2,
    zone: 3,
    size: 3,
  };
  const currentStep = stepNums[step];

  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 className="page-title">🌱 New Garden</h1>
        <p className="page-subtitle">Let's set up your new garden space</p>

        {/* Stepper */}
        <div className="stepper">
          {[
            ["1", "Name"],
            ["2", "Location"],
            ["3", "Zone & Size"],
          ].map(([num, label], i) => (
            <React.Fragment key={num}>
              <div
                className={`step ${currentStep === i + 1 ? "active" : currentStep > i + 1 ? "done" : ""}`}
              >
                <div className="step-num">
                  {currentStep > i + 1 ? "✓" : num}
                </div>
                <span className="step-label">{label}</span>
              </div>
              {i < 2 && <div className="step-divider" />}
            </React.Fragment>
          ))}
        </div>

        <div className="card">
          {step === "info" && (
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--green-dark)",
                  marginBottom: 24,
                  fontSize: "1.2rem",
                }}
              >
                Name Your Garden
              </h2>
              <div className="form-group">
                <label className="form-label">Garden Name</label>
                <input
                  className="input"
                  placeholder="e.g. Backyard Paradise, Front Food Forest..."
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Location (City, State or Zip Code)
                </label>
                <input
                  className="input"
                  placeholder="e.g. Provo, UT or 84604"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && detectZone()}
                />
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-mid)",
                    marginTop: 4,
                  }}
                >
                  We'll use this to determine your gardening zone and suggest
                  compatible plants.
                </p>
              </div>
              {error && (
                <div
                  style={{
                    color: "var(--red)",
                    fontSize: "0.9rem",
                    marginBottom: 12,
                  }}
                >
                  {error}
                </div>
              )}
              <button
                className="btn btn-primary btn-lg"
                onClick={detectZone}
                disabled={loading || !form.name || !form.location}
              >
                Detect My Zone 🔍
              </button>
            </div>
          )}

          {step === "locating" && (
            <div className="loading-center" style={{ padding: 40 }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🗺️</div>
              <div className="loading-spinner" />
              <p style={{ fontWeight: 700 }}>
                Detecting your gardening zone...
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>
                Analyzing climate data for {form.location}
              </p>
            </div>
          )}

          {(step === "zone" || step === "size") && detectedZone && (
            <div>
              <div className="zone-banner">
                <span style={{ fontSize: "2.5rem" }}>🌡️</span>
                <div>
                  <div className="zone-label">Zone {detectedZone.zone}</div>
                  <div className="zone-desc">
                    {detectedZone.climate_type} climate ·{" "}
                    {detectedZone.description}
                  </div>
                </div>
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--green-dark)",
                  marginBottom: 20,
                  fontSize: "1.2rem",
                }}
              >
                Garden Dimensions
              </h2>
              <p
                style={{
                  color: "var(--text-mid)",
                  fontSize: "0.9rem",
                  marginBottom: 20,
                }}
              >
                Enter the size of your garden in feet. This will create a grid
                layout for planning.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div className="form-group">
                  <label className="form-label">Width (ft)</label>
                  <input
                    className="input"
                    type="number"
                    min="5"
                    max="100"
                    value={form.width}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, width: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (ft)</label>
                  <input
                    className="input"
                    type="number"
                    min="5"
                    max="100"
                    value={form.height}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, height: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  background: "var(--gray-light)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 20,
                  fontSize: "0.85rem",
                  color: "var(--text-mid)",
                }}
              >
                📐 Your garden will be a{" "}
                <strong>
                  {form.width} × {form.height} ft
                </strong>{" "}
                grid (
                {Math.round(parseFloat(form.width) * parseFloat(form.height))}{" "}
                sq ft)
              </div>

              {error && (
                <div
                  style={{
                    color: "var(--red)",
                    fontSize: "0.9rem",
                    marginBottom: 12,
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setStep("info")}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={createGarden}
                  disabled={loading}
                >
                  {loading ? "..." : "Create Garden & Pick Plants 🌿"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
