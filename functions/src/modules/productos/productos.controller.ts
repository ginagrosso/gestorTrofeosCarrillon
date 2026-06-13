import type { Request, Response } from 'express'
import { insertProductoSchema, updateProductoSchema, productoParamsSchema } from './productos.schema.js'
import { productosService } from './productos.service.js'

export const productosController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const productos = await productosService.getAll()
    res.json({ data: productos })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = productoParamsSchema.parse(req.params)
    const producto = await productosService.getById(id)
    res.json({ data: producto })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertProductoSchema.parse(req.body)
    const producto = await productosService.create(data)
    res.status(201).json({ data: producto })
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = productoParamsSchema.parse(req.params)
    const data = updateProductoSchema.parse(req.body)
    const producto = await productosService.update(id, data)
    res.json({ data: producto })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = productoParamsSchema.parse(req.params)
    await productosService.delete(id)
    res.status(204).send()
  },
}
