import type { Request, Response } from 'express'
import { productosService } from './productos.service.js'

export const productosController = {

  async getAll(_req: Request, res: Response): Promise<void> {
    const productos = await productosService.getAll()
    res.json({ data: productos })
  },
}
