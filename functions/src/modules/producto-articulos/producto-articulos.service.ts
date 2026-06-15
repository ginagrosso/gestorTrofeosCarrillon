import { productoArticulosRepository } from './producto-articulos.repository.js'
import { productosService } from '../productos/productos.service.js'
import { articulosRepository } from '../articulos/articulos.repository.js'
import type { ReplaceProductoArticulos } from './producto-articulos.schema.js'
import type { Articulo } from '../articulos/articulos.schema.js'

export interface ProductoArticuloConDetalle {
  id:         string
  productoId: string
  articuloId: string
  cantidad:   number
  articulo:   Articulo | null
}

export const productoArticulosService = {

  async getAll(): Promise<ProductoArticuloConDetalle[]> {
    const bom = await productoArticulosRepository.findAll()
    const articulos = await articulosRepository.findByIds(bom.map(item => item.articuloId))
    const articulosPorId = new Map(articulos.map(articulo => [articulo.id, articulo]))

    return bom.map(item => ({
      id:         item.id,
      productoId: item.productoId,
      articuloId: item.articuloId,
      cantidad:   item.cantidad,
      articulo:   articulosPorId.get(item.articuloId) ?? null,
    }))
  },

  async getByProductoId(productoId: string): Promise<ProductoArticuloConDetalle[]> {
    await productosService.getById(productoId) // lanza 404 si no existe

    const bom = await productoArticulosRepository.findByProductoId(productoId)
    const articulos = await articulosRepository.findByIds(bom.map(item => item.articuloId))
    const articulosPorId = new Map(articulos.map(articulo => [articulo.id, articulo]))

    return bom.map(item => ({
      id:         item.id,
      productoId: item.productoId,
      articuloId: item.articuloId,
      cantidad:   item.cantidad,
      articulo:   articulosPorId.get(item.articuloId) ?? null,
    }))
  },

  async replaceForProducto(productoId: string, data: ReplaceProductoArticulos) {
    await productosService.getById(productoId) // lanza 404 si no existe
    return productoArticulosRepository.replaceForProducto(productoId, data.items)
  },
}
