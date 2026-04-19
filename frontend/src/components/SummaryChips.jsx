import { MACRO_META } from "../api";

export default function SummaryChips({ totals }) {
  return (
    <div className="summary-row">
      {Object.entries(MACRO_META).map(([key, meta]) => (
        <div className="summary-chip" key={key}>
          <span className="dot" style={{ background: meta.color }} />
          {Math.round(totals[key])}{meta.unit} {meta.label}
        </div>
      ))}
    </div>
  );
}
