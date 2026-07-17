import { z } from 'zod'

// Representación serializada de un Timestamp de Firestore tal como llega por la API.
export interface FirestoreTimestamp {
  _seconds: number
  _nanoseconds: number
}

export const insertProveedorSchema = z.object({
  nombre:     z.string().min(1, 'El nombre es obligatorio').max(200),
  localidad:  z.string().max(100).optional(),
  direccion:  z.string().max(300).optional(),
  cuit:       z.string().max(20).optional(),
  sitIva:     z.enum(['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO', 'CONSUMIDOR_FINAL']),
  contacto1:  z.string().max(200).optional(),
  telefono1:  z.string().max(30).optional(),
  contacto2:  z.string().max(200).optional(),
  telefono2:  z.string().max(30).optional(),
  contacto3:  z.string().max(200).optional(),
  telefono3:  z.string().max(30).optional(),
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
  contacto1:       z.string().max(200).optional(),
  telefono1:       z.string().max(30).optional(),
  contacto2:       z.string().max(200).optional(),
  telefono2:       z.string().max(30).optional(),
  contacto3:       z.string().max(200).optional(),
  telefono3:       z.string().max(30).optional(),
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
  precioCosto:  precioSinDecimales,
  // Las dos empresas son monotributistas y no discriminan IVA: el default es 0.
  porcIva:      z.number().nonnegative().default(0),
  precioVenta:  precioSinDecimales,
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
  empresaId:        z.string().min(1, 'La empresa es obligatoria'),
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
  empresaId?:       string | null
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

export const FORMA_PAGO_VALUES = ['EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'CTA_CTE'] as const
export type FormaPago = typeof FORMA_PAGO_VALUES[number]

export const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  EFECTIVO:      'Efectivo',
  CHEQUE:        'Cheque',
  TRANSFERENCIA: 'Transferencia',
  CTA_CTE:       'Cta. Cte.',
}

export const ESTADO_ORDEN_VALUES = ['PENDIENTE', 'PARCIAL', 'PAGADO'] as const
export type EstadoOrden = typeof ESTADO_ORDEN_VALUES[number]

export const ordenItemInputSchema = z.object({
  productoId:     z.string().min(1, 'El producto es obligatorio'),
  cantidad:       z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
})

export const insertOrdenSchema = z.object({
  fechaPrometida:   z.string().min(1, 'La fecha prometida es obligatoria').max(100),
  empresaId:        z.string().min(1, 'La empresa es obligatoria'),
  clienteId:        z.string().optional(),
  clienteNombre:    z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  clienteTelefono:  z.string().max(50).optional(),
  clienteLocalidad: z.string().max(100).optional(),
  clienteCuit:      z.string().max(20).optional(),
  condVenta:        z.string().max(50).default('CONTADO'),
  formaPago:        z.enum(FORMA_PAGO_VALUES).nullable().optional(),
  reciboNumero:     z.string().max(50).optional(),
  facturaNumero:    z.string().max(50).optional(),
  montoEntrega:     z.number().nonnegative().default(0),
  presupuestoId:    z.string().optional(),
  items:            z.array(ordenItemInputSchema).min(1, 'Agregá al menos un ítem'),
})

export const updateOrdenPagoSchema = z.object({
  montoEntrega:  z.number().nonnegative(),
  formaPago:     z.enum(FORMA_PAGO_VALUES),
  reciboNumero:  z.string().max(50).optional(),
  facturaNumero: z.string().max(50).optional(),
})

export type OrdenItemInput  = z.infer<typeof ordenItemInputSchema>
export type InsertOrden     = z.infer<typeof insertOrdenSchema>
export type UpdateOrdenPago = z.infer<typeof updateOrdenPagoSchema>

export interface OrdenItem {
  id:             string
  ordenId:        string
  productoId:     string
  cantidad:       number
  precioUnitario: number
  subtotal:       number
}

export interface OrdenDeTrabajo {
  id:               string
  numero:           number
  fechaPrometida:   string
  empresaId?:       string | null
  clienteId?:       string | null
  clienteNombre:    string
  clienteTelefono?: string | null
  clienteLocalidad?: string | null
  clienteCuit?:     string | null
  condVenta:        string
  formaPago:        FormaPago | null
  reciboNumero?:    string | null
  facturaNumero?:   string | null
  montoEntrega:     number
  total:            number
  saldo:            number
  estado:           EstadoOrden
  presupuestoId?:   string | null
  createdAt:        FirestoreTimestamp
  updatedAt:        FirestoreTimestamp
  deletedAt:        FirestoreTimestamp | null
}

export interface OrdenDeTrabajoConItems extends OrdenDeTrabajo {
  items: OrdenItem[]
}

export const TIPO_COMPROBANTE_VALUES = ['FACTURA_C', 'REMITO', 'NOTA_CREDITO_C', 'NOTA_DEBITO_C'] as const
export type TipoComprobante = typeof TIPO_COMPROBANTE_VALUES[number]

export const TIPO_COMPROBANTE_LABELS: Record<TipoComprobante, string> = {
  FACTURA_C:      'Factura C',
  REMITO:         'Remito',
  NOTA_CREDITO_C: 'Nota de Crédito C',
  NOTA_DEBITO_C:  'Nota de Débito C',
}

const contadorSchema = z.object({
  puntoVenta:   z.string().default('0001'),
  ultimoNumero: z.number().int().nonnegative().default(0),
})

const contadoresSchema = z.object({
  FACTURA_C:      contadorSchema,
  REMITO:         contadorSchema,
  NOTA_CREDITO_C: contadorSchema,
  NOTA_DEBITO_C:  contadorSchema,
})

export type Contador   = z.infer<typeof contadorSchema>
export type Contadores = z.infer<typeof contadoresSchema>

const defaultContadores: Contadores = {
  FACTURA_C:      { puntoVenta: '0001', ultimoNumero: 0 },
  REMITO:         { puntoVenta: '0001', ultimoNumero: 0 },
  NOTA_CREDITO_C: { puntoVenta: '0001', ultimoNumero: 0 },
  NOTA_DEBITO_C:  { puntoVenta: '0001', ultimoNumero: 0 },
}

export const insertEmpresaSchema = z.object({
  nombreFantasia: z.string().min(1, 'El nombre de fantasía es obligatorio').max(200),
  razonSocial:    z.string().min(1, 'La razón social es obligatoria').max(200),
  domicilio:      z.string().min(1, 'El domicilio es obligatorio').max(300),
  localidad:      z.string().min(1, 'La localidad es obligatoria').max(100),
  cuit:           z.string().min(1, 'El CUIT es obligatorio').max(20),
  iibb:           z.string().min(1, 'El número de IIBB es obligatorio').max(30),
  fechaInicioAct: z.string().min(1, 'La fecha de inicio de actividades es obligatoria').max(20),
  condIva:        z.string().min(1, 'La condición IVA es obligatoria').max(100),
  activa:         z.boolean().default(true),
  contadores:     contadoresSchema.default(defaultContadores),
})

export const updateEmpresaSchema = insertEmpresaSchema.partial()

export const empresaSchema = insertEmpresaSchema.extend({
  id: z.string(),
})

export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>
export type UpdateEmpresa = z.infer<typeof updateEmpresaSchema>
export type Empresa       = z.infer<typeof empresaSchema>

export const insertReciboSchema = z.object({
  clienteId:     z.string().optional(),
  clienteNombre: z.string().max(200).optional(),
  monto:         z.number().positive('El monto debe ser mayor a 0'),
  formaPago:     z.enum(FORMA_PAGO_VALUES),
  ordenId:       z.string().optional(),
  ordenNumero:   z.number().optional(),
  observaciones: z.string().max(300).optional(),
  empresaId:     z.string().optional(),
})

export type InsertRecibo = z.infer<typeof insertReciboSchema>

export interface Recibo {
  id:             string
  numero:         number
  clienteId?:     string | null
  clienteNombre?: string | null
  monto:          number
  formaPago:      FormaPago
  ordenId?:       string | null
  ordenNumero?:   number | null
  observaciones?: string | null
  empresaId?:     string | null
  fecha:          FirestoreTimestamp
  createdAt:      FirestoreTimestamp
  deletedAt:      FirestoreTimestamp | null
}

const NOTA_TIPOS_COMPROBANTE = ['NOTA_CREDITO_C', 'NOTA_DEBITO_C']

export const comprobanteItemInputSchema = z.object({
  codigo:         z.string().max(50).optional(),
  descripcion:    z.string().min(1, 'La descripción es obligatoria').max(300),
  cantidad:       z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
  bonificacion:   z.number().min(0).max(100).default(0),
})

export const insertComprobanteSchema = z.object({
  tipo:             z.enum(TIPO_COMPROBANTE_VALUES),
  empresaId:        z.string().min(1, 'La empresa es obligatoria'),
  clienteId:        z.string().optional(),
  clienteNombre:    z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  clienteDireccion: z.string().max(300).optional(),
  clienteLocalidad: z.string().max(100).optional(),
  clienteCuit:      z.string().max(20).optional(),
  clienteSitIva:    z.string().max(50).optional(),
  condVenta:        z.string().max(50).default('CONTADO'),
  observaciones:    z.string().max(500).optional(),
  ordenId:          z.string().optional(),
  presupuestoId:    z.string().optional(),
  comprobanteRef:   z.string().max(50).optional(),
  items:            z.array(comprobanteItemInputSchema).min(1, 'Agregá al menos un ítem'),
}).refine(
  data => !NOTA_TIPOS_COMPROBANTE.includes(data.tipo) || !!data.comprobanteRef,
  { message: 'El comprobante de referencia es obligatorio para Notas de Crédito/Débito', path: ['comprobanteRef'] },
)

export type ComprobanteItemInput = z.infer<typeof comprobanteItemInputSchema>
export type InsertComprobante    = z.infer<typeof insertComprobanteSchema>

export interface ComprobanteItem {
  id:             string
  comprobanteId:  string
  codigo?:        string | null
  descripcion:    string
  cantidad:       number
  precioUnitario: number
  bonificacion:   number
  subtotal:       number
}

export interface Comprobante {
  id:                string
  tipo:              TipoComprobante
  numero:            string
  fecha:             FirestoreTimestamp
  empresaId:         string
  clienteId?:        string | null
  clienteNombre:     string
  clienteDireccion?: string | null
  clienteLocalidad?: string | null
  clienteCuit?:      string | null
  clienteSitIva?:    string | null
  condVenta:         string
  observaciones?:    string | null
  total:             number
  ordenId?:          string | null
  presupuestoId?:    string | null
  comprobanteRef?:   string | null
  createdAt:         FirestoreTimestamp
  updatedAt:         FirestoreTimestamp
  deletedAt:         FirestoreTimestamp | null
}

export interface ComprobanteConItems extends Comprobante {
  items: ComprobanteItem[]
}
