import { useQuery } from '@tanstack/react-query'
import { recibosApi } from '@/shared/api/recibos.api'

export const useRecibos = () =>
  useQuery({
    queryKey: ['recibos'],
    queryFn:  recibosApi.list,
    select:   res => res.data,
  })
