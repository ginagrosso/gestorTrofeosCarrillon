import { useQuery } from '@tanstack/react-query'
import { proveedoresApi } from '@/shared/api/proveedores.api'

export const useProveedores = () =>
  useQuery({
    queryKey: ['proveedores'],
    queryFn:  () => proveedoresApi.list(),
    select:   res => res.data,
  })
