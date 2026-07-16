import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PresupuestoConItems, Producto, Empresa } from '@/shared/lib/types'

const BRAND_BROWN = '#1a1a1a'
const BRAND_GOLD  = '#999'
const BRAND_CREAM = '#f5f5f5'

const s = StyleSheet.create({
  page:          { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${BRAND_BROWN}` },
  empresa:       { flex: 1 },
  empresaNombre: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 4 },
  empresaInfo:   { fontSize: 9, color: '#555', lineHeight: 1.5 },
  docLabel:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, textAlign: 'right' },
  docFecha:      { fontSize: 9, color: '#555', textAlign: 'right', marginTop: 4 },
  sectionTitle:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 4, textTransform: 'uppercase' },
  clienteBox:    { backgroundColor: BRAND_CREAM, padding: 10, borderRadius: 4, marginBottom: 14 },
  clienteRow:    { flexDirection: 'row', marginBottom: 3 },
  clienteLabel:  { width: 90, fontFamily: 'Helvetica-Bold', color: '#555', fontSize: 9 },
  clienteVal:    { flex: 1, fontSize: 9 },
  metaRow:       { flexDirection: 'row', gap: 20, marginBottom: 14 },
  metaBox:       { flex: 1, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 4, border: `1px solid #e5e5e5` },
  metaLabel:     { fontSize: 8, color: '#888', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  metaVal:       { fontSize: 9 },
  tableHeader:   { flexDirection: 'row', backgroundColor: '#e0e0e0', padding: '6 8', borderRadius: 3, marginBottom: 2 },
  tableHeaderTxt:{ color: '#1a1a1a', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow:      { flexDirection: 'row', padding: '5 8', borderBottom: `1px solid #ececec` },
  tableRowAlt:   { flexDirection: 'row', padding: '5 8', backgroundColor: '#fafafa', borderBottom: `1px solid #ececec` },
  colCant:       { width: 40, textAlign: 'right' },
  colDesc:       { flex: 1, paddingLeft: 8 },
  colPrice:      { width: 70, textAlign: 'right' },
  colBonif:      { width: 50, textAlign: 'right' },
  colSub:        { width: 70, textAlign: 'right' },
  totalRow:      { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 8, borderTop: `2px solid ${BRAND_GOLD}` },
  totalLabel:    { fontFamily: 'Helvetica-Bold', fontSize: 11, color: BRAND_BROWN, marginRight: 16 },
  totalVal:      { fontFamily: 'Helvetica-Bold', fontSize: 11, color: BRAND_BROWN, width: 90, textAlign: 'right' },
  obs:           { marginTop: 14, padding: 8, backgroundColor: BRAND_CREAM, borderRadius: 4, fontSize: 9 },
  obsLabel:      { fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 3, fontSize: 9 },
  footer:        { position: 'absolute', bottom: 24, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#aaa', borderTop: `1px solid #e5e5e5`, paddingTop: 6 },
})

const money = (n: number) =>
  `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fecha = (ts: { _seconds: number }) =>
  new Date(ts._seconds * 1000).toLocaleDateString('es-AR')

interface Props {
  presupuesto: PresupuestoConItems
  productos:   Producto[]
  empresa:     Empresa
}

export function PresupuestoPDF({ presupuesto, productos, empresa }: Props) {
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
            <Text style={s.empresaInfo}>Inicio de actividades: {empresa.fechaInicioAct}</Text>
            <Text style={s.empresaInfo}>{empresa.condIva}</Text>
          </View>
          <View>
            <Text style={s.docLabel}>PRESUPUESTO</Text>
            <Text style={s.docFecha}>Fecha: {fecha(presupuesto.createdAt)}</Text>
          </View>
        </View>

        {/* Datos del cliente */}
        <View style={s.clienteBox}>
          <Text style={s.sectionTitle}>Cliente</Text>
          <View style={s.clienteRow}>
            <Text style={s.clienteLabel}>Nombre:</Text>
            <Text style={s.clienteVal}>{presupuesto.clienteNombre}</Text>
          </View>
          {presupuesto.clienteLocalidad ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>Localidad:</Text>
              <Text style={s.clienteVal}>{presupuesto.clienteLocalidad}</Text>
            </View>
          ) : null}
          {presupuesto.clienteCuit ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>CUIT:</Text>
              <Text style={s.clienteVal}>{presupuesto.clienteCuit}</Text>
            </View>
          ) : null}
          {presupuesto.clienteSitIva ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>Condición IVA:</Text>
              <Text style={s.clienteVal}>{presupuesto.clienteSitIva}</Text>
            </View>
          ) : null}
          <View style={s.clienteRow}>
            <Text style={s.clienteLabel}>Cond. de venta:</Text>
            <Text style={s.clienteVal}>{presupuesto.condVenta}</Text>
          </View>
        </View>

        {/* Plazo y validez */}
        <View style={s.metaRow}>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>PLAZO DE ENTREGA</Text>
            <Text style={s.metaVal}>{presupuesto.plazoEntrega}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>VALIDEZ DEL PRESUPUESTO</Text>
            <Text style={s.metaVal}>{presupuesto.validezDias} días</Text>
          </View>
        </View>

        {/* Tabla de ítems */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderTxt, s.colCant]}>Cant.</Text>
          <Text style={[s.tableHeaderTxt, s.colDesc]}>Descripción</Text>
          <Text style={[s.tableHeaderTxt, s.colPrice]}>P/Unit.</Text>
          <Text style={[s.tableHeaderTxt, s.colBonif]}>Bonif.%</Text>
          <Text style={[s.tableHeaderTxt, s.colSub]}>Subtotal</Text>
        </View>

        {presupuesto.items.map((item, i) => {
          const producto = productoPorId.get(item.productoId)
          const desc = producto
            ? `${producto.codigo} — ${producto.descripcion}`
            : item.productoId
          return (
            <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={s.colCant}>{item.cantidad}</Text>
              <Text style={s.colDesc}>{desc}</Text>
              <Text style={s.colPrice}>{money(item.precioUnitario)}</Text>
              <Text style={s.colBonif}>{item.bonificacion > 0 ? `${item.bonificacion}%` : '—'}</Text>
              <Text style={s.colSub}>{money(item.subtotal)}</Text>
            </View>
          )
        })}

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL</Text>
          <Text style={s.totalVal}>{money(presupuesto.total)}</Text>
        </View>

        {/* Observaciones */}
        {presupuesto.observaciones ? (
          <View style={s.obs}>
            <Text style={s.obsLabel}>Observaciones:</Text>
            <Text>{presupuesto.observaciones}</Text>
          </View>
        ) : null}

        <Text style={s.footer}>
          {empresa.nombreFantasia} · {empresa.domicilio}, {empresa.localidad} · CUIT: {empresa.cuit}
        </Text>
      </Page>
    </Document>
  )
}
