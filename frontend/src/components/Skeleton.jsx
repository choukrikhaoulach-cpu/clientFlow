export function TableSkeleton({ columns = 5, rows = 5 }) {
  return (
    <div className="table-wrap">
      <table className="data-table skeleton-table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((__, c) => (
                <td key={c}>
                  <span className="skeleton-line" style={{ width: c === 0 ? "70%" : "50%" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-12">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <span className="skeleton-circle" />
          <div style={{ flex: 1 }}>
            <span className="skeleton-line" style={{ width: "45%", marginBottom: 8 }} />
            <span className="skeleton-line" style={{ width: "25%", height: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }) {
  return (
    <div className="grid-2">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="card" style={{ boxShadow: "none", border: "1px solid var(--color-border)" }}>
          <span className="skeleton-line" style={{ width: "50%", marginBottom: 12 }} />
          <span className="skeleton-line" style={{ width: "90%", marginBottom: 6 }} />
          <span className="skeleton-line" style={{ width: "70%" }} />
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="stat-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="stat-card" key={i}>
          <span className="skeleton-line" style={{ width: "60%", height: 10 }} />
          <span className="skeleton-line" style={{ width: "40%", height: 24, marginTop: 12 }} />
        </div>
      ))}
    </div>
  );
}
