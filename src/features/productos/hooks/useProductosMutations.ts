import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productosApi } from '@/shared/api/productos.api'
import { productoArticulosApi } from '@/shared/api/producto-articulos.api'
import type { UpdateProducto, ReplaceProductoArticulos } from '@/shared/lib/types'
import { toast } from 'sonner'

export const useCreateProducto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productosApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Producto creado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateProducto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProducto }) =>
      productosApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Producto actualizado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteProducto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productosApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Producto eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useReplaceProductoArticulos = (productoId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ReplaceProductoArticulos) => productoArticulosApi.replace(productoId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['producto-articulos', productoId] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Lista de materiales guardada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
