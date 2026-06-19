import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useProductos, useDeleteProducto, ProductoForm, useAllProductoArticulos } from '@/features/productos'
import { useImportarProductos, productoColumns, type ProductoExport } from '@/features/importar-exportar'
import type { Producto } from '@/shared/lib/types'
import { formatMoney } from '@/shared/lib/money'
import { usePagination } from '@/shared/hooks/usePagination'
import { useSearch } from '@/shared/hooks/useSearch'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Pagination } from '@/shared/ui/pagination'
import { SearchInput } from '@/shared/ui/search-input'
import { ImportExportButtons } from '@/shared/ui/import-export-buttons'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
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

const PRODUCTO_SEARCH_FIELDS: (keyof Producto)[] = ['codigo', 'descripcion', 'categoria', 'subcategoria']

export default function ProductosPage() {
  const { data: productos, isLoading } = useProductos()
  const { data: bomAll } = useAllProductoArticulos()
  const { mutate: deleteProducto, isPending: isDeleting } = useDeleteProducto()
  const importarProductos = useImportarProductos()
  const { search, setSearch, filteredItems } = useSearch(productos ?? [], PRODUCTO_SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | undefined>(undefined)
  const [deletingProducto, setDeletingProducto] = useState<Producto | null>(null)

  const materialesPorProducto = useMemo(() => {
    const mapa = new Map<string, string[]>()
    for (const item of bomAll ?? []) {
      const texto = item.articulo ? `${item.articulo.codigo} x${item.cantidad}` : `? x${item.cantidad}`
      mapa.set(item.productoId, [...(mapa.get(item.productoId) ?? []), texto])
    }
    return mapa
  }, [bomAll])

  const productosExport = useMemo<ProductoExport[]>(
    () => (productos ?? []).map(p => ({
      ...p,
      materiales: (materialesPorProducto.get(p.id) ?? []).join(', '),
    })),
    [productos, materialesPorProducto],
  )

  const handleNew = () => {
    setEditingProducto(undefined)
    setSheetOpen(true)
  }

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto)
    setSheetOpen(true)
  }

  const handleFormSuccess = (createdProducto?: Producto) => {
    if (createdProducto) {
      setEditingProducto(createdProducto)
      return
    }
    setSheetOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Productos</h1>
        <div className="flex items-center gap-2">
          <ImportExportButtons
            columns={productoColumns}
            data={productosExport}
            filename="productos.xlsx"
            importMutation={importarProductos}
          />
          <Button onClick={handleNew}>
            <Plus />
            Nuevo producto
          </Button>
        </div>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto..." />

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
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Subcategoría</TableHead>
              <TableHead className="text-right">Precio Costo</TableHead>
              <TableHead className="text-right">Precio Venta</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell className="font-medium">{producto.codigo}</TableCell>
                <TableCell>{producto.descripcion}</TableCell>
                <TableCell>{producto.categoria || '—'}</TableCell>
                <TableCell>{producto.subcategoria || '—'}</TableCell>
                <TableCell className="text-right">{formatMoney(producto.precioCosto)}</TableCell>
                <TableCell className="text-right">{formatMoney(producto.precioVenta)}</TableCell>
                <TableCell className="text-right">{producto.stockActual}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(producto)}>
                      <Pencil />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingProducto(producto)}>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingProducto ? 'Editar producto' : 'Nuevo producto'}</SheetTitle>
            <SheetDescription>
              {editingProducto
                ? 'Modificá los datos del producto.'
                : 'Completá los datos para crear un nuevo producto.'}
            </SheetDescription>
          </SheetHeader>
          <ProductoForm
            key={editingProducto?.id ?? 'new'}
            producto={editingProducto}
            onSuccess={handleFormSuccess}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingProducto} onOpenChange={(open) => !open && setDeletingProducto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{deletingProducto?.descripcion}". Esta acción puede revertirse solo desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProducto && deleteProducto(deletingProducto.id)}
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
