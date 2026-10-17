import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination helper. Slices `items` into pages of `pageSize`,
 * and resets to page 1 whenever the underlying item list changes length/order.
 */
export default function usePagination(items, pageSize = 8) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [items, pageCount, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { page, setPage, pageCount, pageItems, pageSize, totalItems: items.length };
}
