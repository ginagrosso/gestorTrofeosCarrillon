import { articulosRepository } from './articulos.repository.js'
import { proveedoresRepository } from '../proveedores/proveedores.repository.js'
import { importArticuloRowSchema } from './articulos.schema.js'
import type { Articulo } from './articulos.schema.js'
import type { ImportResult } from '../../shared/lib/import-result.js'

export const articulosService = {

  async getAll(): Promise<Articulo[]> {
    return articulosRepository.findAll()
  },

  async importar(registros: unknown[]): Promise<ImportResult> {
    const resultado: ImportResult = { creados: 0, actualizados: 0, errores: [] }

    for (const [index, registro] of registros.entries()) {
      const fila = index + 1
      const parsed = importArticuloRowSchema.safeParse(registro)

      if (!parsed.success) {
        resultado.errores.push({
          fila,
          error: parsed.error.issues.map(issue => issue.message).join('; '),
        })
        continue
      }

      const { proveedorNombre, ...articuloData } = parsed.data
      const proveedor = await proveedoresRepository.findByNombre(proveedorNombre)

      if (!proveedor) {
        resultado.errores.push({ fila, error: `No se encontró el proveedor "${proveedorNombre}"` })
        continue
      }

      const { creado } = await articulosRepository.upsertByCodigo({ ...articuloData, proveedorId: proveedor.id })
      if (creado) resultado.creados++
      else resultado.actualizados++
    }

    return resultado
  },
}
