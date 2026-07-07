import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import {
  TIPO_COMPROBANTE_VALUES,
  TIPO_COMPROBANTE_LABELS,
  SIT_IVA_LABELS,
  type InsertComprobante,
} from '@/shared/lib/types'
import { useEmpresas } from '@/features/empresas'
import { useClientes } from '@/features/clientes'
import { useProductos } from '@/features/productos'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { Combobox } from '@/shared/ui/combobox'
import { MoneyInput } from '@/shared/ui/money-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
import { formatMoney } from '@/shared/lib/money'
import { useCreateComprobante } from '../hooks/useComprobantesMutations'

const NOTA_TIPOS = ['NOTA_CREDITO_C', 'NOTA_DEBITO_C']

// Los ítems del comprobante se seleccionan desde el catálogo de productos (igual que en
// presupuestos/OT); código y descripción se denormalizan del producto recién al enviar,
// porque el comprobante no debe cambiar si el producto se edita o elimina después.
const nuevoComprobanteItemSchema = z.object({
  productoId:     z.string().min(1, 'Seleccioná un producto'),
  cantidad:       z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
  bonificacion:   z.number().min(0).max(100).default(0),
})

const nuevoComprobanteFormSchema = z.object({
  tipo:             z.enum(TIPO_COMPROBANTE_VALUES),
  empresaId:        z.string().min(1, 'La empresa es obligatoria'),
  clienteId:        z.string().optional(),
  clienteNombre:    z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  clienteDireccion: z.string().max(300).optional(),
  clienteLocalidad: z.string().max(100).optional(),
  clienteCuit:      z.string().max(20).optional(),
  clienteSitIva:    z.string().max(50).optional(),
  condVenta:        z.string().max(50).default('CONTADO'),
  observaciones:    z.string().max(500).optional(),
  comprobanteRef:   z.string().max(50).optional(),
  items:            z.array(nuevoComprobanteItemSchema).min(1, 'Agregá al menos un ítem'),
}).refine(
  data => !NOTA_TIPOS.includes(data.tipo) || !!data.comprobanteRef,
  { message: 'El comprobante de referencia es obligatorio para Notas de Crédito/Débito', path: ['comprobanteRef'] },
)

type NuevoComprobanteForm = z.infer<typeof nuevoComprobanteFormSchema>

const EMPTY_ITEM = { productoId: '', cantidad: 1, precioUnitario: 0, bonificacion: 0 }

const EMPTY_DEFAULTS = {
  tipo:             'FACTURA_C' as const,
  empresaId:        '',
  clienteId:        undefined as string | undefined,
  clienteNombre:    '',
  clienteDireccion: '',
  clienteLocalidad: '',
  clienteCuit:      '',
  clienteSitIva:    '',
  condVenta:        'CONTADO',
  observaciones:    '',
  comprobanteRef:   '',
  items:            [{ ...EMPTY_ITEM }],
}

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
}

export default function NuevoComprobanteSheet({ open, onOpenChange }: Props) {
  const { data: empresas } = useEmpresas()
  const { data: clientes } = useClientes()
  const { data: productos } = useProductos()
  const { mutate: createComprobante, isPending } = useCreateComprobante()

  const empresasActivas = useMemo(() => (empresas ?? []).filter(e => e.activa), [empresas])
  const clienteOptions = useMemo(
    () => (clientes ?? []).map(c => ({ value: c.id, label: c.nombre })),
    [clientes],
  )
  const productoOptions = useMemo(
    () => (productos ?? []).map(p => ({ value: p.id, label: `${p.codigo} — ${p.descripcion}` })),
    [productos],
  )

  const form = useForm<z.input<typeof nuevoComprobanteFormSchema>, unknown, NuevoComprobanteForm>({
    resolver: zodResolver(nuevoComprobanteFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const { setValue, reset } = form

  const watchedItems     = useWatch({ control: form.control, name: 'items' }) ?? []
  const watchedTipo      = useWatch({ control: form.control, name: 'tipo' })
  const watchedClienteId = useWatch({ control: form.control, name: 'clienteId' })

  // Autocompletar datos del cliente cuando se selecciona uno registrado
  useEffect(() => {
    if (!watchedClienteId) return
    const cliente = (clientes ?? []).find(c => c.id === watchedClienteId)
    if (!cliente) return
    setValue('clienteNombre',    cliente.nombre)
    setValue('clienteDireccion', cliente.direccion ?? '')
    setValue('clienteLocalidad', cliente.localidad ?? '')
    setValue('clienteCuit',      cliente.cuit ?? '')
    setValue('clienteSitIva',    SIT_IVA_LABELS[cliente.situacionFiscal])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedClienteId])

  const total = useMemo(
    () => watchedItems.reduce((acc, item) => {
      const sub = (item.cantidad ?? 0) * (item.precioUnitario ?? 0) * (1 - (item.bonificacion ?? 0) / 100)
      return acc + sub
    }, 0),
    [watchedItems],
  )

  const handleClose = () => {
    reset(EMPTY_DEFAULTS)
    onOpenChange(false)
  }

  const onSubmit = (data: NuevoComprobanteForm) => {
    const productoPorId = new Map((productos ?? []).map(p => [p.id, p]))
    const payload: InsertComprobante = {
      ...data,
      items: data.items.map(item => {
        const producto = productoPorId.get(item.productoId)
        return {
          codigo:         producto?.codigo,
          descripcion:    producto ? producto.descripcion : item.productoId,
          cantidad:       item.cantidad,
          precioUnitario: item.precioUnitario,
          bonificacion:   item.bonificacion,
        }
      }),
    }
    createComprobante(payload, { onSuccess: handleClose })
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Nuevo comprobante</SheetTitle>
          <SheetDescription>Completá los datos del comprobante.</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1">
              <Label htmlFor="tipo">Tipo de comprobante</Label>
              <Select id="tipo" {...form.register('tipo')}>
                {TIPO_COMPROBANTE_VALUES.map(tipo => (
                  <option key={tipo} value={tipo}>{TIPO_COMPROBANTE_LABELS[tipo]}</option>
                ))}
              </Select>
            </div>
          </div>

          {NOTA_TIPOS.includes(watchedTipo) && (
            <div className="space-y-1">
              <Label htmlFor="comprobanteRef">Comprobante de referencia</Label>
              <Input id="comprobanteRef" placeholder="Ej: 0001-00001313" {...form.register('comprobanteRef')} />
              {form.formState.errors.comprobanteRef && (
                <p className="text-sm text-destructive">{form.formState.errors.comprobanteRef.message}</p>
              )}
            </div>
          )}

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

          <div className="space-y-1">
            <Label htmlFor="clienteNombre">Nombre del cliente *</Label>
            <Input id="clienteNombre" {...form.register('clienteNombre')} />
            {form.formState.errors.clienteNombre && (
              <p className="text-sm text-destructive">{form.formState.errors.clienteNombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="clienteDireccion">Dirección</Label>
              <Input id="clienteDireccion" {...form.register('clienteDireccion')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clienteLocalidad">Localidad</Label>
              <Input id="clienteLocalidad" {...form.register('clienteLocalidad')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="clienteCuit">CUIT</Label>
              <Input id="clienteCuit" {...form.register('clienteCuit')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clienteSitIva">Condición IVA</Label>
              <Input id="clienteSitIva" placeholder="Ej: Monotributo" {...form.register('clienteSitIva')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="condVenta">Condición de venta</Label>
            <Input id="condVenta" {...form.register('condVenta')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input id="observaciones" placeholder="Opcional" {...form.register('observaciones')} />
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
                        const producto = (productos ?? []).find(p => p.id === productoId)
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
                    <Input
                      id={`cantidad-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      {...form.register(`items.${index}.cantidad`, { valueAsNumber: true })}
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
                    <Input
                      id={`bonif-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      {...form.register(`items.${index}.bonificacion`, { valueAsNumber: true })}
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
            {isPending ? 'Guardando...' : 'Generar comprobante'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
