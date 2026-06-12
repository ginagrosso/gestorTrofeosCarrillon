import { apiClient } from './client'
import type { Producto } from '../lib/types'

export const productosApi = {
  list: () =>
    apiClient<{ data: Producto[] }>('/v1/productos'),
}
