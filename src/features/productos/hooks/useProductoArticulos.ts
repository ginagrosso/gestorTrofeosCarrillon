import { useQuery } from '@tanstack/react-query'
import { productoArticulosApi } from '@/shared/api/producto-articulos.api'

export const useProductoArticulos = (productoId: string | undefined) =>
  useQuery({
    queryKey: ['producto-articulos', productoId],
    queryFn:  () => productoArticulosApi.getByProducto(productoId!),
    select:   res => res.data,
    enabled:  !!productoId,
  })

export const useAllProductoArticulos = () =>
  useQuery({
    queryKey: ['producto-articulos', 'all'],
    queryFn:  () => productoArticulosApi.getAll(),
    select:   res => res.data,
  })
