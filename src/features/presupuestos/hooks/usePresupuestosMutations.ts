import { useMutation, useQueryClient } from '@tanstack/react-query'
import { presupuestosApi } from '@/shared/api/presupuestos.api'
import { toast } from 'sonner'

export const useCreatePresupuesto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: presupuestosApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      toast.success('Presupuesto creado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdatePresupuesto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof presupuestosApi.update>[1] }) =>
      presupuestosApi.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      qc.invalidateQueries({ queryKey: ['presupuestos', id] })
      toast.success('Presupuesto actualizado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeletePresupuesto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: presupuestosApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      toast.success('Presupuesto eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
