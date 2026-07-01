import { AppError } from '../../shared/lib/app-error.js'
import { empresasRepository } from './empresas.repository.js'
import type { InsertEmpresa, UpdateEmpresa, Empresa } from './empresas.schema.js'

export const empresasService = {

  async getAll(): Promise<Empresa[]> {
    return empresasRepository.findAll()
  },

  async getById(id: string): Promise<Empresa> {
    const empresa = await empresasRepository.findById(id)
    if (!empresa) throw new AppError(404, 'Empresa no encontrada')
    return empresa
  },

  async create(data: InsertEmpresa): Promise<Empresa> {
    return empresasRepository.create(data)
  },

  async update(id: string, data: UpdateEmpresa): Promise<Empresa> {
    await this.getById(id)
    return empresasRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    await this.getById(id)
    await empresasRepository.softDelete(id)
  },
}
