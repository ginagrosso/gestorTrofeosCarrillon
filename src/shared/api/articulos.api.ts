import { apiClient } from './client'
import type { Articulo } from '../lib/types'

export const articulosApi = {
  list: () =>
    apiClient<{ data: Articulo[] }>('/v1/articulos'),
}
