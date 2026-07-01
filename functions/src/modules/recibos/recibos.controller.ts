import type { Request, Response } from 'express'
import { recibosService } from './recibos.service.js'
import { insertReciboSchema, reciboParamsSchema } from './recibos.schema.js'

export const recibosController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    const recibos = await recibosService.getAll()
    res.json({ data: recibos })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = reciboParamsSchema.parse(req.params)
    const recibo  = await recibosService.getById(id)
    res.json({ data: recibo })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data   = insertReciboSchema.parse(req.body)
    const recibo = await recibosService.create(data)
    res.status(201).json({ data: recibo })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = reciboParamsSchema.parse(req.params)
    await recibosService.delete(id)
    res.status(204).end()
  },
}
