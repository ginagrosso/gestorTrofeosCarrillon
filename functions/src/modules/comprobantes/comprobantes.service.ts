import { AppError } from '../../shared/lib/app-error.js'
import { comprobantesRepository } from './comprobantes.repository.js'
import type { InsertComprobante, Comprobante, ComprobanteConItems, ComprobanteQuery } from './comprobantes.schema.js'

export const comprobantesService = {

  async getAll(query: ComprobanteQuery): Promise<Comprobante[]> {
    return comprobantesRepository.findAll(query)
  },

  async getById(id: string): Promise<ComprobanteConItems> {
    const comprobante = await comprobantesRepository.findByIdConItems(id)
    if (!comprobante) throw new AppError(404, 'Comprobante no encontrado')
    return comprobante
  },

  async create(data: InsertComprobante): Promise<ComprobanteConItems> {
    return comprobantesRepository.create(data)
  },

  async delete(id: string): Promise<void> {
    const exists = await comprobantesRepository.findById(id)
    if (!exists) throw new AppError(404, 'Comprobante no encontrado')
    await comprobantesRepository.softDelete(id)
  },
}
