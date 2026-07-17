import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

// El cliente no trabaja con decimales en los precios: se truncan (no se redondean) al cargar.
const precioSinDecimales = z.number().nonnegative().transform(v => Math.trunc(v))

export const insertArticuloSchema = z.object({
  codigo:       z.string().min(1, 'El código es obligatorio').max(50),
  descripcion:  z.string().min(1, 'La descripción es obligatoria').max(300),
  precioCosto:  precioSinDecimales,
  // Las dos empresas son monotributistas y no discriminan IVA: el default es 0.
  porcIva:      z.number().nonnegative().default(0),
  precioVenta:  precioSinDecimales,
  proveedorId:  z.string().min(1),
  unidad:       z.string().max(20).default('unidad'),
  stock:        z.number().int().default(0),
  categoria:    z.string().max(100).optional(),
  subcategoria: z.string().max(100).optional(),
})

export const updateArticuloSchema = insertArticuloSchema.partial()

export const articuloParamsSchema = z.object({
  id: z.string().min(1),
})

export const articuloSchema = insertArticuloSchema.extend({
  id:                 z.string(),
  createdAt:          z.instanceof(Timestamp),
  updatedAt:          z.instanceof(Timestamp),
  deletedAt:          z.instanceof(Timestamp).nullable(),
  precioActualizadoAt: z.instanceof(Timestamp).nullable(),
})

export type InsertArticulo = z.infer<typeof insertArticuloSchema>
export type UpdateArticulo = z.infer<typeof updateArticuloSchema>
export type Articulo       = z.infer<typeof articuloSchema>

// Actualización masiva de precios por proveedor (% único sobre precioCosto)
export const actualizarPreciosPorProveedorSchema = z.object({
  proveedorId: z.string().min(1),
  porcentaje: z.number()
    .refine(v => v !== 0, 'El porcentaje no puede ser 0')
    .refine(v => v >= -100, 'El porcentaje no puede ser menor a -100'),
})

export type ActualizarPreciosPorProveedor = z.infer<typeof actualizarPreciosPorProveedorSchema>

// Fila de importación: trae el nombre del proveedor en lugar de su id,
// que se resuelve por búsqueda durante la importación.
export const importArticuloRowSchema = insertArticuloSchema
  .omit({ proveedorId: true })
  .extend({
    proveedorNombre: z.string().min(1, 'El proveedor es obligatorio'),
  })

export type ImportArticuloRow = z.infer<typeof importArticuloRowSchema>
