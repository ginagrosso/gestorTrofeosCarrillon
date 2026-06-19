import { z } from 'zod'
import { SIT_IVA_LABELS } from '@/shared/lib/types'
import type { Proveedor, Cliente, Articulo, Producto, InsertProveedor } from '@/shared/lib/types'
import type { ColumnMap } from '@/shared/lib/excel'

const toOptionalString = (value: unknown): string | undefined => {
  const text = String(value).trim()
  return text === '' ? undefined : text
}

const emailSchema = z.string().email()

// El email es opcional: si el valor cargado no tiene formato válido, se descarta
// en vez de rechazar toda la fila (errores de tipeo del sistema legacy).
const toEmail = (value: unknown): string | undefined => {
  const text = String(value).trim()
  return emailSchema.safeParse(text).success ? text : undefined
}

const toNumber = (value: unknown): number => Number(value)

const SIT_IVA_BY_LABEL = Object.fromEntries(
  Object.entries(SIT_IVA_LABELS).map(([clave, etiqueta]) => [etiqueta.toLowerCase(), clave]),
) as Record<string, InsertProveedor['sitIva']>

// Sinónimo usado por el sistema legacy que no se deriva de SIT_IVA_LABELS por normalización.
const SIT_IVA_ALIASES: Record<string, InsertProveedor['sitIva']> = {
  'exento en iva': 'EXENTO',
}

const toSitIva = (value: unknown): string => {
  const texto = String(value).trim().toLowerCase().replace(/\s+/g, ' ')
  return SIT_IVA_ALIASES[texto] ?? SIT_IVA_BY_LABEL[texto] ?? texto
}

export const proveedorColumns: ColumnMap<Proveedor> = {
  id:        { header: 'Id',           export: p => p.id },
  nombre:    { header: 'Nombre',        export: p => p.nombre,                 import: v => String(v).trim() },
  contacto:  { header: 'Contacto',      export: p => p.contacto ?? '',         import: toOptionalString },
  localidad: { header: 'Localidad',     export: p => p.localidad ?? '',        import: toOptionalString },
  direccion: { header: 'Dirección',     export: p => p.direccion ?? '',        import: toOptionalString },
  cuit:      { header: 'CUIT',          export: p => p.cuit ?? '',             import: toOptionalString },
  sitIva:    { header: 'Situación IVA', aliases: ['Sit. IVA'], export: p => SIT_IVA_LABELS[p.sitIva], import: toSitIva },
  telefono1: { header: 'Teléfono 1',    export: p => p.telefono1 ?? '',        import: toOptionalString },
  telefono2: { header: 'Teléfono 2',    export: p => p.telefono2 ?? '',        import: toOptionalString },
  rubro:     { header: 'Rubro',         export: p => p.rubro ?? '',            import: toOptionalString },
}

export const clienteColumns: ColumnMap<Cliente> = {
  id:              { header: 'Id',               export: c => c.id },
  nombre:          { header: 'Nombre',           export: c => c.nombre,                          import: v => String(v).trim() },
  situacionFiscal: { header: 'Situación Fiscal', export: c => SIT_IVA_LABELS[c.situacionFiscal], import: toSitIva },
  tipoDoc:         { header: 'Tipo Doc',         export: c => c.tipoDoc,                         import: v => String(v).trim().toUpperCase() },
  cuit:            { header: 'CUIT',             export: c => c.cuit ?? '',                      import: toOptionalString },
  direccion:       { header: 'Dirección',        export: c => c.direccion ?? '',  import: toOptionalString },
  localidad:       { header: 'Localidad',        export: c => c.localidad ?? '',  import: toOptionalString },
  provincia:       { header: 'Provincia',        export: c => c.provincia ?? '',  import: toOptionalString },
  telefono:        { header: 'Teléfono',         export: c => c.telefono ?? '',   import: toOptionalString },
  celular:         { header: 'Celular',          export: c => c.celular ?? '',                   import: toOptionalString },
  email:           { header: 'Email', aliases: ['e Mail'], export: c => c.email ?? '',           import: toEmail },
}

// La importación de artículos resuelve el proveedor por nombre (ver importArticuloRowSchema).
export type ArticuloExport = Articulo & { proveedorNombre: string }

export const articuloColumns: ColumnMap<ArticuloExport> = {
  id:              { header: 'Id',           export: a => a.id },
  codigo:          { header: 'Código', aliases: ['Codigo Articulo'], export: a => a.codigo, import: v => String(v).trim() },
  descripcion:     { header: 'Descripción',  export: a => a.descripcion,     import: v => String(v).trim() },
  precioCosto:     { header: 'Precio Costo', export: a => a.precioCosto,     import: toNumber },
  porcIva:         { header: '% IVA', aliases: ['Porc Iva'], export: a => a.porcIva, import: toNumber },
  precioVenta:     { header: 'Precio Venta', export: a => a.precioVenta,     import: toNumber },
  proveedorNombre: { header: 'Proveedor',    export: a => a.proveedorNombre, import: v => String(v).trim() },
  unidad:          { header: 'Unidad',       export: a => a.unidad,          import: v => String(v).trim() },
  stock:           { header: 'Stock', aliases: ['Stock Actual'], export: a => a.stock, import: toNumber },
}

export type ProductoExport = Producto & { materiales: string }

export const productoColumns: ColumnMap<ProductoExport> = {
  id:              { header: 'Id',           export: p => p.id },
  codigo:          { header: 'Código', aliases: ['Codigo Articulo'], export: p => p.codigo, import: v => String(v).trim() },
  descripcion:     { header: 'Descripción',  export: p => p.descripcion,     import: v => String(v).trim() },
  precioCosto:     { header: 'Precio Costo', export: p => p.precioCosto,     import: toNumber },
  precioVenta:     { header: 'Precio Venta', export: p => p.precioVenta,     import: toNumber },
  porcIva:         { header: '% IVA', aliases: ['Porc Iva'], export: p => p.porcIva, import: toNumber },
  stockActual:     { header: 'Stock', aliases: ['Stock Actual'], export: p => p.stockActual, import: toNumber },
  // "Columna 8"/"Columna 9": en exportacionProductosCarrillon.xls estas columnas
  // (Rubro/Subrubro) no tienen encabezado de texto, se referencian por posición.
  categoria:       { header: 'Categoría', aliases: ['Categoria', 'Columna 8'], export: p => p.categoria ?? '', import: toOptionalString },
  subcategoria:    { header: 'Subcategoría', aliases: ['Subcategoria', 'Columna 9'], export: p => p.subcategoria ?? '', import: toOptionalString },
  // Lista de materiales (BOM): solo exportación, se gestiona desde la Ficha de Producto.
  materiales:      { header: 'Lista de materiales', export: p => p.materiales },
}
