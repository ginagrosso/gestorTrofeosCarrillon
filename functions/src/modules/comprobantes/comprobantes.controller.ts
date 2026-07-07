import type { Request, Response } from 'express'
import {
  insertComprobanteSchema,
  comprobanteParamsSchema,
  comprobanteQuerySchema,
} from './comprobantes.schema.js'
import { comprobantesService } from './comprobantes.service.js'

export const comprobantesController = {

  async getAll(req: Request, res: Response): Promise<void> {
    const query = comprobanteQuerySchema.parse(req.query)
    const comprobantes = await comprobantesService.getAll(query)
    res.json({ data: comprobantes })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = comprobanteParamsSchema.parse(req.params)
    const comprobante = await comprobantesService.getById(id)
    res.json({ data: comprobante })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertComprobanteSchema.parse(req.body)
    const comprobante = await comprobantesService.create(data)
    res.status(201).json({ data: comprobante })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = comprobanteParamsSchema.parse(req.params)
    await comprobantesService.delete(id)
    res.status(204).send()
  },
}
