import { z } from 'zod'

// Representación serializada de un Timestamp de Firestore tal como llega por la API.
export interface FirestoreTimestamp {
  _seconds: number
  _nanoseconds: number
}

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

export const clienteSchema = insertClienteSchema.extend({
  id: z.string(),
})

export type InsertCliente = z.infer<typeof insertClienteSchema>
export type UpdateCliente = z.infer<typeof updateClienteSchema>
export type Cliente       = z.infer<typeof clienteSchema>

export const TIPO_DOC_LABELS: Record<InsertCliente['tipoDoc'], string> = {
  CUIT: 'CUIT',
  CUIL: 'CUIL',
  DNI:  'DNI',
  CUE:  'CUE',
  CUI:  'CUI',
}

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
  precioActualizadoAt: z.custom<FirestoreTimestamp | null>(),
})

export type InsertArticulo = z.infer<typeof insertArticuloSchema>
export type UpdateArticulo = z.infer<typeof updateArticuloSchema>
export type Articulo       = z.infer<typeof articuloSchema>

// Actualización masiva de precios por proveedor (% único sobre precioCosto)
export const actualizarPreciosPorProveedorSchema = z.object({
  proveedorId: z.string().min(1, 'Seleccioná un proveedor'),
  porcentaje: z.number()
    .refine(v => v !== 0, 'El porcentaje no puede ser 0')
    .refine(v => v >= -100, 'El porcentaje no puede ser menor a -100'),
})

export type ActualizarPreciosPorProveedor = z.infer<typeof actualizarPreciosPorProveedorSchema>

export const insertProductoSchema = z.object({
  codigo:       z.string().min(1, 'El código es obligatorio').max(50),
  descripcion:  z.string().min(1, 'La descripción es obligatoria').max(300),
  precioCosto:  z.number().nonnegative(),
  porcIva:      z.number().nonnegative(),
  precioVenta:  z.number().nonnegative(),
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

export const productoArticuloItemSchema = z.object({
  articuloId: z.string().min(1, 'Seleccioná un artículo'),
  cantidad:   z.number().positive('La cantidad debe ser mayor a 0'),
})

export const replaceProductoArticulosSchema = z.object({
  items: z.array(productoArticuloItemSchema),
}).refine(
  data => new Set(data.items.map(item => item.articuloId)).size === data.items.length,
  { message: 'No se puede repetir el mismo artículo en la lista de materiales', path: ['items'] },
)

export type ProductoArticuloItem     = z.infer<typeof productoArticuloItemSchema>
export type ReplaceProductoArticulos = z.infer<typeof replaceProductoArticulosSchema>

export interface ProductoArticulo extends ProductoArticuloItem {
  id:         string
  productoId: string
  articulo:   Articulo | null
}

export interface ImportResult {
  creados: number
  actualizados: number
  errores: { fila: number; error: string }[]
}

export const compraItemInputSchema = z.object({
  articuloId:     z.string().min(1, 'El artículo es obligatorio'),
  cantidad:       z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
})

export const insertCompraSchema = z.object({
  proveedorId:    z.string().min(1, 'El proveedor es obligatorio'),
  nroComprobante: z.string().max(50).optional(),
  items:          z.array(compraItemInputSchema).min(1, 'Agregá al menos un ítem'),
})

export type CompraItemInput = z.infer<typeof compraItemInputSchema>
export type InsertCompra    = z.infer<typeof insertCompraSchema>

export interface CompraItem {
  id:             string
  compraId:       string
  articuloId:     string
  cantidad:       number
  precioUnitario: number
}

export interface Compra {
  id:             string
  proveedorId:    string
  nroComprobante?: string | null
  total:          number
  createdAt:      FirestoreTimestamp
  updatedAt:      FirestoreTimestamp
  deletedAt:      FirestoreTimestamp | null
}

export interface CompraConItems extends Compra {
  items: CompraItem[]
}

export const presupuestoItemInputSchema = z.object({
  productoId:     z.string().min(1, 'El producto es obligatorio'),
  cantidad:       z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
  bonificacion:   z.number().min(0).max(100).default(0),
})

export const insertPresupuestoSchema = z.object({
  clienteId:        z.string().optional(),
  clienteNombre:    z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  clienteLocalidad: z.string().max(100).optional(),
  clienteCuit:      z.string().max(20).optional(),
  clienteSitIva:    z.string().max(50).optional(),
  condVenta:        z.string().max(50).default('CONTADO'),
  observaciones:    z.string().max(500).optional(),
  plazoEntrega:     z.string().max(100).default('INMEDIATO'),
  validezDias:      z.number().int().positive().default(30),
  items:            z.array(presupuestoItemInputSchema).min(1, 'Agregá al menos un ítem'),
})

export const updatePresupuestoSchema = insertPresupuestoSchema.partial()

export type PresupuestoItemInput = z.infer<typeof presupuestoItemInputSchema>
export type InsertPresupuesto    = z.infer<typeof insertPresupuestoSchema>
export type UpdatePresupuesto    = z.infer<typeof updatePresupuestoSchema>

export interface PresupuestoItem {
  id:             string
  presupuestoId:  string
  productoId:     string
  cantidad:       number
  precioUnitario: number
  bonificacion:   number
  subtotal:       number
}

export interface Presupuesto {
  id:               string
  numero:           number
  clienteId?:       string | null
  clienteNombre:    string
  clienteLocalidad?: string | null
  clienteCuit?:     string | null
  clienteSitIva?:   string | null
  condVenta:        string
  observaciones?:   string | null
  plazoEntrega:     string
  validezDias:      number
  total:            number
  createdAt:        FirestoreTimestamp
  updatedAt:        FirestoreTimestamp
  deletedAt:        FirestoreTimestamp | null
}

export interface PresupuestoConItems extends Presupuesto {
  items: PresupuestoItem[]
}
