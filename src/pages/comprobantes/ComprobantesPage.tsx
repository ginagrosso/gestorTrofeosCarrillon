import { useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Plus, Printer, Trash2 } from 'lucide-react'
import {
  useComprobantes,
  useDeleteComprobante,
  NuevoComprobanteSheet,
  ComprobantePDFOverlay,
  ComprobantePDFCompleto,
} from '@/features/comprobantes'
import { useEmpresas } from '@/features/empresas'
import { comprobantesApi } from '@/shared/api/comprobantes.api'
import {
  TIPO_COMPROBANTE_VALUES,
  TIPO_COMPROBANTE_LABELS,
  type Comprobante,
  type ComprobanteConItems,
  type TipoComprobante,
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
import { Select } from '@/shared/ui/select'
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

const SEARCH_FIELDS: (keyof Comprobante)[] = ['clienteNombre', 'numero']

async function obtenerDetalle(id: string): Promise<ComprobanteConItems> {
  const res = await comprobantesApi.getById(id)
  return res.data
}

export default function ComprobantesPage() {
  const [tipoFiltro, setTipoFiltro] = useState<TipoComprobante | ''>('')
  const { data: comprobantes, isLoading } = useComprobantes(tipoFiltro ? { tipo: tipoFiltro } : undefined)
  const { data: empresas } = useEmpresas()
  const { mutate: deleteComprobante, isPending: isDeleting } = useDeleteComprobante()

  const [sheetOpen, setSheetOpen]       = useState(false)
  const [deletingItem, setDeletingItem] = useState<Comprobante | null>(null)

  const empresaNombrePorId = useMemo(
    () => new Map((empresas ?? []).map(e => [e.id, e.nombreFantasia])),
    [empresas],
  )

  const { search, setSearch, filteredItems } = useSearch(comprobantes ?? [], SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const handleImprimir = async (c: Comprobante) => {
    const detalle = await obtenerDetalle(c.id)

    let blob: Blob
    if (detalle.tipo === 'FACTURA_C' || detalle.tipo === 'REMITO') {
      blob = await pdf(<ComprobantePDFOverlay comprobante={detalle} />).toBlob()
    } else {
      const empresa = (empresas ?? []).find(e => e.id === detalle.empresaId)
      if (!empresa) {
        toast.error('No se encontró la empresa del comprobante')
        return
      }
      blob = await pdf(<ComprobantePDFCompleto comprobante={detalle} empresa={empresa} />).toBlob()
    }

    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    win?.addEventListener('load', () => {
      win.print()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Comprobantes</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus />
          Nuevo comprobante
        </Button>
      </header>

      <div className="flex gap-2">
        <div className="w-56">
          <Select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value as TipoComprobante | '')}>
            <option value="">Todos los tipos</option>
            {TIPO_COMPROBANTE_VALUES.map(tipo => (
              <option key={tipo} value={tipo}>{TIPO_COMPROBANTE_LABELS[tipo]}</option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente o número..." />
        </div>
      </div>

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
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-muted-foreground">{c.numero}</TableCell>
                <TableCell>{TIPO_COMPROBANTE_LABELS[c.tipo]}</TableCell>
                <TableCell>{formatFecha(c.fecha)}</TableCell>
                <TableCell>{empresaNombrePorId.get(c.empresaId) ?? '—'}</TableCell>
                <TableCell>{c.clienteNombre}</TableCell>
                <TableCell className="text-right">{formatMoney(c.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Imprimir" onClick={() => handleImprimir(c)}>
                      <Printer className="size-4" />
                      <span className="sr-only">Imprimir</span>
                    </Button>
                    <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setDeletingItem(c)}>
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

      <NuevoComprobanteSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => { if (!open) setDeletingItem(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comprobante?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el comprobante N°&nbsp;{deletingItem?.numero} de {deletingItem?.clienteNombre}.
              Esta acción solo puede revertirse desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingItem &&
                deleteComprobante(deletingItem.id, { onSuccess: () => setDeletingItem(null) })
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
