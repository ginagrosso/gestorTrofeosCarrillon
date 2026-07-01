import { useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Plus, Pencil, Trash2, Printer, Share2, ClipboardList } from 'lucide-react'
import { usePresupuestos, usePresupuesto, useDeletePresupuesto, PresupuestoFormSheet, PresupuestoPDF } from '@/features/presupuestos'
import { NuevaOrdenSheet } from '@/features/ordenes'
import { useProductos } from '@/features/productos'
import { presupuestosApi } from '@/shared/api/presupuestos.api'
import type { Presupuesto, Producto, PresupuestoConItems } from '@/shared/lib/types'
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

type PresupuestoRow = Presupuesto & { numeroStr: string }

const SEARCH_FIELDS: (keyof PresupuestoRow)[] = ['clienteNombre', 'clienteLocalidad', 'numeroStr']

async function generarBlob(detalle: PresupuestoConItems, productos: Producto[]): Promise<Blob> {
  return pdf(<PresupuestoPDF presupuesto={detalle} productos={productos} />).toBlob()
}

function nombreArchivo(p: Presupuesto): string {
  const cliente = p.clienteNombre.trim().replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ ]/g, '').replace(/\s+/g, '-')
  return `presupuesto-${cliente}.pdf`
}

async function obtenerDetalle(id: string): Promise<PresupuestoConItems> {
  const res = await presupuestosApi.getById(id)
  return res.data
}

export default function PresupuestosPage() {
  const { data: presupuestos, isLoading } = usePresupuestos()
  const { data: productos } = useProductos()
  const { mutate: deletePresupuesto, isPending: isDeleting } = useDeletePresupuesto()

  const [sheetOpen, setSheetOpen]           = useState(false)
  const [editingId, setEditingId]           = useState<string | null>(null)
  const [deletingItem, setDeletingItem]     = useState<Presupuesto | null>(null)
  const [otSheetOpen, setOtSheetOpen]       = useState(false)
  const [otPresupuesto, setOtPresupuesto]   = useState<PresupuestoConItems | null>(null)

  const { data: editingPresupuesto } = usePresupuesto(editingId)

  const rows = useMemo<PresupuestoRow[]>(
    () => (presupuestos ?? []).map(p => ({ ...p, numeroStr: String(p.numero) })),
    [presupuestos],
  )

  const { search, setSearch, filteredItems } = useSearch(rows, SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const handleEditar = (p: Presupuesto) => {
    setEditingId(p.id)
    setSheetOpen(true)
  }

  const handleNuevo = () => {
    setEditingId(null)
    setSheetOpen(true)
  }

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open)
    if (!open) setEditingId(null)
  }

  const handleConvertirOT = async (p: Presupuesto) => {
    const detalle = await obtenerDetalle(p.id)
    setOtPresupuesto(detalle)
    setOtSheetOpen(true)
  }

  const handleImprimir = async (p: Presupuesto) => {
    const detalle = await obtenerDetalle(p.id)
    const blob = await generarBlob(detalle, productos ?? [])

    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = nombreArchivo(p)
    a.click()
    URL.revokeObjectURL(downloadUrl)

    const printUrl = URL.createObjectURL(blob)
    const win = window.open(printUrl, '_blank')
    win?.addEventListener('load', () => {
      win.print()
      URL.revokeObjectURL(printUrl)
    })
  }

  const handleWhatsApp = async (p: Presupuesto) => {
    const detalle = await obtenerDetalle(p.id)
    const blob = await generarBlob(detalle, productos ?? [])
    const filename = nombreArchivo(p)
    const file = new File([blob], filename, { type: 'application/pdf' })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Presupuesto Trofeos Carrillon Siglo 21' })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      window.open(
        `https://web.whatsapp.com/send?text=${encodeURIComponent('Hola, te envío el presupuesto de Trofeos Carrillon Siglo 21.')}`,
        '_blank',
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Presupuestos</h1>
        <Button onClick={handleNuevo}>
          <Plus />
          Nuevo presupuesto
        </Button>
      </header>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por cliente, localidad o número..."
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
              <TableHead>Cliente</TableHead>
              <TableHead>Localidad</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-muted-foreground">{p.numero}</TableCell>
                <TableCell>{formatFecha(p.createdAt)}</TableCell>
                <TableCell>{p.clienteNombre}</TableCell>
                <TableCell>{p.clienteLocalidad || '—'}</TableCell>
                <TableCell className="text-right">{formatMoney(p.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Convertir en OT" onClick={() => handleConvertirOT(p)}>
                      <ClipboardList className="size-4" />
                      <span className="sr-only">Convertir en OT</span>
                    </Button>
                    <Button variant="ghost" size="icon" title="Compartir por WhatsApp" onClick={() => handleWhatsApp(p)}>
                      <Share2 className="size-4" />
                      <span className="sr-only">WhatsApp</span>
                    </Button>
                    <Button variant="ghost" size="icon" title="Imprimir PDF" onClick={() => handleImprimir(p)}>
                      <Printer className="size-4" />
                      <span className="sr-only">Imprimir</span>
                    </Button>
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEditar(p)}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setDeletingItem(p)}>
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
        open={otSheetOpen}
        onOpenChange={(open) => { if (!open) { setOtSheetOpen(false); setOtPresupuesto(null) } }}
        productos={productos ?? []}
        presupuesto={otPresupuesto ?? undefined}
      />

      <PresupuestoFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        presupuesto={editingId ? editingPresupuesto : undefined}
        productos={productos ?? []}
      />

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el presupuesto de {deletingItem?.clienteNombre}. Esta acción solo puede revertirse desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingItem &&
                deletePresupuesto(deletingItem.id, { onSuccess: () => setDeletingItem(null) })
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
