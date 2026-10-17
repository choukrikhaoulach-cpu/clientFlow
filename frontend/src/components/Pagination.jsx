import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageCount, onChange, totalItems, pageSize }) {
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const pages = [];
  const windowSize = 1;
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || (p >= page - windowSize && p <= page + windowSize)) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="pagination">
      <div className="pagination-summary">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{totalItems}</strong>
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn-ghost btn-icon"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`pagination-page ${p === page ? "active" : ""}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="btn btn-ghost btn-icon"
          disabled={page === pageCount}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
