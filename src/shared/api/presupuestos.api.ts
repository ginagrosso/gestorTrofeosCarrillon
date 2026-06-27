import { apiClient } from './client'
import type { InsertPresupuesto, Presupuesto, PresupuestoConItems, UpdatePresupuesto } from '../lib/types'

export const presupuestosApi = {
  list: () =>
    apiClient<{ data: Presupuesto[] }>('/v1/presupuestos'),

  getById: (id: string) =>
    apiClient<{ data: PresupuestoConItems }>(`/v1/presupuestos/${id}`),

  create: (data: InsertPresupuesto) =>
    apiClient<{ data: PresupuestoConItems }>('/v1/presupuestos', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdatePresupuesto) =>
    apiClient<{ data: PresupuestoConItems }>(`/v1/presupuestos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/presupuestos/${id}`, { method: 'DELETE' }),
}
