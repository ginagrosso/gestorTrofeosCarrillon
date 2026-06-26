import { AppError } from '../../shared/lib/app-error.js'
import { comprasRepository } from './compras.repository.js'
import { proveedoresRepository } from '../proveedores/proveedores.repository.js'
import type { Compra, CompraConItems, InsertCompra } from './compras.schema.js'

export const comprasService = {

  async getAll(): Promise<Compra[]> {
    return comprasRepository.findAll()
  },

  async getById(id: string): Promise<CompraConItems> {
    const compra = await comprasRepository.findByIdConItems(id)
    if (!compra) throw new AppError(404, 'Compra no encontrada')
    return compra
  },

  async create(data: InsertCompra): Promise<CompraConItems> {
    const proveedor = await proveedoresRepository.findById(data.proveedorId)
    if (!proveedor) throw new AppError(404, 'Proveedor no encontrado')
    return comprasRepository.create(data)
  },

  async delete(id: string): Promise<void> {
    const compra = await comprasRepository.findById(id)
    if (!compra) throw new AppError(404, 'Compra no encontrada')
    await comprasRepository.softDelete(id)
  },
}
