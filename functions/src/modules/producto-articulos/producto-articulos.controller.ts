import type { Request, Response } from 'express'
import { replaceProductoArticulosSchema, productoArticuloParamsSchema } from './producto-articulos.schema.js'
import { productoArticulosService } from './producto-articulos.service.js'

export const productoArticulosController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const bom = await productoArticulosService.getAll()
    res.json({ data: bom })
  },

  async getByProducto(req: Request, res: Response): Promise<void> {
    const { productoId } = productoArticuloParamsSchema.parse(req.params)
    const bom = await productoArticulosService.getByProductoId(productoId)
    res.json({ data: bom })
  },

  async replaceForProducto(req: Request, res: Response): Promise<void> {
    const { productoId } = productoArticuloParamsSchema.parse(req.params)
    const data = replaceProductoArticulosSchema.parse(req.body)
    const result = await productoArticulosService.replaceForProducto(productoId, data)
    res.json({ data: result })
  },
}
