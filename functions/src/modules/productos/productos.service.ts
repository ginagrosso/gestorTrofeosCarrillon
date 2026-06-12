import { productosRepository } from './productos.repository.js'
import { proveedoresRepository } from '../proveedores/proveedores.repository.js'
import { importProductoRowSchema } from './productos.schema.js'
import type { Producto, InsertProducto } from './productos.schema.js'
import type { ImportResult } from '../../shared/lib/import-result.js'

export const productosService = {

  async getAll(): Promise<Producto[]> {
    return productosRepository.findAll()
  },

  async importar(registros: unknown[]): Promise<ImportResult> {
    const resultado: ImportResult = { creados: 0, actualizados: 0, errores: [] }

    const proveedores = await proveedoresRepository.findAll()
    const proveedorPorNombre = new Map(proveedores.map(p => [p.nombre, p]))

    const validos: InsertProducto[] = []
    for (const [index, registro] of registros.entries()) {
      const fila = index + 1
      const parsed = importProductoRowSchema.safeParse(registro)

      if (!parsed.success) {
        resultado.errores.push({
          fila,
          error: parsed.error.issues.map(issue => issue.message).join('; '),
        })
        continue
      }

      const { proveedorNombre, ...productoData } = parsed.data
      const proveedor = proveedorPorNombre.get(proveedorNombre)

      if (!proveedor) {
        resultado.errores.push({ fila, error: `No se encontró el proveedor "${proveedorNombre}"` })
        continue
      }

      validos.push({ ...productoData, proveedorId: proveedor.id })
    }

    const { creados, actualizados } = await productosRepository.upsertManyByCodigo(validos)
    resultado.creados = creados
    resultado.actualizados = actualizados

    return resultado
  },
}
