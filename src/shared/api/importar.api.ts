import { apiClient } from './client'
import type { ImportResult } from '../lib/types'

export const importarApi = {
  proveedores: (registros: unknown[]) =>
    apiClient<{ data: ImportResult }>('/v1/importar/proveedores', { method: 'POST', body: JSON.stringify(registros) }),

  clientes: (registros: unknown[]) =>
    apiClient<{ data: ImportResult }>('/v1/importar/clientes', { method: 'POST', body: JSON.stringify(registros) }),

  articulos: (registros: unknown[]) =>
    apiClient<{ data: ImportResult }>('/v1/importar/articulos', { method: 'POST', body: JSON.stringify(registros) }),

  productos: (registros: unknown[]) =>
    apiClient<{ data: ImportResult }>('/v1/importar/productos', { method: 'POST', body: JSON.stringify(registros) }),
}
