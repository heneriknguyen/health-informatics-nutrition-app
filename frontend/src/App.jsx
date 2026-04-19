import { useState } from "react";
import "./styles/globals.css";
import "./styles/macros.css";
import "./styles/meals.css";
import "./styles/analytics.css";
import "./styles/goals.css";
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
  const [tab, setTab] = useState("dashboard");

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
        <div className="header-date-pill">{todayString()}</div>
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
