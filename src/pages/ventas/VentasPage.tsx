import { useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Plus, Printer, Pencil, Trash2, Receipt, FileText, Truck } from 'lucide-react'
import { ImportExportButtons } from '@/shared/ui/import-export-buttons'
import { ordenColumns } from '@/features/importar-exportar/lib/columns'
import {
  useOrdenes,
  useDeleteOrden,
  NuevaOrdenSheet,
  OrdenPDF,
  ActualizarPagoSheet,
} from '@/features/ordenes'
import { NuevoReciboSheet, type ReciboItem } from '@/features/recibos'
import {
  ComprobantePDFOverlay,
  ConfirmarComprobanteSheet,
  useCreateComprobante,
  type TipoComprobanteDesdeOrden,
  type ComprobanteOrigen,
  type ConfirmarComprobanteData,
} from '@/features/comprobantes'
import { useProductos } from '@/features/productos'
import { useClientes } from '@/features/clientes'
import { useEmpresas } from '@/features/empresas'
import { ordenesApi } from '@/shared/api/ordenes.api'
import {
  SIT_IVA_LABELS,
  type Cliente,
  type Empresa,
  type OrdenDeTrabajo,
  type OrdenDeTrabajoConItems,
  type Producto,
  type EstadoOrden,
  type ComprobanteItemInput,
  type ComprobanteConItems,
  type InsertComprobante,
} from '@/shared/lib/types'
import { formatFecha } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'
import { usePagination } from '@/shared/hooks/usePagination'
import { useSearch } from '@/shared/hooks/useSearch'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Pagination } from '@/shared/ui/pagination'
import { SearchInput } from '@/shared/ui/search-input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'

type OrdenRow = OrdenDeTrabajo & { numeroStr: string }

const SEARCH_FIELDS: (keyof OrdenRow)[] = ['clienteNombre', 'numeroStr']

const ESTADO_CLASS: Record<EstadoOrden, string> = {
  PENDIENTE: 'text-muted-foreground',
  PARCIAL:   'text-yellow-600 font-medium',
  PAGADO:    'text-green-600 font-medium',
}

const TIPO_COMPROBANTE_LABEL: Record<TipoComprobanteDesdeOrden, string> = {
  FACTURA_C: 'la factura',
  REMITO:    'el remito',
}

async function obtenerDetalle(id: string): Promise<OrdenDeTrabajoConItems> {
  const res = await ordenesApi.getById(id)
  return res.data
}

async function generarBlob(detalle: OrdenDeTrabajoConItems, productos: Producto[], empresa: Empresa): Promise<Blob> {
  return pdf(<OrdenPDF orden={detalle} productos={productos} empresa={empresa} />).toBlob()
}

async function imprimirComprobante(comprobante: ComprobanteConItems): Promise<void> {
  const blob = await pdf(<ComprobantePDFOverlay comprobante={comprobante} />).toBlob()
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  win?.addEventListener('load', () => {
    win.print()
    URL.revokeObjectURL(url)
  })
}

function construirItemsDesdeOrden(orden: OrdenDeTrabajoConItems, productos: Producto[]): ComprobanteItemInput[] {
  const productoPorId = new Map(productos.map(p => [p.id, p]))
  return orden.items.map(item => {
    const producto = productoPorId.get(item.productoId)
    return {
      codigo:         producto?.codigo,
      descripcion:    producto ? producto.descripcion : item.productoId,
      cantidad:       item.cantidad,
      precioUnitario: item.precioUnitario,
      bonificacion:   0,
    }
  })
}

function construirItemsReciboDesdeOrden(orden: OrdenDeTrabajoConItems, productos: Producto[]): ReciboItem[] {
  const productoPorId = new Map(productos.map(p => [p.id, p]))
  return orden.items.map(item => {
    const producto = productoPorId.get(item.productoId)
    return {
      descripcion:    producto ? producto.descripcion : item.productoId,
      cantidad:       item.cantidad,
      precioUnitario: item.precioUnitario,
    }
  })
}

interface ComprobanteContext extends ComprobanteOrigen {
  empresaId:  string
  ordenId:    string
  clienteId?: string
}

// Si la OT está vinculada a un cliente registrado, usamos sus datos completos y
// actuales (dirección, sit. IVA) — la OT en sí no guarda esos dos campos.
function construirContextoDesdeOrden(
  orden: OrdenDeTrabajoConItems,
  productos: Producto[],
  clientes: Cliente[],
): ComprobanteContext {
  const cliente = orden.clienteId ? clientes.find(c => c.id === orden.clienteId) : undefined
  return {
    empresaId:        orden.empresaId!,
    ordenId:          orden.id,
    clienteId:        orden.clienteId ?? undefined,
    clienteNombre:    orden.clienteNombre,
    clienteDireccion: cliente?.direccion ?? undefined,
    clienteLocalidad: cliente?.localidad ?? orden.clienteLocalidad ?? undefined,
    clienteCuit:      cliente?.cuit ?? orden.clienteCuit ?? undefined,
    clienteSitIva:    cliente ? SIT_IVA_LABELS[cliente.situacionFiscal] : undefined,
    condVenta:        orden.condVenta,
    items:            construirItemsDesdeOrden(orden, productos),
  }
}

export default function OrdenesPage() {
  const { data: ordenes, isLoading } = useOrdenes()
  const { data: productos } = useProductos()
  const { data: clientes } = useClientes()
  const { data: empresas } = useEmpresas()
  const { mutate: deleteOrden, isPending: isDeleting } = useDeleteOrden()
  const { mutate: createComprobante, isPending: isGenerandoComprobante } = useCreateComprobante()

  const [sheetOpen, setSheetOpen]       = useState(false)
  const [deletingItem, setDeletingItem] = useState<OrdenDeTrabajo | null>(null)
  const [pagoOrden, setPagoOrden]       = useState<OrdenDeTrabajo | null>(null)
  const [reciboOrden, setReciboOrden]   = useState<OrdenDeTrabajo | null>(null)
  const [reciboItems, setReciboItems]   = useState<ReciboItem[]>([])
  const [comprobanteSheetOpen, setComprobanteSheetOpen] = useState(false)
  const [comprobanteTipo, setComprobanteTipo] = useState<TipoComprobanteDesdeOrden>('FACTURA_C')
  const [comprobanteContext, setComprobanteContext] = useState<ComprobanteContext | null>(null)

  const empresaNombrePorId = useMemo(
    () => new Map((empresas ?? []).map(e => [e.id, e.nombreFantasia])),
    [empresas],
  )

  const rows = useMemo<OrdenRow[]>(
    () => (ordenes ?? []).map(o => ({ ...o, numeroStr: String(o.numero) })),
    [ordenes],
  )

  const { search, setSearch, filteredItems } = useSearch(rows, SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const handleImprimir = async (o: OrdenDeTrabajo) => {
    const detalle = await obtenerDetalle(o.id)
    const empresa = (empresas ?? []).find(e => e.id === detalle.empresaId)
    if (!empresa) {
      toast.error('No se encontró la empresa de la orden')
      return
    }
    const blob = await generarBlob(detalle, productos ?? [], empresa)
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    win?.addEventListener('load', () => {
      win.print()
      URL.revokeObjectURL(url)
    })
  }

  const handleClickRecibo = async (o: OrdenDeTrabajo) => {
    const detalle = await obtenerDetalle(o.id)
    setReciboItems(construirItemsReciboDesdeOrden(detalle, productos ?? []))
    setReciboOrden(o)
  }

  const handleClickComprobante = async (o: OrdenDeTrabajo, tipo: TipoComprobanteDesdeOrden) => {
    if (!o.empresaId) {
      toast.error(`Esta orden no tiene una empresa asignada (es de antes de este cambio) — no se puede generar ${TIPO_COMPROBANTE_LABEL[tipo]}.`)
      return
    }
    const detalle = await obtenerDetalle(o.id)
    setComprobanteContext(construirContextoDesdeOrden(detalle, productos ?? [], clientes ?? []))
    setComprobanteTipo(tipo)
    setComprobanteSheetOpen(true)
  }

  const handleConfirmarComprobante = (data: ConfirmarComprobanteData) => {
    if (!comprobanteContext) return
    const payload: InsertComprobante = {
      tipo:             comprobanteTipo,
      empresaId:        comprobanteContext.empresaId,
      ordenId:          comprobanteContext.ordenId,
      clienteId:        comprobanteContext.clienteId,
      clienteNombre:    data.clienteNombre,
      clienteDireccion: data.clienteDireccion,
      clienteLocalidad: data.clienteLocalidad,
      clienteCuit:      data.clienteCuit,
      clienteSitIva:    data.clienteSitIva,
      condVenta:        data.condVenta,
      items:            comprobanteContext.items,
    }

    createComprobante(payload, {
      onSuccess: async ({ data: comprobante }) => {
        setComprobanteSheetOpen(false)
        setComprobanteContext(null)
        await imprimirComprobante(comprobante)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Órdenes de Trabajo</h1>
        <div className="flex gap-2">
          <ImportExportButtons
            columns={ordenColumns}
            data={ordenes ?? []}
            filename="ordenes-de-trabajo.xlsx"
          />
          <Button onClick={() => setSheetOpen(true)}>
            <Plus />
            Nueva orden
          </Button>
        </div>
      </header>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por cliente o número de OT..."
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Prometida</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-muted-foreground">{o.numero}</TableCell>
                <TableCell>{formatFecha(o.createdAt)}</TableCell>
                <TableCell>{/^\d{4}-\d{2}-\d{2}$/.test(o.fechaPrometida) ? o.fechaPrometida.split('-').reverse().join('/') : o.fechaPrometida}</TableCell>
                <TableCell>{empresaNombrePorId.get(o.empresaId ?? '') ?? '—'}</TableCell>
                <TableCell>{o.clienteNombre}</TableCell>
                <TableCell className="text-right">{formatMoney(o.total)}</TableCell>
                <TableCell className="text-right">{formatMoney(o.saldo)}</TableCell>
                <TableCell>
                  <span className={ESTADO_CLASS[o.estado]}>{o.estado}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Imprimir orden"
                      onClick={() => handleImprimir(o)}
                    >
                      <Printer className="size-4" />
                      <span className="sr-only">Imprimir orden</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Recibo por el total"
                      onClick={() => handleClickRecibo(o)}
                    >
                      <Receipt className="size-4" />
                      <span className="sr-only">Recibo por el total</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Factura C"
                      onClick={() => handleClickComprobante(o, 'FACTURA_C')}
                    >
                      <FileText className="size-4" />
                      <span className="sr-only">Factura C</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remito"
                      onClick={() => handleClickComprobante(o, 'REMITO')}
                    >
                      <Truck className="size-4" />
                      <span className="sr-only">Remito</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Registrar pago"
                      onClick={() => setPagoOrden(o)}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Actualizar pago</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Eliminar"
                      onClick={() => setDeletingItem(o)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      <NuevaOrdenSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        productos={productos ?? []}
      />

      <ActualizarPagoSheet
        open={!!pagoOrden}
        onOpenChange={(open) => { if (!open) setPagoOrden(null) }}
        orden={pagoOrden}
      />

      <NuevoReciboSheet
        open={!!reciboOrden}
        onOpenChange={(open) => { if (!open) { setReciboOrden(null); setReciboItems([]) } }}
        orden={reciboOrden}
        items={reciboItems}
      />

      <ConfirmarComprobanteSheet
        open={comprobanteSheetOpen}
        onOpenChange={(open) => { setComprobanteSheetOpen(open); if (!open) setComprobanteContext(null) }}
        tipo={comprobanteTipo}
        origen={comprobanteContext}
        onConfirm={handleConfirmarComprobante}
        isPending={isGenerandoComprobante}
      />

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => { if (!open) setDeletingItem(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden de trabajo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la orden N°&nbsp;{deletingItem?.numero} de {deletingItem?.clienteNombre} y se
              revertirá el stock de los productos. Esta acción solo puede revertirse desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingItem &&
                deleteOrden(deletingItem.id, { onSuccess: () => setDeletingItem(null) })
              }
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
