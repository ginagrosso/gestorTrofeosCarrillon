import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const presupuestoItemInputSchema = z.object({
  productoId:     z.string().min(1, 'El producto es obligatorio'),
  cantidad:       z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
  bonificacion:   z.number().min(0).max(100).default(0),
})

export const insertPresupuestoSchema = z.object({
  clienteId:        z.string().optional(),
  clienteNombre:    z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  clienteLocalidad: z.string().max(100).optional(),
  clienteCuit:      z.string().max(20).optional(),
  clienteSitIva:    z.string().max(50).optional(),
  condVenta:        z.string().max(50).default('CONTADO'),
  observaciones:    z.string().max(500).optional(),
  plazoEntrega:     z.string().max(100).default('INMEDIATO'),
  validezDias:      z.number().int().positive().default(30),
  items:            z.array(presupuestoItemInputSchema).min(1, 'El presupuesto debe tener al menos un ítem'),
})

export const updatePresupuestoSchema = insertPresupuestoSchema.partial()

export const presupuestoParamsSchema = z.object({
  id: z.string().min(1),
})

export const presupuestoItemSchema = presupuestoItemInputSchema.extend({
  id:            z.string(),
  presupuestoId: z.string(),
  subtotal:      z.number(),
})

export const presupuestoSchema = z.object({
  id:               z.string(),
  numero:           z.number(),
  clienteId:        z.string().nullable().optional(),
  clienteNombre:    z.string(),
  clienteLocalidad: z.string().nullable().optional(),
  clienteCuit:      z.string().nullable().optional(),
  clienteSitIva:    z.string().nullable().optional(),
  condVenta:        z.string(),
  observaciones:    z.string().nullable().optional(),
  plazoEntrega:     z.string(),
  validezDias:      z.number(),
  total:            z.number(),
  createdAt:        z.instanceof(Timestamp),
  updatedAt:        z.instanceof(Timestamp),
  deletedAt:        z.instanceof(Timestamp).nullable(),
})

export const presupuestoConItemsSchema = presupuestoSchema.extend({
  items: z.array(presupuestoItemSchema),
})

export type PresupuestoItemInput = z.infer<typeof presupuestoItemInputSchema>
export type InsertPresupuesto    = z.infer<typeof insertPresupuestoSchema>
export type UpdatePresupuesto    = z.infer<typeof updatePresupuestoSchema>
export type PresupuestoItem      = z.infer<typeof presupuestoItemSchema>
export type Presupuesto          = z.infer<typeof presupuestoSchema>
export type PresupuestoConItems  = z.infer<typeof presupuestoConItemsSchema>
