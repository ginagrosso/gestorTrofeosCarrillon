import { useQuery } from '@tanstack/react-query'
import { articulosApi } from '@/shared/api/articulos.api'
import { compararAlfabetico } from '@/shared/lib/sort'

export const useArticulos = () =>
  useQuery({
    queryKey: ['articulos'],
    queryFn:  () => articulosApi.list(),
    select:   res => [...res.data].sort((a, b) => compararAlfabetico(a.descripcion, b.descripcion)),
  })
