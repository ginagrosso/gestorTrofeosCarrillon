import { articulosRepository } from './articulos.repository.js'
import { proveedoresRepository } from '../proveedores/proveedores.repository.js'
import { importArticuloRowSchema } from './articulos.schema.js'
import type { Articulo, InsertArticulo } from './articulos.schema.js'
import type { ImportResult } from '../../shared/lib/import-result.js'

export const articulosService = {

  async getAll(): Promise<Articulo[]> {
    return articulosRepository.findAll()
  },

  async importar(registros: unknown[]): Promise<ImportResult> {
    const resultado: ImportResult = { creados: 0, actualizados: 0, errores: [] }

    const proveedores = await proveedoresRepository.findAll()
    const proveedorPorNombre = new Map(proveedores.map(p => [p.nombre, p]))

    const validos: InsertArticulo[] = []
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
      const proveedor = proveedorPorNombre.get(proveedorNombre)

      if (!proveedor) {
        resultado.errores.push({ fila, error: `No se encontró el proveedor "${proveedorNombre}"` })
        continue
      }

      validos.push({ ...articuloData, proveedorId: proveedor.id })
    }

    const { creados, actualizados } = await articulosRepository.upsertManyByCodigo(validos)
    resultado.creados = creados
    resultado.actualizados = actualizados

    return resultado
  },
}
