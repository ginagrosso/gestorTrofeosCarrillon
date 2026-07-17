import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

// El cliente no trabaja con decimales en los precios: se truncan (no se redondean) al cargar.
const precioSinDecimales = z.number().nonnegative().transform(v => Math.trunc(v))

export const insertProductoSchema = z.object({
  codigo:       z.string().min(1, 'El código es obligatorio').max(50),
  descripcion:  z.string().min(1, 'La descripción es obligatoria').max(300),
  precioCosto:  precioSinDecimales,
  // Las dos empresas son monotributistas y no discriminan IVA: el default es 0.
  porcIva:      z.number().nonnegative().default(0),
  precioVenta:  precioSinDecimales,
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

