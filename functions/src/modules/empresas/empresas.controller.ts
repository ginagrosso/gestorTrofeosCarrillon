import type { Request, Response } from 'express'
import { insertEmpresaSchema, updateEmpresaSchema, empresaParamsSchema } from './empresas.schema.js'
import { empresasService } from './empresas.service.js'

export const empresasController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const empresas = await empresasService.getAll()
    res.json({ data: empresas })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = empresaParamsSchema.parse(req.params)
    const empresa = await empresasService.getById(id)
    res.json({ data: empresa })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertEmpresaSchema.parse(req.body)
    const empresa = await empresasService.create(data)
    res.status(201).json({ data: empresa })
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = empresaParamsSchema.parse(req.params)
    const data = updateEmpresaSchema.parse(req.body)
    const empresa = await empresasService.update(id, data)
    res.json({ data: empresa })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = empresaParamsSchema.parse(req.params)
    await empresasService.delete(id)
    res.status(204).send()
  },
}
