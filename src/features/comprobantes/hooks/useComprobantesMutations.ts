import { useMutation, useQueryClient } from '@tanstack/react-query'
import { comprobantesApi } from '@/shared/api/comprobantes.api'
import { toast } from 'sonner'

export const useCreateComprobante = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: comprobantesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comprobantes'] })
      qc.invalidateQueries({ queryKey: ['empresas'] })
      toast.success('Comprobante generado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteComprobante = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: comprobantesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comprobantes'] })
      toast.success('Comprobante eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
