import { AppError } from '../../shared/lib/app-error.js'
import { proveedoresRepository } from './proveedores.repository.js'
import type { InsertProveedor, UpdateProveedor, Proveedor } from './proveedores.schema.js'

export const proveedoresService = {

  async getAll(): Promise<Proveedor[]> {
    return proveedoresRepository.findAll()
  },

  async getById(id: string): Promise<Proveedor> {
    const proveedor = await proveedoresRepository.findById(id)
    if (!proveedor) throw new AppError(404, 'Proveedor no encontrado')
    return proveedor
  },

  async create(data: InsertProveedor): Promise<Proveedor> {
    return proveedoresRepository.create(data)
  },

  async update(id: string, data: UpdateProveedor): Promise<Proveedor> {
    await this.getById(id) // lanza 404 si no existe
    return proveedoresRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    await this.getById(id) // lanza 404 si no existe
    await proveedoresRepository.softDelete(id)
  },
}
