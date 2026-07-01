import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ordenesApi } from '@/shared/api/ordenes.api'
import { toast } from 'sonner'
import type { UpdateOrdenPago } from '@/shared/lib/types'

export const useCreateOrden = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ordenesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Orden de trabajo creada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateOrdenPago = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrdenPago }) =>
      ordenesApi.updatePago(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['ordenes'] })
      qc.invalidateQueries({ queryKey: ['ordenes', id] })
      toast.success('Pago actualizado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteOrden = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ordenesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Orden eliminada y stock revertido')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
