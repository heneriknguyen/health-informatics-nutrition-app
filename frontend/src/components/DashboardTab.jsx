import { useState, useEffect, useCallback } from "react";
import { api, MACRO_META } from "../api";
import MacroBar from "./MacroBar";
import SummaryChips from "./SummaryChips";

export default function DashboardTab() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate]         = useState(today);
  const [meals, setMeals]       = useState([]);
  const [goals, setGoals]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ name: "", protein: "", carbs: "", fat: "", calories: "" });
  const [submitting, setSubmitting] = useState(false);
  const [logError, setLogError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, g] = await Promise.all([api(`/meals?date=${date}`), api("/goals")]);
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

  const isToday   = date === today;
  const dateLabel = isToday
    ? "Today"
    : new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div>
      {/* Date Navigation */}
      <div className="date-row">
        <label>Viewing</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        {!isToday && (
          <button className="btn-secondary" onClick={() => setDate(today)}>
            ↩ Back to Today
          </button>
        )}
      </div>

      {/* Macro Summary */}
      <div className="card">
        <h3>
          <span className="card-icon" style={{ background: "#e8f2e9", fontSize: "15px" }}>🥗</span>
          Nutrition for {dateLabel}
        </h3>
        <div className="macro-grid">
          {["protein", "carbs", "fat", "calories"].map(k => {
            const goalKey = k === "calories" ? "daily_calorie_goal" : `daily_${k}_goal`;
            return <MacroBar key={k} macroKey={k} value={totals[k]} goal={goals?.[goalKey]} />;
          })}
        </div>
      </div>

      {/* Log Meal */}
      <div className="card">
        <h3>
          <span className="card-icon" style={{ background: "#fdeee9", fontSize: "15px" }}>✏️</span>
          Log a Meal
        </h3>
        <div className="form-row">
          <div className="field-wide">
            <label>What did you eat?</label>
            <input
              type="text" value={form.name} onChange={setF("name")}
              placeholder="e.g. Chicken & Rice, Greek Yogurt…"
              onKeyDown={e => e.key === "Enter" && logMeal()}
            />
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
        <button onClick={logMeal} disabled={submitting || !form.name.trim()}>
          {submitting ? "Adding…" : "+ Add Meal"}
        </button>
        {logError && <div className="error-msg">⚠ {logError}</div>}
      </div>

      {/* Meals List */}
      <div className="card">
        <h3 style={{ justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="card-icon" style={{ background: "#e8f2fb", fontSize: "15px" }}>🍽️</span>
            Meals — {dateLabel}
          </span>
          {meals.length > 0 && (
            <span className="meal-count-badge">{meals.length} logged</span>
          )}
        </h3>

        {meals.length > 0 && <SummaryChips totals={totals} />}

        {loading ? (
          <div className="loading">Loading your meals…</div>
        ) : meals.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🍴</div>
            <span>No meals logged yet for {dateLabel}.</span>
            <span style={{ fontSize: "12px" }}>Add something above to get started!</span>
          </div>
        ) : (
          meals.map(m => (
            <div className="meal-row" key={m.id}>
              <div>
                <div className="meal-name">{m.name}</div>
                <div className="meal-macros">
                  {[
                    { key: "protein",  val: m.protein,  unit: "g"    },
                    { key: "carbs",    val: m.carbs,    unit: "g"    },
                    { key: "fat",      val: m.fat,      unit: "g"    },
                    { key: "calories", val: m.calories, unit: "kcal" },
                  ].map(({ key, val, unit }) => (
                    <span className="meal-macro-badge" key={key}>
                      <span className="badge-dot" style={{ background: MACRO_META[key].color }} />
                      {val}{unit}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn-small" onClick={() => deleteMeal(m.id)} title="Remove meal">
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
