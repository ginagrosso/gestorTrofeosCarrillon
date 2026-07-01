import { useQuery } from '@tanstack/react-query'
import { ordenesApi } from '@/shared/api/ordenes.api'

export const useOrdenes = () =>
  useQuery({
    queryKey: ['ordenes'],
    queryFn:  () => ordenesApi.list(),
    select:   res => res.data,
  })

export const useOrden = (id: string | null) =>
  useQuery({
    queryKey: ['ordenes', id],
    queryFn:  () => ordenesApi.getById(id!),
    enabled:  !!id,
    select:   res => res.data,
  })
