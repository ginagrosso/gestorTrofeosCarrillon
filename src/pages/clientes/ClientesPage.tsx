import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, MessageCircle } from 'lucide-react'
import { useClientes, useDeleteCliente, ClienteForm } from '@/features/clientes'
import { useImportarClientes, clienteColumns } from '@/features/importar-exportar'
import { SIT_IVA_LABELS, TIPO_DOC_LABELS, type Cliente } from '@/shared/lib/types'
import { getContactos } from '@/shared/lib/contactos'
import { getWhatsAppUrl } from '@/shared/lib/whatsapp'
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

const CLIENTE_SEARCH_FIELDS: (keyof Cliente)[] = [
  'nombre', 'cuit', 'email',
  'contacto1', 'telefono1', 'contacto2', 'telefono2', 'contacto3', 'telefono3',
]

export default function ClientesPage() {
  const { data: clientes, isLoading } = useClientes()
  const { mutate: deleteCliente, isPending: isDeleting } = useDeleteCliente()
  const importarClientes = useImportarClientes()
  const { search, setSearch, filteredItems } = useSearch(clientes ?? [], CLIENTE_SEARCH_FIELDS)
  const { page, totalPages, totalItems, pageSize, paginatedItems, setPage } = usePagination(filteredItems)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | undefined>(undefined)
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null)

  const handleNew = () => {
    setEditingCliente(undefined)
    setSheetOpen(true)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-brown">Clientes</h1>
        <div className="flex items-center gap-2">
          <ImportExportButtons
            columns={clienteColumns}
            data={clientes ?? []}
            filename="clientes.xlsx"
            importMutation={importarClientes}
          />
          <Button onClick={handleNew}>
            <Plus />
            Nuevo cliente
          </Button>
        </div>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente..." />

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
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Situación IVA</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Localidad</TableHead>
              <TableHead>Provincia</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contactos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">
                  <Link to={`/clientes/${cliente.id}`} className="hover:underline">
                    {cliente.nombre}
                  </Link>
                </TableCell>
                <TableCell>{cliente.cuit ? `${TIPO_DOC_LABELS[cliente.tipoDoc]} ${cliente.cuit}` : '—'}</TableCell>
                <TableCell>{SIT_IVA_LABELS[cliente.situacionFiscal]}</TableCell>
                <TableCell>{cliente.direccion || '—'}</TableCell>
                <TableCell>{cliente.localidad || '—'}</TableCell>
                <TableCell>{cliente.provincia || '—'}</TableCell>
                <TableCell>{cliente.email || '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {getContactos(cliente).map(c => (
                      <div key={c.slot} className="flex items-center gap-1.5">
                        <a href={getWhatsAppUrl(c.telefono)} target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp">
                          <MessageCircle className="size-4 shrink-0 text-green-600" />
                        </a>
                        <span className="text-sm whitespace-nowrap">
                          {c.telefono}{c.contacto ? ` (${c.contacto})` : ''}
                        </span>
                      </div>
                    ))}
                    {getContactos(cliente).length === 0 && <span className="text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                      <Pencil />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingCliente(cliente)}>
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
            <SheetTitle>{editingCliente ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
            <SheetDescription>
              {editingCliente
                ? 'Modificá los datos del cliente.'
                : 'Completá los datos para crear un nuevo cliente.'}
            </SheetDescription>
          </SheetHeader>
          <ClienteForm
            key={editingCliente?.id ?? 'new'}
            cliente={editingCliente}
            onSuccess={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingCliente} onOpenChange={(open) => !open && setDeletingCliente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a "{deletingCliente?.nombre}". Esta acción puede revertirse solo desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCliente && deleteCliente(deletingCliente.id)}
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
