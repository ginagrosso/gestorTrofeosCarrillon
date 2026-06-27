import { useQuery } from '@tanstack/react-query'
import { presupuestosApi } from '@/shared/api/presupuestos.api'

export const usePresupuestos = () =>
  useQuery({
    queryKey: ['presupuestos'],
    queryFn:  () => presupuestosApi.list(),
    select:   res => res.data,
  })

export const usePresupuesto = (id: string | null) =>
  useQuery({
    queryKey: ['presupuestos', id],
    queryFn:  () => presupuestosApi.getById(id!),
    enabled:  !!id,
    select:   res => res.data,
  })
