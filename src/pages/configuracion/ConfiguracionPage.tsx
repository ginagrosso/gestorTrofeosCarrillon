import { useState } from 'react'
import { Plus, Pencil, Trash2, Power } from 'lucide-react'
import { useEmpresas, useDeleteEmpresa, useUpdateEmpresa, EmpresaForm } from '@/features/empresas'
import type { Empresa } from '@/shared/lib/types'
import { usePagination } from '@/shared/hooks/usePagination'
import { useSearch } from '@/shared/hooks/useSearch'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Pagination } from '@/shared/ui/pagination'
import { SearchInput } from '@/shared/ui/search-input'
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

const SEARCH_FIELDS: (keyof Empresa)[] = ['nombreFantasia', 'razonSocial']

export default function ConfiguracionPage() {
  const { data: empresas, isLoading } = useEmpresas()
  const { mutate: deleteEmpresa, isPending: isDeleting } = useDeleteEmpresa()
  const { mutate: updateEmpresa } = useUpdateEmpresa()

  const { search, setSearch, filteredItems } = useSearch(empresas ?? [], SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const [sheetOpen, setSheetOpen]           = useState(false)
  const [editingEmpresa, setEditingEmpresa]  = useState<Empresa | undefined>(undefined)
  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null)

  const handleNew = () => {
    setEditingEmpresa(undefined)
    setSheetOpen(true)
  }

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa)
    setSheetOpen(true)
  }

  const handleToggleActiva = (empresa: Empresa) => {
    updateEmpresa({ id: empresa.id, data: { activa: !empresa.activa } })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Configuración — Empresas</h1>
        <Button onClick={handleNew}>
          <Plus />
          Nueva empresa
        </Button>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar empresa..." />

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
              <TableHead>Nombre de fantasía</TableHead>
              <TableHead>Razón social</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Condición IVA</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map(empresa => (
              <TableRow key={empresa.id}>
                <TableCell className="font-medium">{empresa.nombreFantasia}</TableCell>
                <TableCell>{empresa.razonSocial}</TableCell>
                <TableCell>{empresa.cuit}</TableCell>
                <TableCell>{empresa.condIva}</TableCell>
                <TableCell>
                  <span className={[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    empresa.activa
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600',
                  ].join(' ')}>
                    {empresa.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(empresa)} title="Editar">
                      <Pencil />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActiva(empresa)}
                      title={empresa.activa ? 'Desactivar' : 'Activar'}
                    >
                      <Power />
                      <span className="sr-only">{empresa.activa ? 'Desactivar' : 'Activar'}</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingEmpresa(empresa)}>
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
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingEmpresa ? 'Editar empresa' : 'Nueva empresa'}</SheetTitle>
            <SheetDescription>
              {editingEmpresa
                ? 'Modificá los datos de la empresa.'
                : 'Completá los datos para registrar una nueva empresa.'}
            </SheetDescription>
          </SheetHeader>
          <EmpresaForm
            key={editingEmpresa?.id ?? 'new'}
            empresa={editingEmpresa}
            onSuccess={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingEmpresa} onOpenChange={open => !open && setDeletingEmpresa(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{deletingEmpresa?.nombreFantasia}". Esta acción puede revertirse solo desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEmpresa && deleteEmpresa(deletingEmpresa.id)}
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
