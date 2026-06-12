import { useQuery } from '@tanstack/react-query'
import { clientesApi } from '@/shared/api/clientes.api'

export const useClientes = () =>
  useQuery({
    queryKey: ['clientes'],
    queryFn:  () => clientesApi.list(),
    select:   res => res.data,
  })
