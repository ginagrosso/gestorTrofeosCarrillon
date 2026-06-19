import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const insertClienteSchema = z.object({
  nombre:          z.string().min(1, 'El nombre es obligatorio').max(200),
  situacionFiscal: z.enum(['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO', 'CONSUMIDOR_FINAL']),
  tipoDoc:         z.enum(['CUIT', 'CUIL', 'DNI', 'CUE', 'CUI']),
  cuit:            z.string().max(20).optional(),
  direccion:       z.string().max(300).optional(),
  localidad:       z.string().max(100).optional(),
  provincia:       z.string().max(100).optional(),
  telefono:        z.string().max(30).optional(),
  celular:         z.string().max(30).optional(),
  email:           z.string().max(200).optional()
    .refine(v => !v || z.string().email().safeParse(v).success, 'Email inválido'),
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
