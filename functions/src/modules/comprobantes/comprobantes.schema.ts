import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'
import { TIPO_COMPROBANTE_VALUES } from '../empresas/empresas.schema.js'

export { TIPO_COMPROBANTE_VALUES }

const NOTA_TIPOS = ['NOTA_CREDITO_C', 'NOTA_DEBITO_C']

export const comprobanteItemInputSchema = z.object({
  codigo:         z.string().max(50).optional(),
  descripcion:    z.string().min(1, 'La descripción es obligatoria').max(300),
  cantidad:       z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
  bonificacion:   z.number().min(0).max(100).default(0),
})

const baseInsertComprobanteSchema = z.object({
  tipo:             z.enum(TIPO_COMPROBANTE_VALUES),
  empresaId:        z.string().min(1, 'La empresa es obligatoria'),
  clienteId:        z.string().optional(),
  clienteNombre:    z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  clienteDireccion: z.string().max(300).optional(),
  clienteLocalidad: z.string().max(100).optional(),
  clienteCuit:      z.string().max(20).optional(),
  clienteSitIva:    z.string().max(50).optional(),
  condVenta:        z.string().max(50).default('CONTADO'),
  observaciones:    z.string().max(500).optional(),
  ordenId:          z.string().optional(),
  presupuestoId:    z.string().optional(),
  comprobanteRef:   z.string().max(50).optional(),
  items:            z.array(comprobanteItemInputSchema).min(1, 'Agregá al menos un ítem'),
})

export const insertComprobanteSchema = baseInsertComprobanteSchema.refine(
  data => !NOTA_TIPOS.includes(data.tipo) || !!data.comprobanteRef,
  { message: 'El comprobante de referencia es obligatorio para Notas de Crédito/Débito', path: ['comprobanteRef'] },
)

export const comprobanteParamsSchema = z.object({ id: z.string().min(1) })

export const comprobanteQuerySchema = z.object({
  tipo:      z.enum(TIPO_COMPROBANTE_VALUES).optional(),
  empresaId: z.string().optional(),
})

export const comprobanteItemSchema = z.object({
  id:             z.string(),
  comprobanteId:  z.string(),
  codigo:         z.string().nullable().optional(),
  descripcion:    z.string(),
  cantidad:       z.number(),
  precioUnitario: z.number(),
  bonificacion:   z.number(),
  subtotal:       z.number(),
})

export const comprobanteSchema = z.object({
  id:               z.string(),
  tipo:             z.enum(TIPO_COMPROBANTE_VALUES),
  numero:           z.string(),
  fecha:            z.instanceof(Timestamp),
  empresaId:        z.string(),
  clienteId:        z.string().nullable().optional(),
  clienteNombre:    z.string(),
  clienteDireccion: z.string().nullable().optional(),
  clienteLocalidad: z.string().nullable().optional(),
  clienteCuit:      z.string().nullable().optional(),
  clienteSitIva:    z.string().nullable().optional(),
  condVenta:        z.string(),
  observaciones:    z.string().nullable().optional(),
  total:            z.number(),
  ordenId:          z.string().nullable().optional(),
  presupuestoId:    z.string().nullable().optional(),
  comprobanteRef:   z.string().nullable().optional(),
  createdAt:        z.instanceof(Timestamp),
  updatedAt:        z.instanceof(Timestamp),
  deletedAt:        z.instanceof(Timestamp).nullable(),
})

export const comprobanteConItemsSchema = comprobanteSchema.extend({
  items: z.array(comprobanteItemSchema),
})

export type ComprobanteItemInput = z.infer<typeof comprobanteItemInputSchema>
export type InsertComprobante    = z.infer<typeof insertComprobanteSchema>
export type ComprobanteQuery     = z.infer<typeof comprobanteQuerySchema>
export type ComprobanteItem      = z.infer<typeof comprobanteItemSchema>
export type Comprobante          = z.infer<typeof comprobanteSchema>
export type ComprobanteConItems  = z.infer<typeof comprobanteConItemsSchema>
