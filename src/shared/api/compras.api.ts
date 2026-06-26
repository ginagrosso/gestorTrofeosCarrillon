import { apiClient } from './client'
import type { Compra, CompraConItems, InsertCompra } from '../lib/types'

export const comprasApi = {
  list: () =>
    apiClient<{ data: Compra[] }>('/v1/compras'),

  getById: (id: string) =>
    apiClient<{ data: CompraConItems }>(`/v1/compras/${id}`),

  create: (data: InsertCompra) =>
    apiClient<{ data: CompraConItems }>('/v1/compras', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/compras/${id}`, { method: 'DELETE' }),
}
