import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { api } from "../api";

const tooltipStyle = {
  contentStyle: {
    background: "#ffffff",
    border: "1.5px solid #e4e9da",
    borderRadius: "10px",
    boxShadow: "0 4px 16px rgba(74,124,89,0.1)",
    fontFamily: "'DM Sans', sans-serif",
  },
  labelStyle: {
    color: "#1e2b1a",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    marginBottom: "4px",
    fontSize: "13px",
  },
  itemStyle: {
    color: "#6b7f62",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "12px",
  },
};

export default function AnalyticsTab() {
  const [days, setDays]           = useState(7);
  const [chartData, setChartData] = useState([]);
  const [feedback, setFeedback]   = useState([]);
  const [loading, setLoading]     = useState(true);

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

  const avg = chartData.length
    ? {
        protein:  Math.round(chartData.reduce((s, d) => s + d.protein,  0) / chartData.length),
        carbs:    Math.round(chartData.reduce((s, d) => s + d.carbs,    0) / chartData.length),
        fat:      Math.round(chartData.reduce((s, d) => s + d.fat,      0) / chartData.length),
        calories: Math.round(chartData.reduce((s, d) => s + d.calories, 0) / chartData.length),
      }
    : null;

  return (
    <div>
      <div className="days-picker">
        <span>Last</span>
        {[7, 14, 30].map(d => (
          <button key={d} className={days === d ? "active-days" : ""} onClick={() => setDays(d)}>
            {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Crunching your numbers…</div>
      ) : (
        <>
          {avg && (
            <div className="stat-strip">
              {[
                { label: "Avg Protein",  val: `${avg.protein}g`,   color: "var(--protein-fg)" },
                { label: "Avg Carbs",    val: `${avg.carbs}g`,     color: "var(--carbs-fg)"   },
                { label: "Avg Fat",      val: `${avg.fat}g`,       color: "var(--fat-fg)"     },
                { label: "Avg Calories", val: avg.calories,        color: "var(--cal-fg)"     },
              ].map(s => (
                <div className="stat-box" key={s.label}>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3>
              <span className="card-icon" style={{ background: "#e8f2e9", fontSize: "15px" }}>📊</span>
              Macros Over Time
            </h3>
            {chartData.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📈</div>
                <span>Log some meals to see your trends here!</span>
              </div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={14} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e9da" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9aac8e" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9aac8e" }} width={36} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                    <Bar dataKey="protein" fill="#4a7c59" radius={[4,4,0,0]} name="Protein" />
                    <Bar dataKey="carbs"   fill="#3a7ebf" radius={[4,4,0,0]} name="Carbs" />
                    <Bar dataKey="fat"     fill="#d98f2a" radius={[4,4,0,0]} name="Fat" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <h3>
              <span className="card-icon" style={{ background: "#fdeee9", fontSize: "15px" }}>🔥</span>
              Calorie Trend
            </h3>
            {chartData.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📉</div>
                <span>No data yet — keep logging meals!</span>
              </div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e9da" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9aac8e" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9aac8e" }} width={42} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line
                      type="monotone" dataKey="calories" name="Calories"
                      stroke="#e06b4a" strokeWidth={2.5}
                      dot={{ r: 5, fill: "#e06b4a", strokeWidth: 2, stroke: "white" }}
                      activeDot={{ r: 7, strokeWidth: 2, stroke: "white" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <h3>
              <span className="card-icon" style={{ background: "#e8f2e9", fontSize: "15px" }}>💡</span>
              Personalized Insights
            </h3>
            {feedback.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">💬</div>
                <span>Insights will appear as you log more meals.</span>
              </div>
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
