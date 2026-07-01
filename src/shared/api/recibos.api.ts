import { apiClient } from './client'
import type { Recibo, InsertRecibo } from '../lib/types'

export const recibosApi = {
  list: () =>
    apiClient<{ data: Recibo[] }>('/v1/recibos'),

  getById: (id: string) =>
    apiClient<{ data: Recibo }>(`/v1/recibos/${id}`),

  create: (data: InsertRecibo) =>
    apiClient<{ data: Recibo }>('/v1/recibos', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/recibos/${id}`, { method: 'DELETE' }),
}
