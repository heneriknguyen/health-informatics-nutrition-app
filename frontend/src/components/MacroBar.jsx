import { MACRO_META } from "../api";

export default function MacroBar({ macroKey, value, goal }) {
  const { label, unit, color, bg, border } = MACRO_META[macroKey];
  const pct  = goal ? Math.min((value / goal) * 100, 100) : 0;
  const over = goal && value > goal;

  return (
    <div
      className="macro-box"
      style={{ "--macro-fg": color, "--macro-bg": bg, "--macro-border": border }}
    >
      <div className="macro-name">{label}</div>
      <div className="macro-value">
        {Math.round(value)}<span className="unit">{unit}</span>
      </div>
      <div className="progress-bar-bg">
        <div
          className={`progress-bar-fill${over ? " over" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`macro-note${over ? " over-note" : ""}`}>
        {goal
          ? over
            ? `${Math.round(value - goal)}${unit} over goal`
            : `${Math.round(goal - value)}${unit} remaining`
          : "No goal set — add one in Goals"}
      </div>
    </div>
  );
}
