import type { Request, Response } from 'express'
import { insertOrdenSchema, ordenParamsSchema, updateOrdenPagoSchema } from './ordenes.schema.js'
import { ordenesService } from './ordenes.service.js'

export const ordenesController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const ordenes = await ordenesService.getAll()
    res.json({ data: ordenes })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = ordenParamsSchema.parse(req.params)
    const orden = await ordenesService.getById(id)
    res.json({ data: orden })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertOrdenSchema.parse(req.body)
    const orden = await ordenesService.create(data)
    res.status(201).json({ data: orden })
  },

  async updatePago(req: Request, res: Response): Promise<void> {
    const { id } = ordenParamsSchema.parse(req.params)
    const data = updateOrdenPagoSchema.parse(req.body)
    const orden = await ordenesService.updatePago(id, data)
    res.json({ data: orden })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = ordenParamsSchema.parse(req.params)
    await ordenesService.delete(id)
    res.status(204).send()
  },
}
