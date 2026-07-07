import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { TIPO_COMPROBANTE_LABELS, type ComprobanteConItems, type Empresa } from '@/shared/lib/types'

const BRAND_BROWN = '#7B4A2D'
const BRAND_GOLD  = '#C9A84C'
const BRAND_CREAM = '#F5EFE0'

const s = StyleSheet.create({
  page:          { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#2a2a2a' },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${BRAND_BROWN}` },
  empresa:       { flex: 1 },
  empresaNombre: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 4 },
  empresaInfo:   { fontSize: 9, color: '#555', lineHeight: 1.5 },
  docRight:      { alignItems: 'flex-end' },
  docLabel:      { fontSize: 13, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN },
  docNumero:     { fontSize: 12, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginTop: 2 },
  docFecha:      { fontSize: 9, color: '#555', marginTop: 4 },
  refBox:        { marginBottom: 12, padding: 8, backgroundColor: BRAND_CREAM, borderRadius: 4, fontSize: 9 },
  sectionTitle:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 4, textTransform: 'uppercase' },
  clienteBox:    { backgroundColor: BRAND_CREAM, padding: 10, borderRadius: 4, marginBottom: 14 },
  clienteRow:    { flexDirection: 'row', marginBottom: 3 },
  clienteLabel:  { width: 90, fontFamily: 'Helvetica-Bold', color: '#555', fontSize: 9 },
  clienteVal:    { flex: 1, fontSize: 9 },
  tableHeader:   { flexDirection: 'row', backgroundColor: BRAND_GOLD, padding: '6 8', borderRadius: 3, marginBottom: 2 },
  tableHeaderTxt:{ color: BRAND_BROWN, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow:      { flexDirection: 'row', padding: '5 8', borderBottom: '1px solid #ececec' },
  tableRowAlt:   { flexDirection: 'row', padding: '5 8', backgroundColor: '#faf6ee', borderBottom: '1px solid #ececec' },
  colCant:       { width: 40, textAlign: 'right' },
  colCodigo:     { width: 60 },
  colDesc:       { flex: 1, paddingLeft: 8 },
  colPrice:      { width: 70, textAlign: 'right' },
  colBonif:      { width: 50, textAlign: 'right' },
  colSub:        { width: 70, textAlign: 'right' },
  totalRow:      { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 8, borderTop: `2px solid ${BRAND_GOLD}` },
  totalLabel:    { fontFamily: 'Helvetica-Bold', fontSize: 11, color: BRAND_BROWN, marginRight: 16 },
  totalVal:      { fontFamily: 'Helvetica-Bold', fontSize: 11, color: BRAND_BROWN, width: 90, textAlign: 'right' },
  obs:           { marginTop: 14, padding: 8, backgroundColor: BRAND_CREAM, borderRadius: 4, fontSize: 9 },
  obsLabel:      { fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 3, fontSize: 9 },
  footer:        { position: 'absolute', bottom: 24, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#aaa', borderTop: '1px solid #e5e5e5', paddingTop: 6 },
})

const money = (n: number) =>
  `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fecha = (ts: { _seconds: number }) =>
  new Date(ts._seconds * 1000).toLocaleDateString('es-AR')

interface Props {
  comprobante: ComprobanteConItems
  empresa:     Empresa
}

/** PDF completo (no overlay) para Nota de Crédito C / Nota de Débito C, generado en hoja en blanco. */
export function ComprobantePDFCompleto({ comprobante, empresa }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View style={s.empresa}>
            <Text style={s.empresaNombre}>{empresa.nombreFantasia}</Text>
            <Text style={s.empresaInfo}>{empresa.razonSocial}</Text>
            <Text style={s.empresaInfo}>{empresa.domicilio} — {empresa.localidad}</Text>
            <Text style={s.empresaInfo}>CUIT: {empresa.cuit} · IIBB: {empresa.iibb}</Text>
            <Text style={s.empresaInfo}>Inicio de actividades: {empresa.fechaInicioAct}</Text>
            <Text style={s.empresaInfo}>{empresa.condIva}</Text>
          </View>
          <View style={s.docRight}>
            <Text style={s.docLabel}>{TIPO_COMPROBANTE_LABELS[comprobante.tipo].toUpperCase()}</Text>
            <Text style={s.docNumero}>N° {comprobante.numero}</Text>
            <Text style={s.docFecha}>Fecha: {fecha(comprobante.fecha)}</Text>
          </View>
        </View>

        {comprobante.comprobanteRef ? (
          <View style={s.refBox}>
            <Text>Comprobante de referencia: {comprobante.comprobanteRef}</Text>
          </View>
        ) : null}

        <View style={s.clienteBox}>
          <Text style={s.sectionTitle}>Cliente</Text>
          <View style={s.clienteRow}>
            <Text style={s.clienteLabel}>Nombre:</Text>
            <Text style={s.clienteVal}>{comprobante.clienteNombre}</Text>
          </View>
          {comprobante.clienteDireccion ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>Dirección:</Text>
              <Text style={s.clienteVal}>{comprobante.clienteDireccion}</Text>
            </View>
          ) : null}
          {comprobante.clienteLocalidad ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>Localidad:</Text>
              <Text style={s.clienteVal}>{comprobante.clienteLocalidad}</Text>
            </View>
          ) : null}
          {comprobante.clienteCuit ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>CUIT:</Text>
              <Text style={s.clienteVal}>{comprobante.clienteCuit}</Text>
            </View>
          ) : null}
          {comprobante.clienteSitIva ? (
            <View style={s.clienteRow}>
              <Text style={s.clienteLabel}>Condición IVA:</Text>
              <Text style={s.clienteVal}>{comprobante.clienteSitIva}</Text>
            </View>
          ) : null}
          <View style={s.clienteRow}>
            <Text style={s.clienteLabel}>Cond. de venta:</Text>
            <Text style={s.clienteVal}>{comprobante.condVenta}</Text>
          </View>
        </View>

        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderTxt, s.colCant]}>Cant.</Text>
          <Text style={[s.tableHeaderTxt, s.colCodigo]}>Código</Text>
          <Text style={[s.tableHeaderTxt, s.colDesc]}>Descripción</Text>
          <Text style={[s.tableHeaderTxt, s.colPrice]}>Precio</Text>
          <Text style={[s.tableHeaderTxt, s.colBonif]}>Bonif.</Text>
          <Text style={[s.tableHeaderTxt, s.colSub]}>Sub Total</Text>
        </View>

        {comprobante.items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={s.colCant}>{item.cantidad}</Text>
            <Text style={s.colCodigo}>{item.codigo ?? '—'}</Text>
            <Text style={s.colDesc}>{item.descripcion}</Text>
            <Text style={s.colPrice}>{money(item.precioUnitario)}</Text>
            <Text style={s.colBonif}>{item.bonificacion > 0 ? `${item.bonificacion}%` : '—'}</Text>
            <Text style={s.colSub}>{money(item.subtotal)}</Text>
          </View>
        ))}

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL</Text>
          <Text style={s.totalVal}>{money(comprobante.total)}</Text>
        </View>

        {comprobante.observaciones ? (
          <View style={s.obs}>
            <Text style={s.obsLabel}>Observaciones:</Text>
            <Text>{comprobante.observaciones}</Text>
          </View>
        ) : null}

        <Text style={s.footer}>
          {empresa.nombreFantasia} · {empresa.domicilio}, {empresa.localidad} · CUIT: {empresa.cuit}
        </Text>
      </Page>
    </Document>
  )
}
