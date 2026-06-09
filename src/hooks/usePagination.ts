import { useState } from 'react';

export function usePagination(totalItems: number, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    setPage,
    totalPages,
    pageSize,
    canPrev: page > 1,
    canNext: page < totalPages,
    prevPage: () => setPage(p => Math.max(1, p - 1)),
    nextPage: () => setPage(p => Math.min(totalPages, p + 1)),
  };
}