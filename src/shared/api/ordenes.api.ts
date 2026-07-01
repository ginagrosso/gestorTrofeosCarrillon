import { apiClient } from './client'
import type { InsertOrden, OrdenDeTrabajo, OrdenDeTrabajoConItems, UpdateOrdenPago } from '../lib/types'

export const ordenesApi = {
  list: () =>
    apiClient<{ data: OrdenDeTrabajo[] }>('/v1/ordenes'),

  getById: (id: string) =>
    apiClient<{ data: OrdenDeTrabajoConItems }>(`/v1/ordenes/${id}`),

  create: (data: InsertOrden) =>
    apiClient<{ data: OrdenDeTrabajoConItems }>('/v1/ordenes', { method: 'POST', body: JSON.stringify(data) }),

  updatePago: (id: string, data: UpdateOrdenPago) =>
    apiClient<{ data: OrdenDeTrabajo }>(`/v1/ordenes/${id}/pago`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/ordenes/${id}`, { method: 'DELETE' }),
}
