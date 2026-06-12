import { useMemo } from 'react'
import { useProductos } from '@/features/productos'
import { useProveedores } from '@/features/proveedores'
import { useImportarProductos, productoColumns, type ProductoExport } from '@/features/importar-exportar'
import type { Producto } from '@/shared/lib/types'
import { usePagination } from '@/shared/hooks/usePagination'
import { useSearch } from '@/shared/hooks/useSearch'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Pagination } from '@/shared/ui/pagination'
import { SearchInput } from '@/shared/ui/search-input'
import { ImportExportButtons } from '@/shared/ui/import-export-buttons'

const PRODUCTO_SEARCH_FIELDS: (keyof Producto)[] = ['codigo', 'descripcion', 'categoria', 'subcategoria']

export default function ProductosPage() {
  const { data: productos, isLoading } = useProductos()
  const { data: proveedores } = useProveedores()
  const importarProductos = useImportarProductos()
  const { search, setSearch, filteredItems } = useSearch(productos ?? [], PRODUCTO_SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const nombreProveedorPorId = useMemo(
    () => new Map((proveedores ?? []).map(p => [p.id, p.nombre])),
    [proveedores],
  )

  const productosExport = useMemo<ProductoExport[]>(
    () => (productos ?? []).map(p => ({ ...p, proveedorNombre: nombreProveedorPorId.get(p.proveedorId) ?? '' })),
    [productos, nombreProveedorPorId],
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Productos</h1>
        <ImportExportButtons
          columns={productoColumns}
          data={productosExport}
          filename="productos.xlsx"
          importMutation={importarProductos}
        />
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
              <TableHead>Proveedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell className="font-medium">{producto.codigo}</TableCell>
                <TableCell>{producto.descripcion}</TableCell>
                <TableCell>{producto.categoria || '—'}</TableCell>
                <TableCell>{producto.subcategoria || '—'}</TableCell>
                <TableCell className="text-right">{producto.precioCosto}</TableCell>
                <TableCell className="text-right">{producto.precioVenta}</TableCell>
                <TableCell className="text-right">{producto.stockActual}</TableCell>
                <TableCell>{nombreProveedorPorId.get(producto.proveedorId) || '—'}</TableCell>
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
    </div>
  )
}
