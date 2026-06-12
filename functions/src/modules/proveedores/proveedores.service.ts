import { AppError } from '../../shared/lib/app-error.js'
import { proveedoresRepository } from './proveedores.repository.js'
import { insertProveedorSchema } from './proveedores.schema.js'
import type { InsertProveedor, UpdateProveedor, Proveedor } from './proveedores.schema.js'
import type { ImportResult } from '../../shared/lib/import-result.js'

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

  async importar(registros: unknown[]): Promise<ImportResult> {
    const resultado: ImportResult = { creados: 0, actualizados: 0, errores: [] }

    for (const [index, registro] of registros.entries()) {
      const parsed = insertProveedorSchema.safeParse(registro)

      if (!parsed.success) {
        resultado.errores.push({
          fila: index + 1,
          error: parsed.error.issues.map(issue => issue.message).join('; '),
        })
        continue
      }

      const { creado } = await proveedoresRepository.upsertByNombre(parsed.data)
      if (creado) resultado.creados++
      else resultado.actualizados++
    }

    return resultado
  },
}
