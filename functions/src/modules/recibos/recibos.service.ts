import { AppError } from '../../shared/lib/app-error.js'
import { recibosRepository } from './recibos.repository.js'
import type { InsertRecibo } from './recibos.schema.js'

export const recibosService = {
  async getAll() {
    return recibosRepository.findAll()
  },

  async getById(id: string) {
    const recibo = await recibosRepository.findById(id)
    if (!recibo) throw new AppError(404, 'Recibo no encontrado')
    return recibo
  },

  async create(data: InsertRecibo) {
    return recibosRepository.create(data)
  },

  async delete(id: string) {
    const recibo = await recibosRepository.findById(id)
    if (!recibo) throw new AppError(404, 'Recibo no encontrado')
    await recibosRepository.softDelete(id)
  },
}
