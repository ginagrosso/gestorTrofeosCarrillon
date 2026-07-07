import { apiClient } from './client'
import type { Comprobante, ComprobanteConItems, InsertComprobante, TipoComprobante } from '../lib/types'

interface ComprobanteFiltros {
  tipo?:      TipoComprobante
  empresaId?: string
}

export const comprobantesApi = {
  list: (filtros?: ComprobanteFiltros) => {
    const params = new URLSearchParams()
    if (filtros?.tipo) params.set('tipo', filtros.tipo)
    if (filtros?.empresaId) params.set('empresaId', filtros.empresaId)
    const query = params.toString()
    return apiClient<{ data: Comprobante[] }>(`/v1/comprobantes${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    apiClient<{ data: ComprobanteConItems }>(`/v1/comprobantes/${id}`),

  create: (data: InsertComprobante) =>
    apiClient<{ data: ComprobanteConItems }>('/v1/comprobantes', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/comprobantes/${id}`, { method: 'DELETE' }),
}
