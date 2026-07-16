import { useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Plus, Printer, Trash2, ChevronDown, FileText, Receipt } from 'lucide-react'
import {
  useComprobantes,
  useDeleteComprobante,
  NuevoComprobanteSheet,
  ComprobantePDFOverlay,
  ComprobantePDFCompleto,
} from '@/features/comprobantes'
import { NuevoReciboSheet, ReciboPDF, useRecibos, useDeleteRecibo } from '@/features/recibos'
import { useEmpresas } from '@/features/empresas'
import { comprobantesApi } from '@/shared/api/comprobantes.api'
import {
  TIPO_COMPROBANTE_VALUES,
  TIPO_COMPROBANTE_LABELS,
  FORMA_PAGO_LABELS,
  type Comprobante,
  type ComprobanteConItems,
  type TipoComprobante,
  type Recibo,
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
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover'
import { cn } from '@/shared/lib/utils'
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
const RECIBO_SEARCH_FIELDS: (keyof Recibo)[] = ['clienteNombre', 'numero']

async function obtenerDetalle(id: string): Promise<ComprobanteConItems> {
  const res = await comprobantesApi.getById(id)
  return res.data
}

async function imprimirRecibo(recibo: Recibo) {
  const blob = await pdf(<ReciboPDF recibo={recibo} />).toBlob()
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  win?.addEventListener('load', () => {
    win.print()
    URL.revokeObjectURL(url)
  })
}

export default function ComprobantesPage() {
  const [tab, setTab] = useState<'comprobantes' | 'recibos'>('comprobantes')

  const [tipoFiltro, setTipoFiltro] = useState<TipoComprobante | ''>('')
  const { data: comprobantes, isLoading } = useComprobantes(tipoFiltro ? { tipo: tipoFiltro } : undefined)
  const { data: recibos, isLoading: isLoadingRecibos } = useRecibos()
  const { data: empresas } = useEmpresas()
  const { mutate: deleteComprobante, isPending: isDeleting } = useDeleteComprobante()
  const { mutate: deleteRecibo, isPending: isDeletingRecibo } = useDeleteRecibo()

  const [sheetOpen, setSheetOpen]       = useState(false)
  const [reciboSheetOpen, setReciboSheetOpen] = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [deletingItem, setDeletingItem] = useState<Comprobante | null>(null)
  const [deletingRecibo, setDeletingRecibo] = useState<Recibo | null>(null)

  const empresaNombrePorId = useMemo(
    () => new Map((empresas ?? []).map(e => [e.id, e.nombreFantasia])),
    [empresas],
  )

  const { search, setSearch, filteredItems } = useSearch(comprobantes ?? [], SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const {
    search: searchRecibos, setSearch: setSearchRecibos, filteredItems: filteredRecibos,
  } = useSearch(recibos ?? [], RECIBO_SEARCH_FIELDS)
  const {
    page: pageRecibos, totalPages: totalPagesRecibos, totalItems: totalItemsRecibos,
    pageSize: pageSizeRecibos, paginatedItems: paginatedRecibos, setPage: setPageRecibos,
  } = usePagination(filteredRecibos)

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
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button>
              <Plus />
              Agregar
              <ChevronDown className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => { setMenuOpen(false); setSheetOpen(true) }}
            >
              <FileText className="size-4" />
              Comprobante
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => { setMenuOpen(false); setReciboSheetOpen(true) }}
            >
              <Receipt className="size-4" />
              Recibo
            </button>
          </PopoverContent>
        </Popover>
      </header>

      <div className="flex gap-1 border-b">
        <button
          type="button"
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px',
            tab === 'comprobantes' ? 'border-brand-brown text-brand-brown' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setTab('comprobantes')}
        >
          Comprobantes
        </button>
        <button
          type="button"
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px',
            tab === 'recibos' ? 'border-brand-brown text-brand-brown' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setTab('recibos')}
        >
          Recibos
        </button>
      </div>

      {tab === 'comprobantes' && (
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
      )}

      {tab === 'recibos' && (
        <SearchInput value={searchRecibos} onChange={setSearchRecibos} placeholder="Buscar por cliente o número..." />
      )}

      {tab === 'comprobantes' && (isLoading ? (
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
      ))}

      {tab === 'comprobantes' && !isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      {tab === 'recibos' && (isLoadingRecibos ? (
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
              <TableHead>Forma de pago</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecibos.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-muted-foreground">{r.numero}</TableCell>
                <TableCell>{formatFecha(r.fecha)}</TableCell>
                <TableCell>{r.clienteNombre || '—'}</TableCell>
                <TableCell>{FORMA_PAGO_LABELS[r.formaPago]}</TableCell>
                <TableCell className="text-right">{formatMoney(r.monto)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Imprimir" onClick={() => imprimirRecibo(r)}>
                      <Printer className="size-4" />
                      <span className="sr-only">Imprimir</span>
                    </Button>
                    <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setDeletingRecibo(r)}>
                      <Trash2 className="size-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ))}

      {tab === 'recibos' && !isLoadingRecibos && (
        <Pagination
          page={pageRecibos}
          totalPages={totalPagesRecibos}
          totalItems={totalItemsRecibos}
          pageSize={pageSizeRecibos}
          onPageChange={setPageRecibos}
        />
      )}

      <NuevoComprobanteSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <NuevoReciboSheet open={reciboSheetOpen} onOpenChange={setReciboSheetOpen} orden={null} items={[]} />

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

      <AlertDialog open={!!deletingRecibo} onOpenChange={(open) => { if (!open) setDeletingRecibo(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recibo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el recibo N°&nbsp;{deletingRecibo?.numero}
              {deletingRecibo?.clienteNombre ? ` de ${deletingRecibo.clienteNombre}` : ''}.
              Esta acción solo puede revertirse desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingRecibo &&
                deleteRecibo(deletingRecibo.id, { onSuccess: () => setDeletingRecibo(null) })
              }
              disabled={isDeletingRecibo}
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
