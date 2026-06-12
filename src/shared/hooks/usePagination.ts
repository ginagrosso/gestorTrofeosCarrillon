import { useMemo, useState } from 'react'

export const DEFAULT_PAGE_SIZE = 20

export interface UsePaginationResult<T> {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  paginatedItems: T[]
  setPage: (page: number) => void
}

/** Paginación client-side sobre un arreglo ya cargado en memoria. */
export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE): UsePaginationResult<T> {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  )

  return { page: currentPage, totalPages, totalItems: items.length, pageSize, paginatedItems, setPage }
}
