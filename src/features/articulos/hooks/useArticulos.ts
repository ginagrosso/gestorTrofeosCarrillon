import { useQuery } from '@tanstack/react-query'
import { articulosApi } from '@/shared/api/articulos.api'

export const useArticulos = () =>
  useQuery({
    queryKey: ['articulos'],
    queryFn:  () => articulosApi.list(),
    select:   res => res.data,
  })
