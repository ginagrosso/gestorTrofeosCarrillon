# Controller — Manejo HTTP

Valida entrada, llama al service, formatea respuesta. Sin lógica de negocio.

```ts
// modules/articulos/articulos.controller.ts
import type { Request, Response } from 'express'
import { insertArticuloSchema, updateArticuloSchema } from './articulos.schema'
import { articulosService } from './articulos.service'
import { AppError } from '../../shared/lib/app-error'
import { z } from 'zod'

const preciosMasivoSchema = z.object({
  porcentaje: z.number().min(-99).max(1000),
})

export const articulosController = {

  async getAll(req: Request, res: Response): Promise<void> {
    const { proveedorId } = req.query
    const articulos = await articulosService.getAll(proveedorId as string | undefined)
    res.json({ data: articulos })
  },

  async getById(req: Request, res: Response): Promise<void> {
    const articulo = await articulosService.getById(req.params.id)
    res.json({ data: articulo })
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = insertArticuloSchema.parse(req.body)
    const articulo = await articulosService.create(data)
    res.status(201).json({ data: articulo })
  },

  async update(req: Request, res: Response): Promise<void> {
    const data = updateArticuloSchema.parse(req.body)
    const articulo = await articulosService.update(req.params.id, data)
    res.json({ data: articulo })
  },

  async delete(req: Request, res: Response): Promise<void> {
    await articulosService.delete(req.params.id)
    res.status(204).send()
  },

  async actualizarPreciosMasivo(req: Request, res: Response): Promise<void> {
    const { porcentaje } = preciosMasivoSchema.parse(req.body)
    const result = await articulosService.actualizarPreciosMasivo(req.params.proveedorId, porcentaje)
    res.json({ data: result })
  },
}
```

## Error handler global

El middleware de error en `shared/middleware/error-handler.ts` captura todo:

```ts
import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/app-error'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Datos inválidos', details: err.flatten() })
    return
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  console.error(err) // solo en el handler global está permitido
  res.status(500).json({ error: 'Error interno del servidor' })
}
```
