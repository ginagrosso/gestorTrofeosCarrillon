import { useMutation, useQueryClient } from '@tanstack/react-query'
import { recibosApi } from '@/shared/api/recibos.api'
import type { InsertRecibo } from '@/shared/lib/types'

export function useCreateRecibo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InsertRecibo) => recibosApi.create(data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recibos'] })
    },
  })
}

export function useDeleteRecibo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recibosApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recibos'] })
    },
  })
}
