import { AppError } from '../../shared/lib/app-error.js'
import { articulosRepository } from './articulos.repository.js'
import { proveedoresRepository } from '../proveedores/proveedores.repository.js'
import { proveedoresService } from '../proveedores/proveedores.service.js'
import { productoArticulosRepository } from '../producto-articulos/producto-articulos.repository.js'
import { importArticuloRowSchema } from './articulos.schema.js'
import type { Articulo, InsertArticulo, UpdateArticulo } from './articulos.schema.js'
import type { ImportResult } from '../../shared/lib/import-result.js'

export const articulosService = {

  async getAll(): Promise<Articulo[]> {
    return articulosRepository.findAll()
  },

  async getById(id: string): Promise<Articulo> {
    const articulo = await articulosRepository.findById(id)
    if (!articulo) throw new AppError(404, 'Artículo no encontrado')
    return articulo
  },

  async create(data: InsertArticulo): Promise<Articulo> {
    return articulosRepository.create(data)
  },

  async update(id: string, data: UpdateArticulo): Promise<Articulo> {
    await this.getById(id) // lanza 404 si no existe
    return articulosRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    await this.getById(id) // lanza 404 si no existe
    await articulosRepository.softDelete(id)
  },

  async actualizarPreciosPorProveedor(proveedorId: string, porcentaje: number): Promise<{ articulosActualizados: number; productosActualizados: number }> {
    await proveedoresService.getById(proveedorId) // lanza 404 si no existe

    const articulosActualizados = await articulosRepository.bulkUpdatePrecioPorProveedor(proveedorId, porcentaje)

    let productosActualizados = 0
    if (articulosActualizados.length > 0) {
      const lineas = await productoArticulosRepository.findByArticuloIds(articulosActualizados.map(a => a.id))
      const productoIds = [...new Set(lineas.map(linea => linea.productoId))]
      await productoArticulosRepository.recalcPrecioCostoForProductos(productoIds)
      productosActualizados = productoIds.length
    }

    return { articulosActualizados: articulosActualizados.length, productosActualizados }
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
