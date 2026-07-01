import { apiClient } from './client'
import type { Empresa, InsertEmpresa, UpdateEmpresa } from '../lib/types'

export const empresasApi = {
  list: () =>
    apiClient<{ data: Empresa[] }>('/v1/empresas'),

  getById: (id: string) =>
    apiClient<{ data: Empresa }>(`/v1/empresas/${id}`),

  create: (data: InsertEmpresa) =>
    apiClient<{ data: Empresa }>('/v1/empresas', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateEmpresa) =>
    apiClient<{ data: Empresa }>(`/v1/empresas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/empresas/${id}`, { method: 'DELETE' }),
}
