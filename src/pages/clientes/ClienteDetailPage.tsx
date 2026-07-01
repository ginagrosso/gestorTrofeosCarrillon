import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, MessageCircle } from 'lucide-react'
import { useCliente, ClienteForm } from '@/features/clientes'
import { useOrdenes } from '@/features/ordenes'
import { SIT_IVA_LABELS, TIPO_DOC_LABELS, type EstadoOrden } from '@/shared/lib/types'
import { getWhatsAppUrl } from '@/shared/lib/whatsapp'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'

const ESTADO_CLASS: Record<EstadoOrden, string> = {
  PENDIENTE: 'text-muted-foreground',
  PARCIAL:   'font-medium text-yellow-600',
  PAGADO:    'font-medium text-green-600',
}

const fmtFecha = (s: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  return s
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  )
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: cliente, isLoading } = useCliente(id!)
  const { data: todasLasOrdenes }    = useOrdenes()
  const [editOpen, setEditOpen] = useState(false)

  const ordenesCliente = (todasLasOrdenes ?? []).filter(o => o.clienteId === id)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 max-w-4xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/clientes"><ArrowLeft className="mr-1 h-4 w-4" />Volver</Link>
        </Button>
        <p className="mt-4 text-muted-foreground">Cliente no encontrado.</p>
      </div>
    )
  }

  const whatsappNum = cliente.celular || cliente.telefono

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/clientes">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a Clientes
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">{cliente.nombre}</h1>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="rounded-lg border bg-background p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoField label="Situación fiscal" value={SIT_IVA_LABELS[cliente.situacionFiscal]} />
        <InfoField
          label="Documento"
          value={cliente.cuit ? `${TIPO_DOC_LABELS[cliente.tipoDoc]} ${cliente.cuit}` : ''}
        />
        <InfoField label="Dirección" value={cliente.direccion ?? ''} />
        <InfoField label="Localidad" value={cliente.localidad ?? ''} />
        <InfoField label="Provincia" value={cliente.provincia ?? ''} />
        <InfoField label="Email" value={cliente.email ?? ''} />
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Teléfono</p>
          <p className="text-sm">{cliente.telefono || '—'}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Celular</p>
          <div className="flex items-center gap-2">
            <p className="text-sm">{cliente.celular || '—'}</p>
            {whatsappNum && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={getWhatsAppUrl(whatsappNum)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="sr-only">Abrir WhatsApp</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-brand-brown">Historial de órdenes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenesCliente.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No hay órdenes de trabajo registradas.
                </TableCell>
              </TableRow>
            ) : ordenesCliente.map(orden => (
              <TableRow key={orden.id}>
                <TableCell className="font-medium">#{orden.numero}</TableCell>
                <TableCell>
                  {new Date(orden.createdAt._seconds * 1000).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell>{fmtFecha(orden.fechaPrometida)}</TableCell>
                <TableCell className="text-right">{formatMoney(orden.total)}</TableCell>
                <TableCell className="text-right">{formatMoney(orden.saldo)}</TableCell>
                <TableCell className={ESTADO_CLASS[orden.estado]}>{orden.estado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar cliente</SheetTitle>
            <SheetDescription>Modificá los datos del cliente.</SheetDescription>
          </SheetHeader>
          <ClienteForm
            key={cliente.id}
            cliente={cliente}
            onSuccess={() => setEditOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
