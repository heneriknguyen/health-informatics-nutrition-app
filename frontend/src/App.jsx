import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import "./App.css";

const BASE = import.meta.env.VITE_API_URL || "/api";

async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function MacroBar({ label, value, goal, color }) {
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;
  const over = goal && value > goal;
  const unit = label === "Calories" ? " kcal" : "g";

  return (
    <div className="macro-box">
      <div className="macro-name">{label}</div>
      <div className="macro-value" style={{ color }}>
        {Math.round(value)}{unit}
      </div>
      <div className="progress-bar-bg">
        <div
          className="progress-bar-fill"
          style={{
            width: `${pct}%`,
            background: over ? "red" : color,
          }}
        />
      </div>
      <div className="macro-note">
        {goal
          ? over
            ? `Over by ${Math.round(value - goal)}${unit} (goal: ${goal}${unit})`
            : `${Math.round(goal - value)}${unit} remaining of ${goal}${unit} goal`
          : "No goal set"}
      </div>
    </div>
  );
}

function DashboardTab() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [meals, setMeals] = useState([]);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", protein: "", carbs: "", fat: "", calories: "" });
  const [submitting, setSubmitting] = useState(false);
  const [logError, setLogError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, g] = await Promise.all([
        api(`/meals?date=${date}`),
        api("/goals"),
      ]);
      setMeals(m);
      setGoals(g);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const totals = meals.reduce(
    (acc, m) => ({
      protein:  acc.protein  + Number(m.protein),
      carbs:    acc.carbs    + Number(m.carbs),
      fat:      acc.fat      + Number(m.fat),
      calories: acc.calories + Number(m.calories),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  async function logMeal() {
    if (!form.name.trim()) return;
    setLogError(""); setSubmitting(true);
    try {
      await api("/meals", {
        method: "POST",
        body: {
          name:     form.name,
          protein:  Number(form.protein)  || 0,
          carbs:    Number(form.carbs)    || 0,
          fat:      Number(form.fat)      || 0,
          calories: Number(form.calories) || 0,
          date,
        },
      });
      setForm({ name: "", protein: "", carbs: "", fat: "", calories: "" });
      load();
    } catch (err) { setLogError(err.message); }
    finally { setSubmitting(false); }
  }

  async function deleteMeal(id) {
    try {
      await api(`/meals/${id}`, { method: "DELETE" });
      setMeals(m => m.filter(x => x.id !== id));
    } catch (err) { console.error(err); }
  }

  function setF(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  return (
    <div>
      <div className="date-row">
        <label>Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        {date !== today && (
          <button className="btn-secondary" onClick={() => setDate(today)}>Go to Today</button>
        )}
      </div>

      <div className="card">
        <h3>Daily Macros</h3>
        <div className="macro-grid">
          <MacroBar label="Protein"  value={totals.protein}  goal={goals?.daily_protein_goal}  color="green" />
          <MacroBar label="Carbs"    value={totals.carbs}    goal={goals?.daily_carbs_goal}    color="steelblue" />
          <MacroBar label="Fat"      value={totals.fat}      goal={goals?.daily_fat_goal}      color="orange" />
          <MacroBar label="Calories" value={totals.calories} goal={goals?.daily_calorie_goal}  color="tomato" />
        </div>
      </div>

      <div className="card">
        <h3>Log a Meal</h3>
        <div className="form-row">
          <div className="field-wide">
            <label>Meal name</label>
            <input type="text" value={form.name} onChange={setF("name")} placeholder="e.g. Chicken and Rice" />
          </div>
          <div className="field">
            <label>Protein (g)</label>
            <input type="number" min="0" value={form.protein} onChange={setF("protein")} placeholder="0" />
          </div>
          <div className="field">
            <label>Carbs (g)</label>
            <input type="number" min="0" value={form.carbs} onChange={setF("carbs")} placeholder="0" />
          </div>
          <div className="field">
            <label>Fat (g)</label>
            <input type="number" min="0" value={form.fat} onChange={setF("fat")} placeholder="0" />
          </div>
          <div className="field">
            <label>Calories</label>
            <input type="number" min="0" value={form.calories} onChange={setF("calories")} placeholder="0" />
          </div>
        </div>
        <button onClick={logMeal} disabled={submitting}>
          {submitting ? "Adding..." : "Add Meal"}
        </button>
        {logError && <div className="error-msg">{logError}</div>}
      </div>

      <div className="card">
        <h3>Meals for {date === today ? "Today" : date} ({meals.length} logged)</h3>
        {loading ? (
          <div className="loading">Loading meals...</div>
        ) : meals.length === 0 ? (
          <div className="empty">No meals logged for this day.</div>
        ) : (
          meals.map(m => (
            <div className="meal-row" key={m.id}>
              <div>
                <div className="meal-name">{m.name}</div>
                <div className="meal-macros">
                  Protein: {m.protein}g &nbsp;|&nbsp;
                  Carbs: {m.carbs}g &nbsp;|&nbsp;
                  Fat: {m.fat}g &nbsp;|&nbsp;
                  Calories: {m.calories} kcal
                </div>
              </div>
              <button className="btn-small" onClick={() => deleteMeal(m.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [days, setDays] = useState(7);
  const [chartData, setChartData] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [totals, fb] = await Promise.all([
        api(`/analytics/daily-totals?days=${days}`),
        api(`/analytics/feedback?days=${days}`),
      ]);
      setChartData(totals.map(r => ({
        day:      r.day.slice(5),
        protein:  Math.round(Number(r.protein)),
        carbs:    Math.round(Number(r.carbs)),
        fat:      Math.round(Number(r.fat)),
        calories: Math.round(Number(r.calories)),
      })));
      setFeedback(fb.feedback || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, marginRight: 8 }}>Show last:</span>
        {[7, 14, 30].map(d => (
          <button
            key={d}
            style={{ marginRight: 6, background: days === d ? "#4a90d9" : "#aaa" }}
            onClick={() => setDays(d)}
          >
            {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : (
        <>
          <div className="card">
            <h3>Macros Over Time (grams)</h3>
            {chartData.length === 0 ? (
              <div className="empty">No data yet. Log some meals first!</div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="protein" fill="green" />
                    <Bar dataKey="carbs"   fill="steelblue" />
                    <Bar dataKey="fat"     fill="orange" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Calorie Trend (kcal)</h3>
            {chartData.length === 0 ? (
              <div className="empty">No data yet.</div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="calories" stroke="tomato" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Personalized Feedback</h3>
            {feedback.length === 0 ? (
              <div className="empty">No feedback available yet.</div>
            ) : (
              feedback.map((f, i) => (
                <div className="feedback-item" key={i}>{f}</div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function GoalsTab() {
  const [form, setForm] = useState({
    daily_protein_goal: "", daily_carbs_goal: "",
    daily_fat_goal: "",    daily_calorie_goal: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");
  const [error, setError]   = useState("");

  useEffect(() => {
    api("/goals").then(g => {
      if (g) setForm({
        daily_protein_goal: g.daily_protein_goal || "",
        daily_carbs_goal:   g.daily_carbs_goal   || "",
        daily_fat_goal:     g.daily_fat_goal      || "",
        daily_calorie_goal: g.daily_calorie_goal  || "",
      });
    }).catch(err => console.error(err));
  }, []);

  async function save() {
    setMsg(""); setError(""); setSaving(true);
    try {
      await api("/goals", {
        method: "PUT",
        body: {
          daily_protein_goal: Number(form.daily_protein_goal) || null,
          daily_carbs_goal:   Number(form.daily_carbs_goal)   || null,
          daily_fat_goal:     Number(form.daily_fat_goal)     || null,
          daily_calorie_goal: Number(form.daily_calorie_goal) || null,
        },
      });
      setMsg("Goals saved!");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function setF(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  return (
    <div>
      <div className="card">
        <h3>Set Daily Nutrition Goals</h3>
        <div className="goals-grid">
          <div>
            <label>Protein goal (g)</label>
            <input type="number" min="0" value={form.daily_protein_goal} onChange={setF("daily_protein_goal")} placeholder="e.g. 150" />
          </div>
          <div>
            <label>Carbs goal (g)</label>
            <input type="number" min="0" value={form.daily_carbs_goal} onChange={setF("daily_carbs_goal")} placeholder="e.g. 200" />
          </div>
          <div>
            <label>Fat goal (g)</label>
            <input type="number" min="0" value={form.daily_fat_goal} onChange={setF("daily_fat_goal")} placeholder="e.g. 65" />
          </div>
          <div>
            <label>Calorie goal (kcal)</label>
            <input type="number" min="0" value={form.daily_calorie_goal} onChange={setF("daily_calorie_goal")} placeholder="e.g. 2000" />
          </div>
        </div>
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Goals"}
        </button>
        {msg   && <div className="success-msg">{msg}</div>}
        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "analytics", label: "Analytics" },
    { id: "goals",     label: "Goals" },
  ];

  return (
    <>
      <div className="header">NutriTrack</div>
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