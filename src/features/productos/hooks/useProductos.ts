import { useQuery } from '@tanstack/react-query'
import { productosApi } from '@/shared/api/productos.api'

export const useProductos = () =>
  useQuery({
    queryKey: ['productos'],
    queryFn:  () => productosApi.list(),
    select:   res => res.data,
  })
