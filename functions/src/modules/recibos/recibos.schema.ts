import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'
import { FORMA_PAGO_VALUES } from '../ordenes/ordenes.schema.js'

export const insertReciboSchema = z.object({
  clienteNombre: z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  monto:         z.number().positive('El monto debe ser mayor a 0'),
  formaPago:     z.enum(FORMA_PAGO_VALUES),
  ordenId:       z.string().optional(),
  ordenNumero:   z.number().optional(),
  observaciones: z.string().max(300).optional(),
  empresaId:     z.string().optional(),
})

export const reciboParamsSchema = z.object({ id: z.string().min(1) })

export const reciboSchema = z.object({
  id:            z.string(),
  numero:        z.number(),
  clienteNombre: z.string(),
  monto:         z.number(),
  formaPago:     z.enum(FORMA_PAGO_VALUES),
  ordenId:       z.string().nullable().optional(),
  ordenNumero:   z.number().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  empresaId:     z.string().nullable().optional(),
  fecha:         z.instanceof(Timestamp),
  createdAt:     z.instanceof(Timestamp),
  deletedAt:     z.instanceof(Timestamp).nullable(),
})

export type InsertRecibo = z.infer<typeof insertReciboSchema>
export type Recibo       = z.infer<typeof reciboSchema>
