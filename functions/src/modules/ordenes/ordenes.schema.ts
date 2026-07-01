import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const FORMA_PAGO_VALUES = ['EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'CTA_CTE'] as const
export const ESTADO_ORDEN_VALUES = ['PENDIENTE', 'PARCIAL', 'PAGADO'] as const

export type FormaPago   = typeof FORMA_PAGO_VALUES[number]
export type EstadoOrden = typeof ESTADO_ORDEN_VALUES[number]

export const calcEstado = (montoEntrega: number, total: number): EstadoOrden => {
  if (montoEntrega <= 0) return 'PENDIENTE'
  if (montoEntrega >= total) return 'PAGADO'
  return 'PARCIAL'
}

export const ordenItemInputSchema = z.object({
  productoId:     z.string().min(1, 'El producto es obligatorio'),
  cantidad:       z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
})

export const insertOrdenSchema = z.object({
  fechaPrometida:   z.string().min(1, 'La fecha prometida es obligatoria').max(100),
  clienteId:        z.string().optional(),
  clienteNombre:    z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  clienteTelefono:  z.string().max(50).optional(),
  clienteLocalidad: z.string().max(100).optional(),
  clienteCuit:      z.string().max(20).optional(),
  condVenta:        z.string().max(50).default('CONTADO'),
  formaPago:        z.enum(FORMA_PAGO_VALUES).nullable().optional(),
  reciboNumero:     z.string().max(50).optional(),
  facturaNumero:    z.string().max(50).optional(),
  montoEntrega:     z.number().nonnegative().default(0),
  presupuestoId:    z.string().optional(),
  items:            z.array(ordenItemInputSchema).min(1, 'La orden debe tener al menos un ítem'),
})

export const updateOrdenPagoSchema = z.object({
  montoEntrega:  z.number().nonnegative(),
  formaPago:     z.enum(FORMA_PAGO_VALUES),
  reciboNumero:  z.string().max(50).optional(),
  facturaNumero: z.string().max(50).optional(),
})

export const ordenParamsSchema = z.object({
  id: z.string().min(1),
})

export const ordenItemSchema = ordenItemInputSchema.extend({
  id:      z.string(),
  ordenId: z.string(),
  subtotal: z.number(),
})

export const ordenSchema = z.object({
  id:               z.string(),
  numero:           z.number(),
  fechaPrometida:   z.string(),
  clienteId:        z.string().nullable().optional(),
  clienteNombre:    z.string(),
  clienteTelefono:  z.string().nullable().optional(),
  clienteLocalidad: z.string().nullable().optional(),
  clienteCuit:      z.string().nullable().optional(),
  condVenta:        z.string(),
  formaPago:        z.enum(FORMA_PAGO_VALUES).nullable(),
  reciboNumero:     z.string().nullable().optional(),
  facturaNumero:    z.string().nullable().optional(),
  montoEntrega:     z.number(),
  total:            z.number(),
  saldo:            z.number(),
  estado:           z.enum(ESTADO_ORDEN_VALUES),
  presupuestoId:    z.string().nullable().optional(),
  createdAt:        z.instanceof(Timestamp),
  updatedAt:        z.instanceof(Timestamp),
  deletedAt:        z.instanceof(Timestamp).nullable(),
})

export const ordenConItemsSchema = ordenSchema.extend({
  items: z.array(ordenItemSchema),
})

export type OrdenItemInput  = z.infer<typeof ordenItemInputSchema>
export type InsertOrden     = z.infer<typeof insertOrdenSchema>
export type UpdateOrdenPago = z.infer<typeof updateOrdenPagoSchema>
export type OrdenItem       = z.infer<typeof ordenItemSchema>
export type Orden           = z.infer<typeof ordenSchema>
export type OrdenConItems   = z.infer<typeof ordenConItemsSchema>
