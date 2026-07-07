import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Recibo, FormaPago } from '@/shared/lib/types'

const BRAND_BROWN = '#1a1a1a'

const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  EFECTIVO:      'Efectivo',
  CHEQUE:        'Cheque',
  TRANSFERENCIA: 'Transferencia',
  CTA_CTE:       'Cta. Cte.',
}

export interface ReciboItem {
  descripcion:    string
  cantidad:       number
  precioUnitario: number
}

const TICKET_WIDTH = 300

const s = StyleSheet.create({
  page:          { paddingTop: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', alignItems: 'center' },
  ticket:        { width: TICKET_WIDTH },
  nombre:        { fontSize: 12, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, textAlign: 'center' },
  info:          { fontSize: 8, color: '#555', textAlign: 'center', marginTop: 2 },
  divider:       { marginVertical: 8, borderBottomWidth: 1, borderBottomColor: '#999', borderBottomStyle: 'dashed' },
  docLabel:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, textAlign: 'center' },
  docFecha:      { fontSize: 8, color: '#555', textAlign: 'center', marginTop: 2 },
  row:           { flexDirection: 'row', marginBottom: 4 },
  rowLabel:      { width: 90, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  rowVal:        { flex: 1, fontSize: 9 },
  tableHeader:   { flexDirection: 'row', marginBottom: 3 },
  tableHeaderTxt:{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#555' },
  itemRow:       { flexDirection: 'row', marginBottom: 3 },
  colDesc:       { flex: 1, fontSize: 8.5, paddingRight: 4 },
  colCant:       { width: 26, fontSize: 8.5, textAlign: 'right' },
  colPrecio:     { width: 58, fontSize: 8.5, textAlign: 'right' },
  colSubtotal:   { width: 62, fontSize: 8.5, textAlign: 'right' },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  totalLabel:    { fontSize: 11, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN },
  totalVal:      { fontSize: 13, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN },
})

const money = (n: number) =>
  `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fechaLarga = (ts: { _seconds: number }) => {
  const d = new Date(ts._seconds * 1000)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface Props {
  recibo: Recibo
  items?: ReciboItem[]
}

export function ReciboPDF({ recibo, items = [] }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.ticket}>
          <Text style={s.nombre}>Trofeos Carrillon Siglo 21</Text>
          <Text style={s.info}>Av. Italia 947 — Resistencia, Chaco</Text>
          <Text style={s.info}>Tel: 3624-103544</Text>

          <View style={s.divider} />

          <Text style={s.docLabel}>RECIBO DE PAGO</Text>
          <Text style={s.docFecha}>{fechaLarga(recibo.fecha)}</Text>

          <View style={s.divider} />

          <View style={s.row}>
            <Text style={s.rowLabel}>Cliente:</Text>
            <Text style={s.rowVal}>{recibo.clienteNombre}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Forma de pago:</Text>
            <Text style={s.rowVal}>{FORMA_PAGO_LABELS[recibo.formaPago]}</Text>
          </View>
          {recibo.observaciones ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>Obs.:</Text>
              <Text style={s.rowVal}>{recibo.observaciones}</Text>
            </View>
          ) : null}

          {items.length > 0 ? (
            <>
              <View style={s.divider} />
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderTxt, s.colDesc]}>Descripción</Text>
                <Text style={[s.tableHeaderTxt, s.colCant]}>Cant.</Text>
                <Text style={[s.tableHeaderTxt, s.colPrecio]}>P/Unit.</Text>
                <Text style={[s.tableHeaderTxt, s.colSubtotal]}>Subtotal</Text>
              </View>
              {items.map((item, i) => (
                <View key={i} style={s.itemRow}>
                  <Text style={s.colDesc}>{item.descripcion}</Text>
                  <Text style={s.colCant}>{item.cantidad}</Text>
                  <Text style={s.colPrecio}>{money(item.precioUnitario)}</Text>
                  <Text style={s.colSubtotal}>{money(item.cantidad * item.precioUnitario)}</Text>
                </View>
              ))}
            </>
          ) : null}

          <View style={s.divider} />

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TOTAL</Text>
            <Text style={s.totalVal}>{money(recibo.monto)}</Text>
          </View>

          <View style={s.divider} />
        </View>
      </Page>
    </Document>
  )
}
