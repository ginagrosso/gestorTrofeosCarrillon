import { AppError } from '../../shared/lib/app-error.js'
import { productosRepository } from './productos.repository.js'
import { productoArticulosRepository } from '../producto-articulos/producto-articulos.repository.js'
import { insertProductoSchema } from './productos.schema.js'
import type { Producto, InsertProducto, UpdateProducto } from './productos.schema.js'
import type { ImportResult } from '../../shared/lib/import-result.js'

export const productosService = {

  async getAll(): Promise<Producto[]> {
    return productosRepository.findAll()
  },

  async getById(id: string): Promise<Producto> {
    const producto = await productosRepository.findById(id)
    if (!producto) throw new AppError(404, 'Producto no encontrado')
    return producto
  },

  async create(data: InsertProducto): Promise<Producto> {
    return productosRepository.create(data)
  },

  async update(id: string, data: UpdateProducto): Promise<Producto> {
    await this.getById(id) // lanza 404 si no existe

    if (data.precioCosto !== undefined) {
      const bom = await productoArticulosRepository.findByProductoId(id)
      if (bom.length > 0) {
        throw new AppError(400, 'El costo de este producto se calcula automáticamente desde su lista de materiales')
      }
    }

    return productosRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    await this.getById(id) // lanza 404 si no existe
    await productosRepository.softDelete(id)
  },

  async importar(registros: unknown[]): Promise<ImportResult> {
    const resultado: ImportResult = { creados: 0, actualizados: 0, errores: [] }

    const validos: InsertProducto[] = []
    for (const [index, registro] of registros.entries()) {
      const fila = index + 1
      const parsed = insertProductoSchema.safeParse(registro)
      if (!parsed.success) {
        resultado.errores.push({
          fila,
          error: parsed.error.issues.map(issue => issue.message).join('; '),
        })
        continue
      }
      validos.push(parsed.data)
    }

    const { creados, actualizados } = await productosRepository.upsertManyByCodigo(validos)
    resultado.creados = creados
    resultado.actualizados = actualizados
    return resultado
  },
}
