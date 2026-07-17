import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { OrdenDeTrabajoConItems, Producto, FormaPago, Empresa } from '@/shared/lib/types'

const BRAND_BROWN = '#1a1a1a'
const BRAND_GOLD  = '#999'
const BRAND_CREAM = '#f5f5f5'

const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  EFECTIVO:      'Efectivo',
  CHEQUE:        'Cheque',
  TRANSFERENCIA: 'Transferencia',
  CTA_CTE:       'Cta. Cte.',
}

const s = StyleSheet.create({
  page:          { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${BRAND_BROWN}` },
  empresa:       { flex: 1 },
  empresaNombre: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 4 },
  empresaInfo:   { fontSize: 9, color: '#555', lineHeight: 1.5 },
  docRight:      { alignItems: 'flex-end' },
  docLabel:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN },
  docNumero:     { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginTop: 2 },
  docFecha:      { fontSize: 9, color: '#555', marginTop: 4 },
  sectionTitle:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 4, textTransform: 'uppercase' },
  clienteBox:    { backgroundColor: BRAND_CREAM, padding: 10, borderRadius: 4, marginBottom: 14 },
  clienteRow:    { flexDirection: 'row', marginBottom: 3 },
  clienteLabel:  { width: 90, fontFamily: 'Helvetica-Bold', color: '#555', fontSize: 9 },
  clienteVal:    { flex: 1, fontSize: 9 },
  tableHeader:   { flexDirection: 'row', backgroundColor: '#e0e0e0', padding: '6 8', borderRadius: 3, marginBottom: 2 },
  tableHeaderTxt:{ color: '#1a1a1a', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow:      { flexDirection: 'row', padding: '5 8', borderBottom: `1px solid #ececec` },
  tableRowAlt:   { flexDirection: 'row', padding: '5 8', backgroundColor: '#fafafa', borderBottom: `1px solid #ececec` },
  colNum:        { width: 30 },
  colDesc:       { flex: 1, paddingLeft: 6 },
  colPrice:      { width: 72, textAlign: 'right' },
  colTotal:      { width: 72, textAlign: 'right' },
  pagoBox:       { marginTop: 14, padding: 10, border: `1px solid #e5e5e5`, borderRadius: 4 },
  pagoRow:       { flexDirection: 'row', marginBottom: 4 },
  pagoLabel:     { width: 90, fontFamily: 'Helvetica-Bold', color: '#555', fontSize: 9 },
  pagoVal:       { flex: 1, fontSize: 9, borderBottom: `1px solid #ccc`, paddingBottom: 2 },
  checkRow:      { flexDirection: 'row', gap: 14, marginTop: 8 },
  checkItem:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkBox:      { width: 10, height: 10, border: `1px solid #888` },
  checkBoxMark:  { width: 10, height: 10, border: `1px solid ${BRAND_BROWN}`, backgroundColor: BRAND_BROWN },
  checkLabel:    { fontSize: 9 },
  totalesBox:    { marginTop: 12, paddingTop: 8, borderTop: `2px solid ${BRAND_GOLD}` },
  totalRow:      { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 3 },
  totalLabel:    { fontFamily: 'Helvetica-Bold', fontSize: 10, color: BRAND_BROWN, width: 80, textAlign: 'right', marginRight: 12 },
  totalVal:      { fontFamily: 'Helvetica-Bold', fontSize: 10, color: BRAND_BROWN, width: 90, textAlign: 'right' },
  pagadoText:    { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, textAlign: 'center', marginTop: 6 },
  lineasBox:     { marginTop: 16, paddingTop: 8, borderTop: `1px dashed #ccc` },
  lineaHint:     { fontSize: 8, color: '#aaa', marginBottom: 8 },
  linea:         { borderBottom: `1px solid #ddd`, height: 1, marginBottom: 14 },
  footer:        { position: 'absolute', bottom: 24, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#aaa', borderTop: `1px solid #e5e5e5`, paddingTop: 6 },
})

const money = (n: number) =>
  `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fecha = (ts: { _seconds: number }) =>
  new Date(ts._seconds * 1000).toLocaleDateString('es-AR')

const fechaPrometida = (s: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  return s
}

interface Props {
  orden:     OrdenDeTrabajoConItems
  productos: Producto[]
  empresa:   Empresa
}

export function OrdenPDF({ orden, productos, empresa }: Props) {
  const productoPorId = new Map(productos.map(p => [p.id, p]))

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Encabezado */}
        <View style={s.headerRow}>
          <View style={s.empresa}>
            <Text style={s.empresaNombre}>{empresa.razonSocial}</Text>
            <Text style={s.empresaInfo}>{empresa.nombreFantasia}</Text>
            <Text style={s.empresaInfo}>{empresa.domicilio} — {empresa.localidad}</Text>
            <Text style={s.empresaInfo}>CUIT: {empresa.cuit} · IIBB: {empresa.iibb}</Text>
            <Text style={s.empresaInfo}>{empresa.condIva}</Text>
          </View>
          <View style={s.docRight}>
            <Text style={s.docLabel}>ORDEN DE TRABAJO</Text>
            <Text style={s.docNumero}>N° {orden.numero}</Text>
            <Text style={s.docFecha}>Fecha: {fecha(orden.createdAt)}</Text>
            <Text style={s.docFecha}>Entrega: {fechaPrometida(orden.fechaPrometida)}</Text>
          </View>
        </View>

        {/* Datos del cliente */}
        <View style={s.clienteBox}>
          <Text style={s.sectionTitle}>Cliente</Text>
          <View style={s.clienteRow}>
            <Text style={s.clienteLabel}>Nombre:</Text>
            <Text style={s.clienteVal}>{orden.clienteNombre}</Text>
          </View>
          {orden.clienteTelefono ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>Teléfono:</Text>
              <Text style={s.clienteVal}>{orden.clienteTelefono}</Text>
            </View>
          ) : null}
          {orden.clienteLocalidad ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>Localidad:</Text>
              <Text style={s.clienteVal}>{orden.clienteLocalidad}</Text>
            </View>
          ) : null}
          {orden.clienteCuit ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>CUIT:</Text>
              <Text style={s.clienteVal}>{orden.clienteCuit}</Text>
            </View>
          ) : null}
          <View style={s.clienteRow}>
            <Text style={s.clienteLabel}>Cond. de venta:</Text>
            <Text style={s.clienteVal}>{orden.condVenta}</Text>
          </View>
        </View>

        {/* Tabla de ítems */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderTxt, s.colNum]}>#</Text>
          <Text style={[s.tableHeaderTxt, s.colDesc]}>DETALLE</Text>
          <Text style={[s.tableHeaderTxt, s.colPrice]}>P/UNIT.</Text>
          <Text style={[s.tableHeaderTxt, s.colTotal]}>TOTALES</Text>
        </View>

        {orden.items.map((item, i) => {
          const producto = productoPorId.get(item.productoId)
          const desc = producto
            ? `${producto.codigo} — ${producto.descripcion}`
            : item.productoId
          return (
            <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={s.colNum}>{`#${i + 1}`}</Text>
              <Text style={s.colDesc}>{desc}</Text>
              <Text style={s.colPrice}>{money(item.precioUnitario)}</Text>
              <Text style={s.colTotal}>{money(item.subtotal)}</Text>
            </View>
          )
        })}

        {/* Forma de pago */}
        <View style={s.pagoBox}>
          <Text style={s.sectionTitle}>Forma de pago</Text>
          <View style={s.pagoRow}>
            <Text style={s.pagoLabel}>Recibo N°</Text>
            <Text style={s.pagoVal}>{orden.reciboNumero ?? ''}</Text>
          </View>
          <View style={s.pagoRow}>
            <Text style={s.pagoLabel}>Factura N°</Text>
            <Text style={s.pagoVal}>{orden.facturaNumero ?? ''}</Text>
          </View>
          <View style={s.checkRow}>
            {(['EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'CTA_CTE'] as FormaPago[]).map(fp => (
              <View key={fp} style={s.checkItem}>
                <View style={orden.formaPago === fp ? s.checkBoxMark : s.checkBox} />
                <Text style={s.checkLabel}>{FORMA_PAGO_LABELS[fp]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={s.totalesBox}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TOTAL</Text>
            <Text style={s.totalVal}>{money(orden.total)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>ENTREGA</Text>
            <Text style={s.totalVal}>{money(orden.montoEntrega)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>SALDO</Text>
            <Text style={s.totalVal}>{money(orden.saldo)}</Text>
          </View>
        </View>

        {orden.estado === 'PAGADO' ? (
          <Text style={s.pagadoText}>PAGADO</Text>
        ) : null}

        {/* Líneas en blanco para anotaciones del operario */}
        <View style={s.lineasBox}>
          <Text style={s.lineaHint}>
            Instrucciones de grabado / personalización (referenciar por #1, #2...):
          </Text>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={s.linea} />
          ))}
        </View>

        <Text style={s.footer}>
          {empresa.nombreFantasia} · {empresa.domicilio}, {empresa.localidad} · CUIT: {empresa.cuit}
        </Text>
      </Page>
    </Document>
  )
}
