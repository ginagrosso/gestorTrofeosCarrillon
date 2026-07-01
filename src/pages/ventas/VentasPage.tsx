import { useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Plus, Printer, Pencil, Trash2, Receipt } from 'lucide-react'
import { ImportExportButtons } from '@/shared/ui/import-export-buttons'
import { ordenColumns } from '@/features/importar-exportar/lib/columns'
import {
  useOrdenes,
  useDeleteOrden,
  NuevaOrdenSheet,
  OrdenPDF,
  ActualizarPagoSheet,
} from '@/features/ordenes'
import { NuevoReciboSheet } from '@/features/recibos'
import { useProductos } from '@/features/productos'
import { ordenesApi } from '@/shared/api/ordenes.api'
import type { OrdenDeTrabajo, OrdenDeTrabajoConItems, Producto, EstadoOrden } from '@/shared/lib/types'
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

async function obtenerDetalle(id: string): Promise<OrdenDeTrabajoConItems> {
  const res = await ordenesApi.getById(id)
  return res.data
}

async function generarBlob(detalle: OrdenDeTrabajoConItems, productos: Producto[]): Promise<Blob> {
  return pdf(<OrdenPDF orden={detalle} productos={productos} />).toBlob()
}

export default function OrdenesPage() {
  const { data: ordenes, isLoading } = useOrdenes()
  const { data: productos } = useProductos()
  const { mutate: deleteOrden, isPending: isDeleting } = useDeleteOrden()

  const [sheetOpen, setSheetOpen]       = useState(false)
  const [deletingItem, setDeletingItem] = useState<OrdenDeTrabajo | null>(null)
  const [pagoOrden, setPagoOrden]       = useState<OrdenDeTrabajo | null>(null)
  const [reciboOrden, setReciboOrden]   = useState<OrdenDeTrabajo | null>(null)

  const rows = useMemo<OrdenRow[]>(
    () => (ordenes ?? []).map(o => ({ ...o, numeroStr: String(o.numero) })),
    [ordenes],
  )

  const { search, setSearch, filteredItems } = useSearch(rows, SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const handleImprimir = async (o: OrdenDeTrabajo) => {
    const detalle = await obtenerDetalle(o.id)
    const blob    = await generarBlob(detalle, productos ?? [])
    const url     = URL.createObjectURL(blob)
    const win     = window.open(url, '_blank')
    win?.addEventListener('load', () => {
      win.print()
      URL.revokeObjectURL(url)
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
                      onClick={() => setReciboOrden(o)}
                    >
                      <Receipt className="size-4" />
                      <span className="sr-only">Recibo por el total</span>
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
        onOpenChange={(open) => { if (!open) setReciboOrden(null) }}
        orden={reciboOrden}
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
