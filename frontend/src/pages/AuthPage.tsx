import React, { useState } from "react";
import { useAuth } from "../App";
import { auth } from "../api";

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      let res;
      if (mode === "login") {
        res = await auth.login(form.email, form.password);
      } else {
        if (!form.name) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        res = await auth.register(form.name, form.email, form.password);
      }
      login(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || "Something went wrong");
    }
    setLoading(false);
  };

  const demoLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await auth.demo();
      login(res.data);
    } catch (e: any) {
      setError(
        "Demo login failed — make sure the backend is running on port 3001",
      );
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: "3rem", marginBottom: 8 }}>🌿</div>
          <div className="auth-logo-text">Sympos</div>
          <div className="auth-logo-sub">Garden Design & Planning</div>
        </div>

        {mode === "register" && (
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              className="input"
              placeholder="Jane Gardener"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "..."
            : mode === "login"
              ? "🌱 Sign In"
              : "🌱 Create Account"}
        </button>

        <button
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={demoLogin}
          disabled={loading}
        >
          🎮 Try Demo
        </button>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setMode("register")}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
