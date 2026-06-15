import { apiClient } from './client'
import type { Producto, InsertProducto, UpdateProducto } from '../lib/types'

export const productosApi = {
  list: () =>
    apiClient<{ data: Producto[] }>('/v1/productos'),

  getById: (id: string) =>
    apiClient<{ data: Producto }>(`/v1/productos/${id}`),

  create: (data: InsertProducto) =>
    apiClient<{ data: Producto }>('/v1/productos', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateProducto) =>
    apiClient<{ data: Producto }>(`/v1/productos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/productos/${id}`, { method: 'DELETE' }),
}
