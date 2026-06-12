import { apiClient } from './client'
import type { Cliente } from '../lib/types'

export const clientesApi = {
  list: () =>
    apiClient<{ data: Cliente[] }>('/v1/clientes'),
}
