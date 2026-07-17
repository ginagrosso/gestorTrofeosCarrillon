import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react'
import { useArticulos, useDeleteArticulo, ArticuloForm, ActualizarPreciosForm } from '@/features/articulos'
import { useProveedores } from '@/features/proveedores'
import { useImportarArticulos, articuloColumns, type ArticuloExport } from '@/features/importar-exportar'
import type { Articulo } from '@/shared/lib/types'
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

const ARTICULO_SEARCH_FIELDS: (keyof Articulo)[] = ['codigo', 'descripcion', 'categoria', 'subcategoria']

export default function ArticulosPage() {
  const { data: articulos, isLoading } = useArticulos()
  const { data: proveedores } = useProveedores()
  const { mutate: deleteArticulo, isPending: isDeleting } = useDeleteArticulo()
  const importarArticulos = useImportarArticulos()

  const [proveedorFiltro, setProveedorFiltro] = useState('')

  const articulosDelProveedor = useMemo(
    () => (articulos ?? []).filter(a => !proveedorFiltro || a.proveedorId === proveedorFiltro),
    [articulos, proveedorFiltro],
  )

  const { search, setSearch, filteredItems } = useSearch(articulosDelProveedor, ARTICULO_SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingArticulo, setEditingArticulo] = useState<Articulo | undefined>(undefined)
  const [deletingArticulo, setDeletingArticulo] = useState<Articulo | null>(null)
  const [precioSheetOpen, setPrecioSheetOpen] = useState(false)

  const nombreProveedorPorId = useMemo(
    () => new Map((proveedores ?? []).map(p => [p.id, p.nombre])),
    [proveedores],
  )

  const articulosExport = useMemo<ArticuloExport[]>(
    () => (articulos ?? []).map(a => ({ ...a, proveedorNombre: nombreProveedorPorId.get(a.proveedorId) ?? '' })),
    [articulos, nombreProveedorPorId],
  )

  const handleNew = () => {
    setEditingArticulo(undefined)
    setSheetOpen(true)
  }

  const handleEdit = (articulo: Articulo) => {
    setEditingArticulo(articulo)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Artículos</h1>
        <div className="flex items-center gap-2">
          <ImportExportButtons
            columns={articuloColumns}
            data={articulosExport}
            filename="articulos.xlsx"
            importMutation={importarArticulos}
          />
          <Button variant="outline" onClick={() => setPrecioSheetOpen(true)}>
            <DollarSign />
            Actualizar precios
          </Button>
          <Button onClick={handleNew}>
            <Plus />
            Nuevo artículo
          </Button>
        </div>
      </header>

      <div className="flex gap-2">
        <div className="w-64">
          <Select value={proveedorFiltro} onChange={e => setProveedorFiltro(e.target.value)}>
            <option value="">Todos los proveedores</option>
            {(proveedores ?? []).map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar artículo..." />
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
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Subcategoría</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="text-right">Precio Costo</TableHead>
              <TableHead>Última actualización</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((articulo) => (
              <TableRow key={articulo.id}>
                <TableCell className="font-medium">{articulo.codigo}</TableCell>
                <TableCell>{articulo.descripcion}</TableCell>
                <TableCell>{articulo.categoria || '—'}</TableCell>
                <TableCell>{articulo.subcategoria || '—'}</TableCell>
                <TableCell>{nombreProveedorPorId.get(articulo.proveedorId) || '—'}</TableCell>
                <TableCell className="text-right">{formatMoney(articulo.precioCosto)}</TableCell>
                <TableCell>{formatFecha(articulo.precioActualizadoAt)}</TableCell>
                <TableCell className="text-right">{articulo.stock}</TableCell>
                <TableCell>{articulo.unidad}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(articulo)}>
                      <Pencil />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingArticulo(articulo)}>
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingArticulo ? 'Editar artículo' : 'Nuevo artículo'}</SheetTitle>
            <SheetDescription>
              {editingArticulo
                ? 'Modificá los datos del artículo.'
                : 'Completá los datos para crear un nuevo artículo.'}
            </SheetDescription>
          </SheetHeader>
          <ArticuloForm
            key={editingArticulo?.id ?? 'new'}
            articulo={editingArticulo}
            onSuccess={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={precioSheetOpen} onOpenChange={setPrecioSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Actualizar precios por proveedor</SheetTitle>
            <SheetDescription>
              Aplicá un % de aumento o descuento al precio de costo de todos los artículos de un proveedor.
            </SheetDescription>
          </SheetHeader>
          <ActualizarPreciosForm onSuccess={() => setPrecioSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingArticulo} onOpenChange={(open) => !open && setDeletingArticulo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{deletingArticulo?.descripcion}". Esta acción puede revertirse solo desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingArticulo && deleteArticulo(deletingArticulo.id)}
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
