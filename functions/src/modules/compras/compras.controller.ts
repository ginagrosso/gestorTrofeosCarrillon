import type { Request, Response } from 'express'
import { insertCompraSchema, compraParamsSchema } from './compras.schema.js'
import { comprasService } from './compras.service.js'

export const comprasController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const compras = await comprasService.getAll()
    res.json({ data: compras })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = compraParamsSchema.parse(req.params)
    const compra = await comprasService.getById(id)
    res.json({ data: compra })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertCompraSchema.parse(req.body)
    const compra = await comprasService.create(data)
    res.status(201).json({ data: compra })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = compraParamsSchema.parse(req.params)
    await comprasService.delete(id)
    res.status(204).send()
  },
}
