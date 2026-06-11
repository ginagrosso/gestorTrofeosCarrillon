import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const insertClienteSchema = z.object({
  nombre:          z.string().min(1, 'El nombre es obligatorio').max(200),
  situacionFiscal: z.string().max(100).optional(),
  tipoDoc:         z.enum(['CUIT', 'CUIL', 'DNI', 'CUE']),
  cuit:            z.string().max(20).optional(),
  empresa:         z.enum(['M.E.P.B.', 'M.A.D.']),
  rubro:           z.string().max(100).optional(),
  direccion:       z.string().max(300).optional(),
  telefono:        z.string().max(30).optional(),
  celular:         z.string().max(30).optional(),
  email:           z.string().email('Email inválido').max(200).optional(),
})

export const updateClienteSchema = insertClienteSchema.partial()

export const clienteParamsSchema = z.object({
  id: z.string().min(1),
})

export const clienteSchema = insertClienteSchema.extend({
  id:        z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  deletedAt: z.instanceof(Timestamp).nullable(),
})

export type InsertCliente = z.infer<typeof insertClienteSchema>
export type UpdateCliente = z.infer<typeof updateClienteSchema>
export type Cliente       = z.infer<typeof clienteSchema>
