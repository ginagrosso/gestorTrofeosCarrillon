import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { insertPresupuestoSchema, type InsertPresupuesto, type PresupuestoConItems, type Producto, SIT_IVA_LABELS } from '@/shared/lib/types'
import { useClientes } from '@/features/clientes'
import { useEmpresas } from '@/features/empresas'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { Combobox } from '@/shared/ui/combobox'
import { MoneyInput } from '@/shared/ui/money-input'
import { NumberInput } from '@/shared/ui/number-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
import { formatMoney } from '@/shared/lib/money'
import { useCreatePresupuesto, useUpdatePresupuesto } from '../hooks/usePresupuestosMutations'

const EMPTY_ITEM = { productoId: '', cantidad: 1, precioUnitario: 0, bonificacion: 0 }

const EMPTY_DEFAULTS = {
  empresaId:        '',
  clienteId:        undefined as string | undefined,
  clienteNombre:    '',
  clienteLocalidad: '',
  clienteCuit:      '',
  clienteSitIva:    '',
  condVenta:        'CONTADO',
  observaciones:    '',
  plazoEntrega:     'INMEDIATO',
  validezDias:      30,
  items:            [{ ...EMPTY_ITEM }],
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  presupuesto?: PresupuestoConItems
  productos: Producto[]
}

export default function PresupuestoFormSheet({ open, onOpenChange, presupuesto, productos }: Props) {
  const isEdit = !!presupuesto
  const { data: clientes } = useClientes()
  const { data: empresas } = useEmpresas()
  const { mutate: createPresupuesto, isPending: isCreating } = useCreatePresupuesto()
  const { mutate: updatePresupuesto, isPending: isUpdating } = useUpdatePresupuesto()
  const isPending = isCreating || isUpdating

  const empresasActivas = useMemo(() => (empresas ?? []).filter(e => e.activa), [empresas])

  const productoOptions = useMemo(
    () => productos.map(p => ({ value: p.id, label: `${p.codigo} — ${p.descripcion}` })),
    [productos],
  )

  const clienteOptions = useMemo(
    () => (clientes ?? []).map(c => ({ value: c.id, label: c.nombre })),
    [clientes],
  )

  const form = useForm<z.input<typeof insertPresupuestoSchema>, unknown, InsertPresupuesto>({
    resolver: zodResolver(insertPresupuestoSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const { setValue, reset } = form

  // Sincronizar el form cuando cambia el presupuesto que se edita.
  // Usa presupuesto?.id como dependencia para no re-ejecutar si el objeto
  // cambia de referencia pero sigue siendo el mismo registro.
  useEffect(() => {
    reset(presupuesto ? {
      empresaId:        presupuesto.empresaId ?? '',
      clienteId:        presupuesto.clienteId ?? undefined,
      clienteNombre:    presupuesto.clienteNombre,
      clienteLocalidad: presupuesto.clienteLocalidad ?? '',
      clienteCuit:      presupuesto.clienteCuit ?? '',
      clienteSitIva:    presupuesto.clienteSitIva ?? '',
      condVenta:        presupuesto.condVenta,
      observaciones:    presupuesto.observaciones ?? '',
      plazoEntrega:     presupuesto.plazoEntrega,
      validezDias:      presupuesto.validezDias,
      items: presupuesto.items.map(i => ({
        productoId:     i.productoId,
        cantidad:       i.cantidad,
        precioUnitario: i.precioUnitario,
        bonificacion:   i.bonificacion,
      })),
    } : EMPTY_DEFAULTS)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuesto?.id, reset])

  const watchedItems     = useWatch({ control: form.control, name: 'items' }) ?? []
  const watchedClienteId = useWatch({ control: form.control, name: 'clienteId' })

  // Autocompletar datos del cliente cuando el usuario selecciona uno registrado.
  // Si el clienteId coincide con el del presupuesto que se está editando, fue
  // puesto por el reset inicial — no sobreescribir los datos guardados.
  useEffect(() => {
    if (!watchedClienteId) return
    if (watchedClienteId === presupuesto?.clienteId) return
    const cliente = (clientes ?? []).find(c => c.id === watchedClienteId)
    if (!cliente) return
    setValue('clienteNombre',    cliente.nombre)
    setValue('clienteLocalidad', cliente.localidad ?? '')
    setValue('clienteCuit',      cliente.cuit ?? '')
    setValue('clienteSitIva',    SIT_IVA_LABELS[cliente.situacionFiscal])
  }, [watchedClienteId, clientes, setValue, presupuesto?.clienteId])

  const total = useMemo(
    () => watchedItems.reduce((acc, item) => {
      const sub = (item.cantidad ?? 0) * (item.precioUnitario ?? 0) * (1 - (item.bonificacion ?? 0) / 100)
      return acc + sub
    }, 0),
    [watchedItems],
  )

  const handleClose = () => {
    onOpenChange(false)
  }

  const onSubmit = (data: InsertPresupuesto) => {
    if (isEdit) {
      updatePresupuesto({ id: presupuesto.id, data }, { onSuccess: handleClose })
    } else {
      createPresupuesto(data, { onSuccess: handleClose })
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}</SheetTitle>
          <SheetDescription>
            {isEdit ? `N° interno: ${presupuesto.numero}` : 'Completá los datos del presupuesto.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <div className="space-y-1">
            <Label htmlFor="empresaId">Empresa</Label>
            <Select id="empresaId" {...form.register('empresaId')}>
              <option value="">Seleccionar empresa...</option>
              {empresasActivas.map(e => (
                <option key={e.id} value={e.id}>{e.nombreFantasia}</option>
              ))}
            </Select>
            {form.formState.errors.empresaId && (
              <p className="text-sm text-destructive">{form.formState.errors.empresaId.message}</p>
            )}
          </div>

          {/* Cliente registrado (opcional) */}
          <div className="space-y-1">
            <Label>Cliente registrado (opcional)</Label>
            <Controller
              name="clienteId"
              control={form.control}
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={clienteOptions}
                  placeholder="Buscar cliente..."
                  searchPlaceholder="Buscar cliente..."
                  emptyText="No se encontró el cliente."
                />
              )}
            />
          </div>

          {/* Nombre del cliente */}
          <div className="space-y-1">
            <Label htmlFor="clienteNombre">Nombre del cliente *</Label>
            <Input id="clienteNombre" {...form.register('clienteNombre')} />
            {form.formState.errors.clienteNombre && (
              <p className="text-sm text-destructive">{form.formState.errors.clienteNombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="clienteLocalidad">Localidad</Label>
              <Input id="clienteLocalidad" {...form.register('clienteLocalidad')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clienteCuit">CUIT</Label>
              <Input id="clienteCuit" {...form.register('clienteCuit')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="clienteSitIva">Condición IVA</Label>
              <Input id="clienteSitIva" {...form.register('clienteSitIva')} placeholder="Ej: Monotributo" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="condVenta">Condición de venta</Label>
              <Input id="condVenta" {...form.register('condVenta')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="plazoEntrega">Plazo de entrega</Label>
              <Input id="plazoEntrega" {...form.register('plazoEntrega')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="validezDias">Validez (días)</Label>
              <Controller
                name="validezDias"
                control={form.control}
                render={({ field }) => (
                  <NumberInput id="validezDias" value={field.value} onChange={field.onChange} allowDecimals={false} />
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input id="observaciones" {...form.register('observaciones')} />
          </div>

          {/* Ítems */}
          <div className="space-y-2">
            <Label>Ítems</Label>

            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2 rounded-md border p-3">
                <Controller
                  name={`items.${index}.productoId`}
                  control={form.control}
                  render={({ field: f }) => (
                    <Combobox
                      value={f.value}
                      onChange={(productoId) => {
                        f.onChange(productoId)
                        const producto = productos.find(p => p.id === productoId)
                        if (producto) setValue(`items.${index}.precioUnitario`, producto.precioVenta)
                      }}
                      options={productoOptions}
                      placeholder="Seleccionar producto..."
                      searchPlaceholder="Buscar producto..."
                      emptyText="No se encontró el producto."
                    />
                  )}
                />
                {form.formState.errors.items?.[index]?.productoId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.items[index].productoId?.message}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`cantidad-${index}`} className="text-xs">Cantidad</Label>
                    <Controller
                      name={`items.${index}.cantidad`}
                      control={form.control}
                      render={({ field: f }) => (
                        <NumberInput id={`cantidad-${index}`} value={f.value} onChange={f.onChange} allowDecimals={false} />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`precio-${index}`} className="text-xs">P. Unitario</Label>
                    <Controller
                      name={`items.${index}.precioUnitario`}
                      control={form.control}
                      render={({ field: f }) => (
                        <MoneyInput id={`precio-${index}`} value={f.value ?? 0} onChange={f.onChange} />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`bonif-${index}`} className="text-xs">Bonif. %</Label>
                    <Controller
                      name={`items.${index}.bonificacion`}
                      control={form.control}
                      render={({ field: f }) => (
                        <NumberInput id={`bonif-${index}`} value={f.value} onChange={f.onChange} />
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal:{' '}
                    {formatMoney(
                      (watchedItems[index]?.cantidad ?? 0) *
                      (watchedItems[index]?.precioUnitario ?? 0) *
                      (1 - (watchedItems[index]?.bonificacion ?? 0) / 100),
                    )}
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
            >
              <Plus className="size-4" />
              Agregar ítem
            </Button>
            {form.formState.errors.items?.root && (
              <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>
            )}
          </div>

          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
