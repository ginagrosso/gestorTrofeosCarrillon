import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Recibo, FormaPago } from '@/shared/lib/types'

const BRAND_BROWN = '#1a1a1a'
const BRAND_GOLD  = '#999'

const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  EFECTIVO:      'Efectivo',
  CHEQUE:        'Cheque',
  TRANSFERENCIA: 'Transferencia',
  CTA_CTE:       'Cta. Cte.',
}

const s = StyleSheet.create({
  page:      { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 14, borderBottom: `2px solid ${BRAND_BROWN}` },
  empresa:   { flex: 1 },
  nombre:    { fontSize: 15, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, marginBottom: 4 },
  info:      { fontSize: 9, color: '#555', lineHeight: 1.5 },
  docRight:  { alignItems: 'flex-end' },
  docLabel:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN },
  docFecha:  { fontSize: 9, color: '#555', marginTop: 6 },
  card:      { marginTop: 32, padding: 24, border: `1px solid #ddd`, borderRadius: 4 },
  recibido:  { fontSize: 11, lineHeight: 2, color: '#1a1a1a' },
  bold:      { fontFamily: 'Helvetica-Bold' },
  monto:     { fontSize: 22, fontFamily: 'Helvetica-Bold', color: BRAND_BROWN, textAlign: 'center', marginTop: 16, marginBottom: 8 },
  forma:     { fontSize: 10, color: '#666', textAlign: 'center' },
  divider:   { marginTop: 16, borderTop: `1px solid ${BRAND_GOLD}` },
  obs:       { marginTop: 10, fontSize: 9, color: '#555' },
  footer:    { position: 'absolute', bottom: 28, left: 48, right: 48, textAlign: 'center', fontSize: 8, color: '#aaa', borderTop: `1px solid #e5e5e5`, paddingTop: 6 },
})

const money = (n: number) =>
  `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fechaLarga = (ts: { _seconds: number }) => {
  const d = new Date(ts._seconds * 1000)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface Props { recibo: Recibo }

export function ReciboPDF({ recibo }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.empresa}>
            <Text style={s.nombre}>Trofeos Carrillon Siglo 21</Text>
            <Text style={s.info}>Av. Italia 947 — Resistencia, Chaco</Text>
            <Text style={s.info}>Tel: 3624-103544</Text>
            <Text style={s.info}>carrillonventas@gmail.com</Text>
          </View>
          <View style={s.docRight}>
            <Text style={s.docLabel}>RECIBO DE PAGO</Text>
            <Text style={s.docFecha}>{fechaLarga(recibo.fecha)}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.recibido}>
            {'Recibí de '}
            <Text style={s.bold}>{recibo.clienteNombre}</Text>
            {recibo.ordenNumero
              ? <Text>{' en concepto de '}<Text style={s.bold}>Orden de Trabajo N° {recibo.ordenNumero}</Text>{', la suma de:'}</Text>
              : <Text>{', la suma de:'}</Text>
            }
          </Text>

          <Text style={s.monto}>{money(recibo.monto)}</Text>
          <Text style={s.forma}>Forma de pago: {FORMA_PAGO_LABELS[recibo.formaPago]}</Text>

          {recibo.observaciones ? (
            <>
              <View style={s.divider} />
              <Text style={s.obs}>Observaciones: {recibo.observaciones}</Text>
            </>
          ) : null}
        </View>

        <Text style={s.footer}>
          Trofeos Carrillon Siglo 21 · Av. Italia 947, Resistencia, Chaco · Tel: 3624-103544
        </Text>
      </Page>
    </Document>
  )
}
