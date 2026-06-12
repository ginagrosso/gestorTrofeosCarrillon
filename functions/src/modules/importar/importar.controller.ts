import type { Request, Response } from 'express'
import { importRequestSchema } from '../../shared/lib/import-result.js'
import { proveedoresService } from '../proveedores/proveedores.service.js'
import { clientesService } from '../clientes/clientes.service.js'
import { articulosService } from '../articulos/articulos.service.js'

export const importarController = {

  async proveedores(req: Request, res: Response): Promise<void> {
    const registros = importRequestSchema.parse(req.body)
    const resultado = await proveedoresService.importar(registros)
    res.json({ data: resultado })
  },

  async clientes(req: Request, res: Response): Promise<void> {
    const registros = importRequestSchema.parse(req.body)
    const resultado = await clientesService.importar(registros)
    res.json({ data: resultado })
  },

  async articulos(req: Request, res: Response): Promise<void> {
    const registros = importRequestSchema.parse(req.body)
    const resultado = await articulosService.importar(registros)
    res.json({ data: resultado })
  },
}
