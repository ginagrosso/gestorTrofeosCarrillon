import type { Request, Response } from 'express'
import { insertProveedorSchema, updateProveedorSchema, proveedorParamsSchema } from './proveedores.schema.js'
import { proveedoresService } from './proveedores.service.js'

export const proveedoresController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const proveedores = await proveedoresService.getAll()
    res.json({ data: proveedores })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = proveedorParamsSchema.parse(req.params)
    const proveedor = await proveedoresService.getById(id)
    res.json({ data: proveedor })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertProveedorSchema.parse(req.body)
    const proveedor = await proveedoresService.create(data)
    res.status(201).json({ data: proveedor })
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = proveedorParamsSchema.parse(req.params)
    const data = updateProveedorSchema.parse(req.body)
    const proveedor = await proveedoresService.update(id, data)
    res.json({ data: proveedor })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = proveedorParamsSchema.parse(req.params)
    await proveedoresService.delete(id)
    res.status(204).send()
  },
}
