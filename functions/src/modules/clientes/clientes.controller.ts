import type { Request, Response } from 'express'
import { clientesService } from './clientes.service.js'

export const clientesController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const clientes = await clientesService.getAll()
    res.json({ data: clientes })
  },
}
