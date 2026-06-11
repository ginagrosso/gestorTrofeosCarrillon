import type { Request, Response } from 'express'
import { articulosService } from './articulos.service.js'

export const articulosController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const articulos = await articulosService.getAll()
    res.json({ data: articulos })
  },
}
