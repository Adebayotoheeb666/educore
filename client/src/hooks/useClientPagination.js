import { useState, useMemo, useEffect } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Client-side pagination for filtered arrays.
 * Resets to page 1 when total count or resetDeps change.
 */
export function useClientPagination(items, pageSize = DEFAULT_PAGE_SIZE, resetDeps = []) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, pageSize, ...resetDeps]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    paginatedItems,
    rangeStart,
    rangeEnd,
    pageSize,
  };
}
