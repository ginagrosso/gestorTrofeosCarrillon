import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const insertProveedorSchema = z.object({
  nombre:     z.string().min(1).max(200),
  contacto:   z.string().max(200).optional(),
  localidad:  z.string().max(100).optional(),
  direccion:  z.string().max(300).optional(),
  cuit:       z.string().max(20).optional(),
  sitIva:     z.enum(['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO', 'CONSUMIDOR_FINAL']),
  telefono1:  z.string().max(30).optional(),
  telefono2:  z.string().max(30).optional(),
  rubro:      z.string().max(100).optional(),
})

export const updateProveedorSchema = insertProveedorSchema.partial()

export const proveedorParamsSchema = z.object({
  id: z.string().min(1),
})

export const proveedorSchema = insertProveedorSchema.extend({
  id:        z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  deletedAt: z.instanceof(Timestamp).nullable(),
})

export type InsertProveedor = z.infer<typeof insertProveedorSchema>
export type UpdateProveedor = z.infer<typeof updateProveedorSchema>
export type Proveedor       = z.infer<typeof proveedorSchema>
