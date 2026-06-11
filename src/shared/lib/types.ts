import { z } from 'zod'

export const insertProveedorSchema = z.object({
  nombre:     z.string().min(1, 'El nombre es obligatorio').max(200),
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

export const proveedorSchema = insertProveedorSchema.extend({
  id: z.string(),
})

export type InsertProveedor = z.infer<typeof insertProveedorSchema>
export type UpdateProveedor = z.infer<typeof updateProveedorSchema>
export type Proveedor       = z.infer<typeof proveedorSchema>

export const SIT_IVA_LABELS: Record<InsertProveedor['sitIva'], string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO:           'Monotributo',
  EXENTO:                'Exento',
  CONSUMIDOR_FINAL:      'Consumidor Final',
}
