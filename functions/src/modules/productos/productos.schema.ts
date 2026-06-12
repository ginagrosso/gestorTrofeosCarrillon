import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const insertProductoSchema = z.object({
  codigo:       z.string().min(1, 'El código es obligatorio').max(50),
  descripcion:  z.string().min(1, 'La descripción es obligatoria').max(300),
  precioCosto:  z.number().nonnegative(),
  porcIva:      z.number().nonnegative(),
  precioVenta:  z.number().nonnegative(),
  proveedorId:  z.string().min(1),
  stockActual:  z.number().int().default(0),
  categoria:    z.string().max(100).optional(),
  subcategoria: z.string().max(100).optional(),
})

export const updateProductoSchema = insertProductoSchema.partial()

export const productoParamsSchema = z.object({
  id: z.string().min(1),
})

export const productoSchema = insertProductoSchema.extend({
  id:        z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  deletedAt: z.instanceof(Timestamp).nullable(),
})

export type InsertProducto = z.infer<typeof insertProductoSchema>
export type UpdateProducto = z.infer<typeof updateProductoSchema>
export type Producto       = z.infer<typeof productoSchema>

// Fila de importación: trae el nombre del proveedor en lugar de su id,
// que se resuelve por búsqueda durante la importación.
export const importProductoRowSchema = insertProductoSchema
  .omit({ proveedorId: true })
  .extend({
    proveedorNombre: z.string().min(1, 'El proveedor es obligatorio'),
  })

export type ImportProductoRow = z.infer<typeof importProductoRowSchema>
