import { useMutation, useQueryClient } from '@tanstack/react-query'
import { empresasApi } from '@/shared/api/empresas.api'
import type { UpdateEmpresa } from '@/shared/lib/types'
import { toast } from 'sonner'

export const useCreateEmpresa = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: empresasApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] })
      toast.success('Empresa creada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateEmpresa = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmpresa }) =>
      empresasApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] })
      toast.success('Empresa actualizada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteEmpresa = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: empresasApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] })
      toast.success('Empresa eliminada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
