import { apiClient } from './client'
import type { Proveedor, InsertProveedor, UpdateProveedor } from '../lib/types'

export const proveedoresApi = {
  list: () =>
    apiClient<{ data: Proveedor[] }>('/v1/proveedores'),

  getById: (id: string) =>
    apiClient<{ data: Proveedor }>(`/v1/proveedores/${id}`),

  create: (data: InsertProveedor) =>
    apiClient<{ data: Proveedor }>('/v1/proveedores', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateProveedor) =>
    apiClient<{ data: Proveedor }>(`/v1/proveedores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/proveedores/${id}`, { method: 'DELETE' }),
}
