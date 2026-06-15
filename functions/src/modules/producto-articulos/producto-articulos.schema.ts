import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const productoArticuloItemSchema = z.object({
  articuloId: z.string().min(1),
  cantidad:   z.number().positive('La cantidad debe ser mayor a 0'),
})

export const replaceProductoArticulosSchema = z.object({
  items: z.array(productoArticuloItemSchema),
}).refine(
  data => new Set(data.items.map(item => item.articuloId)).size === data.items.length,
  { message: 'No se puede repetir el mismo artículo en la lista de materiales', path: ['items'] },
)

export const productoArticuloParamsSchema = z.object({
  productoId: z.string().min(1),
})

export const productoArticuloSchema = productoArticuloItemSchema.extend({
  id:         z.string(),
  productoId: z.string(),
  createdAt:  z.instanceof(Timestamp),
  updatedAt:  z.instanceof(Timestamp),
})

export type ProductoArticuloItem     = z.infer<typeof productoArticuloItemSchema>
export type ReplaceProductoArticulos = z.infer<typeof replaceProductoArticulosSchema>
export type ProductoArticulo         = z.infer<typeof productoArticuloSchema>
