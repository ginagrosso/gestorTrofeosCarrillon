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

export const insertClienteSchema = z.object({
  nombre:          z.string().min(1, 'El nombre es obligatorio').max(200),
  situacionFiscal: z.string().max(100).optional(),
  tipoDoc:         z.enum(['CUIT', 'CUIL', 'DNI', 'CUE', 'CUI']),
  cuit:            z.string().max(20).optional(),
  empresa:         z.enum(['M.E.P.B.', 'M.A.D.']).optional(),
  rubro:           z.string().max(100).optional(),
  direccion:       z.string().max(300).optional(),
  telefono:        z.string().max(30).optional(),
  celular:         z.string().max(30).optional(),
  email:           z.string().email('Email inválido').max(200).optional(),
})

export const updateClienteSchema = insertClienteSchema.partial()

export const clienteSchema = insertClienteSchema.extend({
  id: z.string(),
})

export type InsertCliente = z.infer<typeof insertClienteSchema>
export type UpdateCliente = z.infer<typeof updateClienteSchema>
export type Cliente       = z.infer<typeof clienteSchema>

export const insertArticuloSchema = z.object({
  codigo:      z.string().min(1, 'El código es obligatorio').max(50),
  descripcion: z.string().min(1, 'La descripción es obligatoria').max(300),
  precioCosto: z.number().nonnegative(),
  porcIva:     z.number().nonnegative(),
  precioVenta: z.number().nonnegative(),
  proveedorId: z.string().min(1),
  unidad:      z.string().max(20).default('unidad'),
  stock:       z.number().int().default(0),
})

export const updateArticuloSchema = insertArticuloSchema.partial()

export const articuloSchema = insertArticuloSchema.extend({
  id: z.string(),
})

export type InsertArticulo = z.infer<typeof insertArticuloSchema>
export type UpdateArticulo = z.infer<typeof updateArticuloSchema>
export type Articulo       = z.infer<typeof articuloSchema>

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

export const productoSchema = insertProductoSchema.extend({
  id: z.string(),
})

export type InsertProducto = z.infer<typeof insertProductoSchema>
export type UpdateProducto = z.infer<typeof updateProductoSchema>
export type Producto       = z.infer<typeof productoSchema>

export interface ImportResult {
  creados: number
  actualizados: number
  errores: { fila: number; error: string }[]
}
