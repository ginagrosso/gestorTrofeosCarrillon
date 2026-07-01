import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const TIPO_COMPROBANTE_VALUES = ['FACTURA_C', 'REMITO', 'NOTA_CREDITO_C', 'NOTA_DEBITO_C'] as const

const contadorSchema = z.object({
  puntoVenta:   z.string().default('0001'),
  ultimoNumero: z.number().int().nonnegative().default(0),
})

const contadoresSchema = z.object({
  FACTURA_C:      contadorSchema,
  REMITO:         contadorSchema,
  NOTA_CREDITO_C: contadorSchema,
  NOTA_DEBITO_C:  contadorSchema,
})

const defaultContadores = {
  FACTURA_C:      { puntoVenta: '0001', ultimoNumero: 0 },
  REMITO:         { puntoVenta: '0001', ultimoNumero: 0 },
  NOTA_CREDITO_C: { puntoVenta: '0001', ultimoNumero: 0 },
  NOTA_DEBITO_C:  { puntoVenta: '0001', ultimoNumero: 0 },
}

export const insertEmpresaSchema = z.object({
  nombreFantasia: z.string().min(1).max(200),
  razonSocial:    z.string().min(1).max(200),
  domicilio:      z.string().min(1).max(300),
  localidad:      z.string().min(1).max(100),
  cuit:           z.string().min(1).max(20),
  iibb:           z.string().min(1).max(30),
  fechaInicioAct: z.string().min(1).max(20),
  condIva:        z.string().min(1).max(100),
  activa:         z.boolean().default(true),
  contadores:     contadoresSchema.default(defaultContadores),
})

export const updateEmpresaSchema = insertEmpresaSchema.partial()

export const empresaParamsSchema = z.object({ id: z.string().min(1) })

export const empresaSchema = insertEmpresaSchema.extend({
  id:        z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  deletedAt: z.instanceof(Timestamp).nullable(),
})

export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>
export type UpdateEmpresa = z.infer<typeof updateEmpresaSchema>
export type Empresa       = z.infer<typeof empresaSchema>
export type Contadores    = z.infer<typeof contadoresSchema>
