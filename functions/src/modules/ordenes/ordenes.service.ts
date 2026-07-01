import { AppError } from '../../shared/lib/app-error.js'
import { ordenesRepository } from './ordenes.repository.js'
import type { InsertOrden, Orden, OrdenConItems, UpdateOrdenPago } from './ordenes.schema.js'

export const ordenesService = {

  async getAll(): Promise<Orden[]> {
    return ordenesRepository.findAll()
  },

  async getById(id: string): Promise<OrdenConItems> {
    const orden = await ordenesRepository.findByIdConItems(id)
    if (!orden) throw new AppError(404, 'Orden no encontrada')
    return orden
  },

  async create(data: InsertOrden): Promise<OrdenConItems> {
    return ordenesRepository.create(data)
  },

  async updatePago(id: string, data: UpdateOrdenPago): Promise<Orden> {
    const exists = await ordenesRepository.findById(id)
    if (!exists) throw new AppError(404, 'Orden no encontrada')
    return ordenesRepository.updatePago(id, data)
  },

  async delete(id: string): Promise<void> {
    const exists = await ordenesRepository.findById(id)
    if (!exists) throw new AppError(404, 'Orden no encontrada')
    await ordenesRepository.softDelete(id)
  },
}
