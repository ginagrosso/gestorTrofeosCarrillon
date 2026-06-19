import type { Request, Response } from 'express'
import { insertClienteSchema, updateClienteSchema, clienteParamsSchema } from './clientes.schema.js'
import { clientesService } from './clientes.service.js'

export const clientesController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const clientes = await clientesService.getAll()
    res.json({ data: clientes })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = clienteParamsSchema.parse(req.params)
    const cliente = await clientesService.getById(id)
    res.json({ data: cliente })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertClienteSchema.parse(req.body)
    const cliente = await clientesService.create(data)
    res.status(201).json({ data: cliente })
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = clienteParamsSchema.parse(req.params)
    const data = updateClienteSchema.parse(req.body)
    const cliente = await clientesService.update(id, data)
    res.json({ data: cliente })
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = clienteParamsSchema.parse(req.params)
    await clientesService.delete(id)
    res.status(204).send()
  },
}
