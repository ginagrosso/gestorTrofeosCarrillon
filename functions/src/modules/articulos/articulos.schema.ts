import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const insertArticuloSchema = z.object({
  codigo:       z.string().min(1, 'El código es obligatorio').max(50),
  descripcion:  z.string().min(1, 'La descripción es obligatoria').max(300),
  precioCosto:  z.number().positive(),
  porcIva:      z.number().nonnegative(),
  precioVenta:  z.number().positive(),
  proveedorId:  z.string().min(1),
  unidad:       z.string().max(20).default('unidad'),
  stock:        z.number().int().min(0).default(0),
})

export const updateArticuloSchema = insertArticuloSchema.partial()

export const articuloParamsSchema = z.object({
  id: z.string().min(1),
})

export const articuloSchema = insertArticuloSchema.extend({
  id:        z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  deletedAt: z.instanceof(Timestamp).nullable(),
})

export type InsertArticulo = z.infer<typeof insertArticuloSchema>
export type UpdateArticulo = z.infer<typeof updateArticuloSchema>
export type Articulo       = z.infer<typeof articuloSchema>

// Fila de importación: trae el nombre del proveedor en lugar de su id,
// que se resuelve por búsqueda durante la importación.
export const importArticuloRowSchema = insertArticuloSchema
  .omit({ proveedorId: true })
  .extend({
    proveedorNombre: z.string().min(1, 'El proveedor es obligatorio'),
  })

export type ImportArticuloRow = z.infer<typeof importArticuloRowSchema>
