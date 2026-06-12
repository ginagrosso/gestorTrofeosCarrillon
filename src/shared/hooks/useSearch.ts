import { useMemo, useState } from 'react'

export interface UseSearchResult<T> {
  search: string
  setSearch: (value: string) => void
  filteredItems: T[]
}

const normalize = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Filtra un arreglo por coincidencia de texto (insensible a mayúsculas/acentos) en los campos indicados. */
export function useSearch<T>(items: T[], fields: (keyof T)[]): UseSearchResult<T> {
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    const term = normalize(search.trim())
    if (!term) return items

    return items.filter(item =>
      fields.some(field => normalize(String(item[field] ?? '')).includes(term)),
    )
  }, [items, fields, search])

  return { search, setSearch, filteredItems }
}
