import { useMutation, useQueryClient } from '@tanstack/react-query'
import { proveedoresApi } from '@/shared/api/proveedores.api'
import type { UpdateProveedor } from '@/shared/lib/types'
import { toast } from 'sonner'

export const useCreateProveedor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: proveedoresApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
      toast.success('Proveedor creado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateProveedor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProveedor }) =>
      proveedoresApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
      toast.success('Proveedor actualizado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteProveedor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: proveedoresApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
      toast.success('Proveedor eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
