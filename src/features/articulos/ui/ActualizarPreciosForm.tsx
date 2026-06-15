import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { actualizarPreciosPorProveedorSchema, type ActualizarPreciosPorProveedor } from '@/shared/lib/types'
import { useProveedores } from '@/features/proveedores'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Combobox } from '@/shared/ui/combobox'
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
import { useActualizarPreciosPorProveedor } from '../hooks/useArticulosMutations'

interface ActualizarPreciosFormProps {
  onSuccess: () => void
}

export default function ActualizarPreciosForm({ onSuccess }: ActualizarPreciosFormProps) {
  const { data: proveedores } = useProveedores()
  const { mutate: actualizarPrecios, isPending } = useActualizarPreciosPorProveedor()
  const [confirmando, setConfirmando] = useState(false)

  const proveedorOptions = (proveedores ?? []).map(proveedor => ({ value: proveedor.id, label: proveedor.nombre }))
  const nombreProveedorPorId = new Map((proveedores ?? []).map(p => [p.id, p.nombre]))

  const form = useForm<ActualizarPreciosPorProveedor>({
    resolver: zodResolver(actualizarPreciosPorProveedorSchema),
    defaultValues: { proveedorId: '', porcentaje: 0 },
  })

  const { proveedorId, porcentaje } = form.watch()

  const handleConfirm = () => {
    actualizarPrecios(form.getValues(), { onSuccess })
  }

  return (
    <form onSubmit={form.handleSubmit(() => setConfirmando(true))} className="mt-4 flex flex-col gap-4">
      <div className="space-y-1">
        <Label htmlFor="proveedorId">Proveedor</Label>
        <Controller
          name="proveedorId"
          control={form.control}
          render={({ field }) => (
            <Combobox
              id="proveedorId"
              value={field.value}
              onChange={field.onChange}
              options={proveedorOptions}
              placeholder="Seleccionar proveedor..."
              searchPlaceholder="Buscar proveedor..."
              emptyText="No se encontró el proveedor."
            />
          )}
        />
        {form.formState.errors.proveedorId && (
          <p className="text-sm text-destructive">{form.formState.errors.proveedorId.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="porcentaje">% de aumento</Label>
        <Input id="porcentaje" type="number" step="0.01" {...form.register('porcentaje', { valueAsNumber: true })} />
        <p className="text-sm text-muted-foreground">
          Usá un número negativo para bajar precios (ej: 10 = +10%, -10 = -10%)
        </p>
        {form.formState.errors.porcentaje && (
          <p className="text-sm text-destructive">{form.formState.errors.porcentaje.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Actualizando...' : 'Actualizar precios'}
      </Button>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Aplicar {porcentaje > 0 ? '+' : ''}{porcentaje}% a todos los artículos de {nombreProveedorPorId.get(proveedorId) ?? ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los productos que usan estos artículos en su lista de
              materiales también van a actualizar su costo automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
