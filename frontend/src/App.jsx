import { useState } from "react";
import "./styles/globals.css";
import "./styles/macros.css";
import "./styles/meals.css";
import "./styles/analytics.css";
import "./styles/goals.css";
import { getUser, clearSession } from "./api";
import AuthPage    from "./components/AuthPage";
import DashboardTab from "./components/DashboardTab";
import AnalyticsTab from "./components/AnalyticsTab";
import GoalsTab     from "./components/GoalsTab";

const TABS = [
  { id: "dashboard", label: "🏠 Dashboard" },
  { id: "analytics", label: "📈 Analytics" },
  { id: "goals",     label: "🎯 Goals"     },
];

function todayString() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function App() {
  const [user, setUser] = useState(() => getUser());
  const [tab, setTab]   = useState("dashboard");

  function handleAuth(u) {
    setUser(u);
    setTab("dashboard");
  }

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <>
      <div className="header">
        <div className="header-left">
          <div className="header-logo">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3C10 3 6 7 6 11a4 4 0 0 0 8 0c0-4-4-8-4-8Z" fill="white" opacity="0.9"/>
              <path d="M7 13.5C5.5 12.5 5 11 5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="header-title">Nutri<span>Track</span></div>
        </div>

        <div className="header-right">
          <div className="header-date-pill">{todayString()}</div>
          <div className="header-user">
            <div className="header-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="header-username">{user.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log out">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M13 14l3-4-3-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 10H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </div>

      <div className="main">
        <div className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "dashboard" && <DashboardTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "goals"     && <GoalsTab />}
      </div>
    </>
  );
}
