import { AppError } from '../../shared/lib/app-error.js'
import { presupuestosRepository } from './presupuestos.repository.js'
import type { InsertPresupuesto, Presupuesto, PresupuestoConItems, UpdatePresupuesto } from './presupuestos.schema.js'

export const presupuestosService = {

  async getAll(): Promise<Presupuesto[]> {
    return presupuestosRepository.findAll()
  },

  async getById(id: string): Promise<PresupuestoConItems> {
    const presupuesto = await presupuestosRepository.findByIdConItems(id)
    if (!presupuesto) throw new AppError(404, 'Presupuesto no encontrado')
    return presupuesto
  },

  async create(data: InsertPresupuesto): Promise<PresupuestoConItems> {
    return presupuestosRepository.create(data)
  },

  async update(id: string, data: UpdatePresupuesto): Promise<PresupuestoConItems> {
    const exists = await presupuestosRepository.findById(id)
    if (!exists) throw new AppError(404, 'Presupuesto no encontrado')
    return presupuestosRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    const exists = await presupuestosRepository.findById(id)
    if (!exists) throw new AppError(404, 'Presupuesto no encontrado')
    await presupuestosRepository.softDelete(id)
  },
}
