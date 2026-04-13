export default function EmptyState({ icon = "i", title, message, compact = false }) {
  return (
    <div className={`empty-state ${compact ? "empty-state-compact" : ""}`}>
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
