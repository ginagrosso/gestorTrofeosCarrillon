import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { insertArticuloSchema, type InsertArticulo, type Articulo } from '@/shared/lib/types'
import { useProveedores } from '@/features/proveedores'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Combobox } from '@/shared/ui/combobox'
import { MoneyInput } from '@/shared/ui/money-input'
import { useCreateArticulo, useUpdateArticulo } from '../hooks/useArticulosMutations'

interface ArticuloFormProps {
  articulo?: Articulo
  onSuccess: () => void
}

export default function ArticuloForm({ articulo, onSuccess }: ArticuloFormProps) {
  const { mutate: createArticulo, isPending: isCreating } = useCreateArticulo()
  const { mutate: updateArticulo, isPending: isUpdating } = useUpdateArticulo()
  const { data: proveedores } = useProveedores()
  const isPending = isCreating || isUpdating
  const proveedorOptions = (proveedores ?? []).map(proveedor => ({ value: proveedor.id, label: proveedor.nombre }))

  const form = useForm<z.input<typeof insertArticuloSchema>, unknown, InsertArticulo>({
    resolver: zodResolver(insertArticuloSchema),
    defaultValues: articulo ?? {
      codigo: '',
      descripcion: '',
      precioCosto: 0,
      porcIva: 21,
      precioVenta: 0,
      proveedorId: '',
      unidad: 'unidad',
      stock: 0,
    },
  })

  const onSubmit = (data: InsertArticulo) => {
    if (articulo) {
      updateArticulo({ id: articulo.id, data }, { onSuccess })
    } else {
      createArticulo(data, { onSuccess })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
      <div className="space-y-1">
        <Label htmlFor="codigo">Código</Label>
        <Input id="codigo" {...form.register('codigo')} />
        {form.formState.errors.codigo && (
          <p className="text-sm text-destructive">{form.formState.errors.codigo.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input id="descripcion" {...form.register('descripcion')} />
        {form.formState.errors.descripcion && (
          <p className="text-sm text-destructive">{form.formState.errors.descripcion.message}</p>
        )}
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="precioCosto">Precio Costo</Label>
          <Controller
            name="precioCosto"
            control={form.control}
            render={({ field }) => (
              <MoneyInput id="precioCosto" value={field.value ?? 0} onChange={field.onChange} allowDecimals={false} />
            )}
          />
          {form.formState.errors.precioCosto && (
            <p className="text-sm text-destructive">{form.formState.errors.precioCosto.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="porcIva">% IVA</Label>
          <Input id="porcIva" type="number" step="0.01" {...form.register('porcIva', { valueAsNumber: true })} />
          {form.formState.errors.porcIva && (
            <p className="text-sm text-destructive">{form.formState.errors.porcIva.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" step="1" {...form.register('stock', { valueAsNumber: true })} />
          {form.formState.errors.stock && (
            <p className="text-sm text-destructive">{form.formState.errors.stock.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="unidad">Unidad</Label>
          <Input id="unidad" {...form.register('unidad')} />
        </div>
      </div>

      {/* Precio Venta no se muestra: el formulario legacy de Artículos no lo pide (solo Productos). Se conserva en 0 / valor importado. */}
      <input type="hidden" {...form.register('precioVenta', { valueAsNumber: true })} />

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
