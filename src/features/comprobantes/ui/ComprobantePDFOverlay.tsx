import { Document, Page, View, Text } from '@react-pdf/renderer'
import type { ComprobanteConItems } from '@/shared/lib/types'
import { OVERLAY } from '../lib/overlay-coords'

// Sin símbolo "$": el overlay imprime solo el número, igual que el sistema legacy.
const numero = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fecha = (ts: { _seconds: number }) =>
  new Date(ts._seconds * 1000).toLocaleDateString('es-AR')

const abs = (x: number, y: number) => ({
  position: 'absolute' as const,
  left:     `${x}mm`,
  top:      `${y}mm`,
  fontSize: 9,
})

interface Props {
  comprobante: ComprobanteConItems
}

/**
 * Overlay transparente con los datos variables de Factura C / Remito, para superponer sobre
 * el formulario preimpreso. El formulario físico NO trae los labels ("Cliente:", "CUIT:", etc.)
 * ni la palabra "Total:" — el sistema los imprime junto con el valor, igual que el sistema legacy.
 * Los labels se imprimen siempre en su posición fija, aunque el valor esté vacío (ej. "Obs.:").
 */
export function ComprobantePDFOverlay({ comprobante }: Props) {
  return (
    <Document>
      <Page size="A4" style={{ backgroundColor: 'transparent', fontFamily: 'Helvetica', fontSize: 9 }}>
        <Text style={abs(OVERLAY.fecha.x, OVERLAY.fecha.y)}>{fecha(comprobante.fecha)}</Text>
        <Text style={abs(OVERLAY.clienteNombre.x, OVERLAY.clienteNombre.y)}>Cliente: {comprobante.clienteNombre}</Text>
        <Text style={abs(OVERLAY.clienteDireccion.x, OVERLAY.clienteDireccion.y)}>Dirección: {comprobante.clienteDireccion ?? ''}</Text>
        <Text style={abs(OVERLAY.clienteLocalidad.x, OVERLAY.clienteLocalidad.y)}>Localidad: {comprobante.clienteLocalidad ?? ''}</Text>
        <Text style={abs(OVERLAY.clienteCuit.x, OVERLAY.clienteCuit.y)}>CUIT: {comprobante.clienteCuit ?? ''}</Text>
        <Text style={abs(OVERLAY.clienteSitIva.x, OVERLAY.clienteSitIva.y)}>Sit.IVA: {comprobante.clienteSitIva ?? ''}</Text>
        <Text style={abs(OVERLAY.condVenta.x, OVERLAY.condVenta.y)}>Cond.Venta: {comprobante.condVenta}</Text>
        <Text style={abs(OVERLAY.observaciones.x, OVERLAY.observaciones.y)}>Obs.: {comprobante.observaciones ?? ''}</Text>

        {comprobante.items.map((item, i) => {
          const y = OVERLAY.tabla.startY + i * OVERLAY.tabla.rowHeight
          return (
            <View key={item.id}>
              <Text style={abs(OVERLAY.tabla.cols.cant, y)}>{item.cantidad}</Text>
              <Text style={abs(OVERLAY.tabla.cols.codigo, y)}>{item.codigo ?? ''}</Text>
              <Text style={abs(OVERLAY.tabla.cols.descripcion, y)}>{item.descripcion}</Text>
              <Text style={abs(OVERLAY.tabla.cols.precio, y)}>{numero(item.precioUnitario)}</Text>
              <Text style={abs(OVERLAY.tabla.cols.bonif, y)}>{numero(item.bonificacion)}</Text>
              <Text style={abs(OVERLAY.tabla.cols.subtotal, y)}>{numero(item.subtotal)}</Text>
            </View>
          )
        })}

        <Text style={{ ...abs(OVERLAY.total.x, OVERLAY.total.y), fontFamily: 'Helvetica-Bold' }}>
          Total: {numero(comprobante.total)}
        </Text>
      </Page>
    </Document>
  )
}
