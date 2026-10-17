import { labelize } from "../utils/format";

const TONES = {
  // invoice statuses
  draft: "neutral",
  sent: "info",
  paid: "accent",
  overdue: "danger",
  cancelled: "neutral",
  // project statuses
  planning: "info",
  in_progress: "primary",
  completed: "accent",
  on_hold: "warning",
  // task statuses
  todo: "neutral",
  // priorities
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export default function StatusBadge({ value }) {
  const tone = TONES[value] || "neutral";
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {labelize(value)}
    </span>
  );
}
