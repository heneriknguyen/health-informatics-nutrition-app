import { useState } from "react";
import { api, saveSession } from "../api";
import "../styles/auth.css";

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function setF(k) {
    return e => setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const data = await api(path, { method: "POST", body, auth: false });
      saveSession(data.token, data.user);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="auth-bg">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3C10 3 6 7 6 11a4 4 0 0 0 8 0c0-4-4-8-4-8Z" fill="white" opacity="0.9"/>
              <path d="M7 13.5C5.5 12.5 5 11 5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="auth-logo-text">Nutri<span>Track</span></div>
        </div>

        <p className="auth-tagline">
          {isLogin ? "Welcome back! Log in to your account." : "Create an account to start tracking."}
        </p>

        {/* Mode toggle */}
        <div className="auth-toggle">
          <button
            type="button"
            className={isLogin ? "active" : ""}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={!isLogin ? "active" : ""}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="auth-name">Your Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={setF("name")}
                required={!isLogin}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={setF("email")}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder={isLogin ? "Your password" : "At least 6 characters"}
              value={form.password}
              onChange={setF("password")}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? (isLogin ? "Logging in…" : "Creating account…")
              : (isLogin ? "Log In" : "Create Account")}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => { setMode(isLogin ? "register" : "login"); setError(""); }}>
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
