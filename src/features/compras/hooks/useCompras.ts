import { useQuery } from '@tanstack/react-query'
import { comprasApi } from '@/shared/api/compras.api'

export const useCompras = () =>
  useQuery({
    queryKey: ['compras'],
    queryFn:  () => comprasApi.list(),
    select:   res => res.data,
  })
