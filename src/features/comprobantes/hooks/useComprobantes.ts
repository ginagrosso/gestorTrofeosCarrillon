import { useQuery } from '@tanstack/react-query'
import { comprobantesApi } from '@/shared/api/comprobantes.api'
import type { TipoComprobante } from '@/shared/lib/types'

interface ComprobanteFiltros {
  tipo?:      TipoComprobante
  empresaId?: string
}

export const useComprobantes = (filtros?: ComprobanteFiltros) =>
  useQuery({
    queryKey: ['comprobantes', filtros],
    queryFn:  () => comprobantesApi.list(filtros),
    select:   res => res.data,
  })
