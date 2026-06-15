import { apiClient } from './client'
import type { ProductoArticulo, ReplaceProductoArticulos } from '../lib/types'

export const productoArticulosApi = {
  getAll: () =>
    apiClient<{ data: ProductoArticulo[] }>('/v1/producto-articulos'),

  getByProducto: (productoId: string) =>
    apiClient<{ data: ProductoArticulo[] }>(`/v1/producto-articulos/${productoId}`),

  replace: (productoId: string, data: ReplaceProductoArticulos) =>
    apiClient<{ data: { bom: ProductoArticulo[]; precioCosto: number } }>(`/v1/producto-articulos/${productoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}
