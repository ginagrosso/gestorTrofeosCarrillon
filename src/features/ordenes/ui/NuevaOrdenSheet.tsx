import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import {
  insertOrdenSchema,
  type InsertOrden,
  type Producto,
  type PresupuestoConItems,
  FORMA_PAGO_VALUES,
  FORMA_PAGO_LABELS,
} from '@/shared/lib/types'
import { useClientes, getClienteWhatsAppTelefono } from '@/features/clientes'
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
import { useCreateOrden } from '../hooks/useOrdenesMutations'

const EMPTY_ITEM = { productoId: '', cantidad: 1, precioUnitario: 0 }

const EMPTY_DEFAULTS = {
  fechaPrometida:   '',
  empresaId:        '',
  clienteId:        undefined as string | undefined,
  clienteNombre:    '',
  clienteTelefono:  '',
  clienteLocalidad: '',
  clienteCuit:      '',
  condVenta:        'CONTADO',
  formaPago:       null as z.input<typeof insertOrdenSchema>['formaPago'],
  montoEntrega:    0,
  items:           [{ ...EMPTY_ITEM }],
}

interface Props {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  productos:     Producto[]
  presupuesto?:  PresupuestoConItems
}

export default function NuevaOrdenSheet({ open, onOpenChange, productos, presupuesto }: Props) {
  const { data: clientes } = useClientes()
  const { data: empresas } = useEmpresas()
  const { mutate: createOrden, isPending } = useCreateOrden()

  const empresasActivas = useMemo(() => (empresas ?? []).filter(e => e.activa), [empresas])

  const productoOptions = useMemo(
    () => productos.map(p => ({ value: p.id, label: `${p.codigo} — ${p.descripcion}` })),
    [productos],
  )
  const clienteOptions = useMemo(
    () => (clientes ?? []).map(c => ({ value: c.id, label: c.nombre })),
    [clientes],
  )

  const form = useForm<z.input<typeof insertOrdenSchema>, unknown, InsertOrden>({
    resolver: zodResolver(insertOrdenSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const { setValue, reset } = form

  // Pre-rellenar desde presupuesto cuando se abre para convertir
  useEffect(() => {
    if (!presupuesto) return
    reset({
      ...EMPTY_DEFAULTS,
      empresaId:        presupuesto.empresaId ?? '',
      clienteId:        presupuesto.clienteId ?? undefined,
      clienteNombre:    presupuesto.clienteNombre,
      clienteLocalidad: presupuesto.clienteLocalidad ?? '',
      clienteCuit:      presupuesto.clienteCuit ?? '',
      presupuestoId:    presupuesto.id,
      items: presupuesto.items.map(i => ({
        productoId:     i.productoId,
        cantidad:       i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuesto?.id])

  const watchedItems     = useWatch({ control: form.control, name: 'items' }) ?? []
  const watchedClienteId = useWatch({ control: form.control, name: 'clienteId' })
  const watchedMonto     = useWatch({ control: form.control, name: 'montoEntrega' }) ?? 0

  // Auto-completar nombre y teléfono cuando se selecciona un cliente registrado
  useEffect(() => {
    if (!watchedClienteId) return
    const cliente = (clientes ?? []).find(c => c.id === watchedClienteId)
    if (!cliente) return
    setValue('clienteNombre',    cliente.nombre)
    setValue('clienteTelefono',  getClienteWhatsAppTelefono(cliente) ?? '')
    setValue('clienteLocalidad', cliente.localidad ?? '')
    setValue('clienteCuit',      cliente.cuit ?? '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedClienteId])

  // Limpiar formaPago si no hay entrega; setear EFECTIVO por defecto cuando sí hay
  useEffect(() => {
    if (watchedMonto > 0) {
      if (!form.getValues('formaPago')) setValue('formaPago', 'EFECTIVO')
    } else {
      setValue('formaPago', null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedMonto])

  const total = useMemo(
    () => watchedItems.reduce((acc, item) => acc + (item.cantidad ?? 0) * (item.precioUnitario ?? 0), 0),
    [watchedItems],
  )

  const handleClose = () => {
    reset(EMPTY_DEFAULTS)
    onOpenChange(false)
  }

  const onSubmit = (data: InsertOrden) => {
    createOrden(data, { onSuccess: handleClose })
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Nueva orden de trabajo</SheetTitle>
          <SheetDescription>
            {presupuesto
              ? `Desde presupuesto de ${presupuesto.clienteNombre}`
              : 'Completá los datos del pedido.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="mt-4 flex flex-col gap-4">

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="clienteNombre">Institución / Cliente *</Label>
              <Input id="clienteNombre" {...form.register('clienteNombre')} />
              {form.formState.errors.clienteNombre && (
                <p className="text-sm text-destructive">{form.formState.errors.clienteNombre.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="clienteTelefono">Teléfono de contacto</Label>
              <Input id="clienteTelefono" placeholder="Opcional" {...form.register('clienteTelefono')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="fechaPrometida">Fecha de entrega prometida *</Label>
            <Input
              id="fechaPrometida"
              type="date"
              {...form.register('fechaPrometida')}
            />
            {form.formState.errors.fechaPrometida && (
              <p className="text-sm text-destructive">{form.formState.errors.fechaPrometida.message}</p>
            )}
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

                <div className="grid grid-cols-2 gap-2">
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
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal:{' '}
                    {formatMoney(
                      (watchedItems[index]?.cantidad ?? 0) * (watchedItems[index]?.precioUnitario ?? 0),
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

          {/* Pago */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Monto entregado (seña)</Label>
              <Controller
                name="montoEntrega"
                control={form.control}
                render={({ field }) => (
                  <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formaPago">Forma de pago</Label>
              <Controller
                name="formaPago"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="formaPago"
                    disabled={watchedMonto <= 0}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value || null)}
                  >
                    <option value="">Sin pago</option>
                    {FORMA_PAGO_VALUES.map(fp => (
                      <option key={fp} value={fp}>{FORMA_PAGO_LABELS[fp]}</option>
                    ))}
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1 border-t pt-2 text-sm">
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-medium">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Entrega</span>
              <span>{formatMoney(watchedMonto)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Saldo</span>
              <span>{formatMoney(total - watchedMonto)}</span>
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Crear orden'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
