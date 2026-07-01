import { useQuery } from '@tanstack/react-query'
import { empresasApi } from '@/shared/api/empresas.api'

export const useEmpresas = () =>
  useQuery({
    queryKey: ['empresas'],
    queryFn:  () => empresasApi.list(),
    select:   res => res.data,
  })
