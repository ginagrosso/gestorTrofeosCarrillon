import { useState } from 'react'
import { Plus, Pencil, Trash2, MessageCircle } from 'lucide-react'
import { useProveedores, useDeleteProveedor, ProveedorForm } from '@/features/proveedores'
import { SIT_IVA_LABELS, type Proveedor } from '@/shared/lib/types'
import { getWhatsAppUrl } from '@/shared/lib/whatsapp'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
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

export default function ProveedoresPage() {
  const { data: proveedores, isLoading } = useProveedores()
  const { mutate: deleteProveedor, isPending: isDeleting } = useDeleteProveedor()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | undefined>(undefined)
  const [deletingProveedor, setDeletingProveedor] = useState<Proveedor | null>(null)

  const handleNew = () => {
    setEditingProveedor(undefined)
    setSheetOpen(true)
  }

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-brown">Proveedores</h1>
        <Button onClick={handleNew}>
          <Plus />
          Nuevo proveedor
        </Button>
      </header>

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
              <TableHead>Contacto</TableHead>
              <TableHead>Localidad</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Situación IVA</TableHead>
              <TableHead>Rubro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proveedores?.map((proveedor) => {
              const whatsappPhone = proveedor.telefono1 || proveedor.telefono2

              return (
                <TableRow key={proveedor.id}>
                  <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                  <TableCell>{proveedor.contacto || '—'}</TableCell>
                  <TableCell>{proveedor.localidad || '—'}</TableCell>
                  <TableCell>{proveedor.telefono1 || '—'}</TableCell>
                  <TableCell>{SIT_IVA_LABELS[proveedor.sitIva]}</TableCell>
                  <TableCell>{proveedor.rubro || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {whatsappPhone && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={getWhatsAppUrl(whatsappPhone)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="text-green-600" />
                            <span className="sr-only">Abrir WhatsApp</span>
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(proveedor)}>
                        <Pencil />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingProveedor(proveedor)}>
                        <Trash2 />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingProveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</SheetTitle>
            <SheetDescription>
              {editingProveedor
                ? 'Modificá los datos del proveedor.'
                : 'Completá los datos para crear un nuevo proveedor.'}
            </SheetDescription>
          </SheetHeader>
          <ProveedorForm
            key={editingProveedor?.id ?? 'new'}
            proveedor={editingProveedor}
            onSuccess={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingProveedor} onOpenChange={(open) => !open && setDeletingProveedor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a "{deletingProveedor?.nombre}". Esta acción puede revertirse solo desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProveedor && deleteProveedor(deletingProveedor.id)}
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
