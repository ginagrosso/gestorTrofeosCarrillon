import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { insertCompraSchema, type InsertCompra } from '@/shared/lib/types'
import { useProveedores } from '@/features/proveedores'
import { useArticulos } from '@/features/articulos'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Combobox } from '@/shared/ui/combobox'
import { MoneyInput } from '@/shared/ui/money-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
import { formatMoney } from '@/shared/lib/money'
import { ArticuloComboboxConCrear } from './ArticuloComboboxConCrear'
import { useCreateCompra } from '../hooks/useComprasMutations'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_ITEM = { articuloId: '', cantidad: 1, precioUnitario: 0 }

export default function NuevaCompraSheet({ open, onOpenChange }: Props) {
  const { data: proveedores } = useProveedores()
  const { data: articulos } = useArticulos()
  const { mutate: createCompra, isPending } = useCreateCompra()

  const proveedorOptions = (proveedores ?? []).map(p => ({ value: p.id, label: p.nombre }))

  const form = useForm<z.input<typeof insertCompraSchema>, unknown, InsertCompra>({
    resolver: zodResolver(insertCompraSchema),
    defaultValues: {
      proveedorId:    '',
      nroComprobante: '',
      items:          [{ ...EMPTY_ITEM }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const { setValue } = form

  const watchedProveedorId = useWatch({ control: form.control, name: 'proveedorId' })
  const watchedItems       = useWatch({ control: form.control, name: 'items' }) ?? []

  const articulosPorProveedor = useMemo(
    () => (articulos ?? []).filter(a => a.proveedorId === watchedProveedorId),
    [articulos, watchedProveedorId],
  )

  useEffect(() => {
    setValue('items', [{ ...EMPTY_ITEM }])
  }, [watchedProveedorId, setValue])

  const total = useMemo(
    () => watchedItems.reduce((acc, item) => acc + (item.cantidad ?? 0) * (item.precioUnitario ?? 0), 0),
    [watchedItems],
  )

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = (data: InsertCompra) => {
    createCompra(data, { onSuccess: handleClose })
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Nueva compra</SheetTitle>
          <SheetDescription>
            Registrá la recepción de mercadería de un proveedor.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
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
            <Label htmlFor="nroComprobante">N° Comprobante (opcional)</Label>
            <Input
              id="nroComprobante"
              {...form.register('nroComprobante')}
              placeholder="Ej: 0001-00000123"
            />
          </div>

          <div className="space-y-2">
            <Label>Ítems</Label>

            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2 rounded-md border p-3">
                <Controller
                  name={`items.${index}.articuloId`}
                  control={form.control}
                  render={({ field: f }) => (
                    <ArticuloComboboxConCrear
                      proveedorId={watchedProveedorId}
                      articulosPorProveedor={articulosPorProveedor}
                      value={f.value}
                      onChange={(articuloId, precioCosto) => {
                        f.onChange(articuloId)
                        setValue(`items.${index}.precioUnitario`, precioCosto)
                      }}
                    />
                  )}
                />
                {form.formState.errors.items?.[index]?.articuloId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.items[index].articuloId?.message}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`cantidad-${index}`} className="text-xs">Cantidad</Label>
                    <Input
                      id={`cantidad-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      {...form.register(`items.${index}.cantidad`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.items?.[index]?.cantidad && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.items[index].cantidad?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`precio-${index}`} className="text-xs">Precio unitario</Label>
                    <Controller
                      name={`items.${index}.precioUnitario`}
                      control={form.control}
                      render={({ field: f }) => (
                        <MoneyInput
                          id={`precio-${index}`}
                          value={f.value ?? 0}
                          onChange={f.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal: {formatMoney((watchedItems[index]?.cantidad ?? 0) * (watchedItems[index]?.precioUnitario ?? 0))}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Eliminar fila</span>
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ ...EMPTY_ITEM })}
              disabled={!watchedProveedorId}
            >
              <Plus className="size-4" />
              Agregar ítem
            </Button>
          </div>

          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar compra'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
