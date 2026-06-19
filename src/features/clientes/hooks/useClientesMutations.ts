import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesApi } from '@/shared/api/clientes.api'
import type { UpdateCliente } from '@/shared/lib/types'
import { toast } from 'sonner'

export const useCreateCliente = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clientesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateCliente = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCliente }) =>
      clientesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente actualizado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteCliente = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clientesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
