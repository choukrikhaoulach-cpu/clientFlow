export default function EmptyState({ title, description, actionLabel, onAction, icon }) {
  return (
    <div className="state-block">
      <div className="state-icon">
        {icon || (
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4" />
          </svg>
        )}
      </div>
      <h4>{title}</h4>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary mt-16" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
