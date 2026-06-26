import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const compraItemInputSchema = z.object({
  articuloId:      z.string().min(1, 'El artículo es obligatorio'),
  cantidad:        z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario:  z.number().nonnegative(),
})

export const insertCompraSchema = z.object({
  proveedorId:     z.string().min(1, 'El proveedor es obligatorio'),
  nroComprobante:  z.string().max(50).optional(),
  items:           z.array(compraItemInputSchema).min(1, 'La compra debe tener al menos un ítem'),
})

export const compraParamsSchema = z.object({
  id: z.string().min(1),
})

export const compraItemSchema = compraItemInputSchema.extend({
  id:        z.string(),
  compraId:  z.string(),
})

export const compraSchema = z.object({
  id:              z.string(),
  proveedorId:     z.string(),
  nroComprobante:  z.string().optional(),
  total:           z.number(),
  createdAt:       z.instanceof(Timestamp),
  updatedAt:       z.instanceof(Timestamp),
  deletedAt:       z.instanceof(Timestamp).nullable(),
})

export const compraConItemsSchema = compraSchema.extend({
  items: z.array(compraItemSchema),
})

export type CompraItemInput  = z.infer<typeof compraItemInputSchema>
export type InsertCompra     = z.infer<typeof insertCompraSchema>
export type CompraItem       = z.infer<typeof compraItemSchema>
export type Compra           = z.infer<typeof compraSchema>
export type CompraConItems   = z.infer<typeof compraConItemsSchema>
