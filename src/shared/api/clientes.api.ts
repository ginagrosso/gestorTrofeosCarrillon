import { apiClient } from './client'
import type { Cliente, InsertCliente, UpdateCliente } from '../lib/types'

export const clientesApi = {
  list: () =>
    apiClient<{ data: Cliente[] }>('/v1/clientes'),

  getById: (id: string) =>
    apiClient<{ data: Cliente }>(`/v1/clientes/${id}`),

  create: (data: InsertCliente) =>
    apiClient<{ data: Cliente }>('/v1/clientes', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateCliente) =>
    apiClient<{ data: Cliente }>(`/v1/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/clientes/${id}`, { method: 'DELETE' }),
}
