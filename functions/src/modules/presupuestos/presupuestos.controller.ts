import type { Request, Response } from 'express'
import { insertPresupuestoSchema, presupuestoParamsSchema, updatePresupuestoSchema } from './presupuestos.schema.js'
import { presupuestosService } from './presupuestos.service.js'

export const presupuestosController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const presupuestos = await presupuestosService.getAll()
    res.json({ data: presupuestos })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = presupuestoParamsSchema.parse(req.params)
    const presupuesto = await presupuestosService.getById(id)
    res.json({ data: presupuesto })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertPresupuestoSchema.parse(req.body)
    const presupuesto = await presupuestosService.create(data)
    res.status(201).json({ data: presupuesto })
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = presupuestoParamsSchema.parse(req.params)
    const data = updatePresupuestoSchema.parse(req.body)
    const presupuesto = await presupuestosService.update(id, data)
    res.json({ data: presupuesto })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = presupuestoParamsSchema.parse(req.params)
    await presupuestosService.delete(id)
    res.status(204).send()
  },
}
