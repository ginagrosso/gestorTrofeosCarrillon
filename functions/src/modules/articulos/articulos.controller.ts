import type { Request, Response } from 'express'
import { insertArticuloSchema, updateArticuloSchema, articuloParamsSchema } from './articulos.schema.js'
import { articulosService } from './articulos.service.js'

export const articulosController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const articulos = await articulosService.getAll()
    res.json({ data: articulos })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = articuloParamsSchema.parse(req.params)
    const articulo = await articulosService.getById(id)
    res.json({ data: articulo })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertArticuloSchema.parse(req.body)
    const articulo = await articulosService.create(data)
    res.status(201).json({ data: articulo })
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = articuloParamsSchema.parse(req.params)
    const data = updateArticuloSchema.parse(req.body)
    const articulo = await articulosService.update(id, data)
    res.json({ data: articulo })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = articuloParamsSchema.parse(req.params)
    await articulosService.delete(id)
    res.status(204).send()
  },
}
