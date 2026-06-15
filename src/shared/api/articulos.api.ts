import { apiClient } from './client'
import type { Articulo, InsertArticulo, UpdateArticulo, ActualizarPreciosPorProveedor } from '../lib/types'

export const articulosApi = {
  list: () =>
    apiClient<{ data: Articulo[] }>('/v1/articulos'),

  getById: (id: string) =>
    apiClient<{ data: Articulo }>(`/v1/articulos/${id}`),

  create: (data: InsertArticulo) =>
    apiClient<{ data: Articulo }>('/v1/articulos', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateArticulo) =>
    apiClient<{ data: Articulo }>(`/v1/articulos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/articulos/${id}`, { method: 'DELETE' }),

  actualizarPreciosPorProveedor: (data: ActualizarPreciosPorProveedor) =>
    apiClient<{ data: { articulosActualizados: number; productosActualizados: number } }>('/v1/articulos/precios-por-proveedor', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
