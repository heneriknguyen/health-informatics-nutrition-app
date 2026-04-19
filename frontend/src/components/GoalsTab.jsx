import { useState, useEffect } from "react";
import { api } from "../api";

const FIELDS = [
  { key: "daily_protein_goal",  label: "Protein",  unit: "g",    color: "var(--protein-fg)", bg: "var(--protein-bg)", border: "var(--green-mid)",  placeholder: "150",  tip: "Aim for ~0.8–1g per lb of body weight" },
  { key: "daily_carbs_goal",    label: "Carbs",    unit: "g",    color: "var(--carbs-fg)",   bg: "var(--carbs-bg)",   border: "var(--blue-mid)",   placeholder: "200",  tip: "Your main energy source" },
  { key: "daily_fat_goal",      label: "Fat",      unit: "g",    color: "var(--fat-fg)",     bg: "var(--fat-bg)",     border: "var(--amber-mid)",  placeholder: "65",   tip: "Healthy fats support brain and heart" },
  { key: "daily_calorie_goal",  label: "Calories", unit: "kcal", color: "var(--cal-fg)",     bg: "var(--cal-bg)",     border: "var(--coral-mid)",  placeholder: "2000", tip: "Based on your activity level" },
];

export default function GoalsTab() {
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
      setMsg("Goals saved! Your dashboard will now track against these targets.");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function setF(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  return (
    <div>
      <div className="card">
        <h3>
          <span className="card-icon" style={{ background: "#e8f2e9", fontSize: "15px" }}>🎯</span>
          Set Your Daily Goals
        </h3>

        <p className="goals-hint">
          Set your daily nutrition targets and we'll track your progress in real time on the Dashboard. Leave any field blank to skip that goal.
        </p>

        <div className="goals-grid">
          {FIELDS.map(f => (
            <div
              key={f.key}
              className="goal-field"
              style={{ "--macro-fg": f.color, "--macro-bg": f.bg, "--macro-border": f.border }}
            >
              <div className="goal-field-label">
                <span className="label-dot" style={{ background: f.color }} />
                <span>{f.label} ({f.unit})</span>
              </div>
              <input
                type="number" min="0"
                value={form[f.key]} onChange={setF(f.key)}
                placeholder={`e.g. ${f.placeholder}`}
              />
              <div style={{ fontSize: "11px", color: f.color, opacity: 0.7, marginTop: "6px", fontStyle: "italic" }}>
                {f.tip}
              </div>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Goals"}
        </button>
        {msg   && <div className="success-msg">✓ {msg}</div>}
        {error && <div className="error-msg">⚠ {error}</div>}
      </div>
    </div>
  );
}
