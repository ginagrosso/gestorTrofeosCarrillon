import { useMemo, useState } from 'react'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { useCompras, useDeleteCompra, NuevaCompraSheet } from '@/features/compras'
import { useProveedores } from '@/features/proveedores'
import { useArticulos } from '@/features/articulos'
import type { Compra } from '@/shared/lib/types'
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/shared/ui/alert-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
import { useQuery } from '@tanstack/react-query'
import { comprasApi } from '@/shared/api/compras.api'

// Tipo enriquecido para búsqueda: agrega nombre del proveedor
interface CompraConProveedor extends Compra {
  proveedorNombre: string
}

const COMPRA_SEARCH_FIELDS: (keyof CompraConProveedor)[] = ['proveedorNombre', 'nroComprobante']

export default function ComprasPage() {
  const { data: compras, isLoading } = useCompras()
  const { data: proveedores } = useProveedores()
  const { data: articulos } = useArticulos()
  const { mutate: deleteCompra, isPending: isDeleting } = useDeleteCompra()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [deletingCompra, setDeletingCompra] = useState<Compra | null>(null)
  const [viewingCompraId, setViewingCompraId] = useState<string | null>(null)

  const nombreProveedorPorId = useMemo(
    () => new Map((proveedores ?? []).map(p => [p.id, p.nombre])),
    [proveedores],
  )

  const articuloPorId = useMemo(
    () => new Map((articulos ?? []).map(a => [a.id, a])),
    [articulos],
  )

  const comprasConProveedor = useMemo<CompraConProveedor[]>(
    () => (compras ?? []).map(c => ({
      ...c,
      proveedorNombre: nombreProveedorPorId.get(c.proveedorId) ?? '',
    })),
    [compras, nombreProveedorPorId],
  )

  const { search, setSearch, filteredItems } = useSearch(comprasConProveedor, COMPRA_SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const { data: detalleData } = useQuery({
    queryKey: ['compras', viewingCompraId],
    queryFn:  () => comprasApi.getById(viewingCompraId!),
    enabled:  !!viewingCompraId,
    select:   res => res.data,
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Compras</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus />
          Nueva compra
        </Button>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por proveedor o N° comprobante..." />

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
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>N° Comprobante</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((compra) => (
              <TableRow key={compra.id}>
                <TableCell>{formatFecha(compra.createdAt)}</TableCell>
                <TableCell>{compra.proveedorNombre || '—'}</TableCell>
                <TableCell>{compra.nroComprobante || '—'}</TableCell>
                <TableCell className="text-right">{formatMoney(compra.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setViewingCompraId(compra.id)}>
                      <Eye />
                      <span className="sr-only">Ver detalle</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingCompra(compra)}>
                      <Trash2 />
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

      <NuevaCompraSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      {/* Detalle de compra */}
      <Sheet open={!!viewingCompraId} onOpenChange={(open) => !open && setViewingCompraId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle de compra</SheetTitle>
            <SheetDescription>
              {detalleData && (
                <>
                  {nombreProveedorPorId.get(detalleData.proveedorId) ?? detalleData.proveedorId}
                  {detalleData.nroComprobante ? ` — ${detalleData.nroComprobante}` : ''}
                </>
              )}
            </SheetDescription>
          </SheetHeader>
          {detalleData && (
            <div className="mt-4 flex flex-col gap-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">P. Unitario</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalleData.items.map((item) => {
                    const art = articuloPorId.get(item.articuloId)
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {art ? `${art.codigo} — ${art.descripcion}` : item.articuloId}
                        </TableCell>
                        <TableCell className="text-right">{item.cantidad}</TableCell>
                        <TableCell className="text-right">{formatMoney(item.precioUnitario)}</TableCell>
                        <TableCell className="text-right">{formatMoney(item.cantidad * item.precioUnitario)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span>{formatMoney(detalleData.total)}</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingCompra} onOpenChange={(open) => !open && setDeletingCompra(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la compra y se revertirá el stock de todos sus artículos. Esta acción solo puede revertirse desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCompra && deleteCompra(deletingCompra.id, { onSuccess: () => setDeletingCompra(null) })}
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
