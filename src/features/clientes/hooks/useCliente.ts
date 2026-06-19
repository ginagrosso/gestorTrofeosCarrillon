import { useQuery } from '@tanstack/react-query'
import { clientesApi } from '@/shared/api/clientes.api'

export const useCliente = (id: string) =>
  useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clientesApi.getById(id).then(r => r.data),
    enabled: !!id,
  })
