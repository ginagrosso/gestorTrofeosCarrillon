import { useMutation, useQueryClient } from '@tanstack/react-query'
import { articulosApi } from '@/shared/api/articulos.api'
import type { UpdateArticulo } from '@/shared/lib/types'
import { toast } from 'sonner'

export const useCreateArticulo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: articulosApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articulos'] })
      toast.success('Artículo creado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateArticulo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticulo }) =>
      articulosApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articulos'] })
      toast.success('Artículo actualizado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteArticulo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: articulosApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articulos'] })
      toast.success('Artículo eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useActualizarPreciosPorProveedor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: articulosApi.actualizarPreciosPorProveedor,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['articulos'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['producto-articulos'] })
      const { articulosActualizados, productosActualizados } = res.data
      toast.success(
        productosActualizados > 0
          ? `Se actualizaron ${articulosActualizados} artículos y ${productosActualizados} productos`
          : `Se actualizaron ${articulosActualizados} artículos`,
      )
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
