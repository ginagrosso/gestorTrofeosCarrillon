import { useMutation, useQueryClient } from '@tanstack/react-query'
import { comprasApi } from '@/shared/api/compras.api'
import { toast } from 'sonner'

export const useCreateCompra = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: comprasApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras'] })
      qc.invalidateQueries({ queryKey: ['articulos'] })
      toast.success('Compra registrada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteCompra = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: comprasApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras'] })
      qc.invalidateQueries({ queryKey: ['articulos'] })
      toast.success('Compra eliminada y stock revertido')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
