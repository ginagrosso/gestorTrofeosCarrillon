import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pdf } from '@react-pdf/renderer'
import { Printer, Share2, Plus, Trash2 } from 'lucide-react'
import type { z } from 'zod'
import {
  insertReciboSchema,
  type InsertRecibo,
  type Recibo,
  type OrdenDeTrabajo,
  FORMA_PAGO_VALUES,
  FORMA_PAGO_LABELS,
} from '@/shared/lib/types'
import { useClientes, getClienteWhatsAppTelefono } from '@/features/clientes'
import { useProductos } from '@/features/productos'
import { getWhatsAppUrl } from '@/shared/lib/whatsapp'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { Combobox } from '@/shared/ui/combobox'
import { MoneyInput } from '@/shared/ui/money-input'
import { NumberInput } from '@/shared/ui/number-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
import { useCreateRecibo } from '../hooks/useRecibosMutations'
import { ReciboPDF, type ReciboItem } from './ReciboPDF'

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  orden:        OrdenDeTrabajo | null
  items:        ReciboItem[]
}

interface ReciboItemRow {
  productoId:     string
  cantidad:       number
  precioUnitario: number
}

const EMPTY_ITEM_ROW: ReciboItemRow = { productoId: '', cantidad: 1, precioUnitario: 0 }

async function generarBlob(recibo: Recibo, items: ReciboItem[]): Promise<Blob> {
  return pdf(<ReciboPDF recibo={recibo} items={items} />).toBlob()
}

function nombreArchivo(recibo: Recibo): string {
  const cliente = (recibo.clienteNombre?.trim() || 'cliente').replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ ]/g, '').replace(/\s+/g, '-')
  return `recibo-${recibo.ordenNumero ?? recibo.numero}-${cliente}.pdf`
}

export default function NuevoReciboSheet({ open, onOpenChange, orden, items }: Props) {
  const { mutate: createRecibo, isPending } = useCreateRecibo()
  const { data: clientes } = useClientes()
  const { data: productos } = useProductos()

  const clienteOptions = useMemo(
    () => (clientes ?? []).map(c => ({ value: c.id, label: c.nombre })),
    [clientes],
  )
  const productoOptions = useMemo(
    () => (productos ?? []).map(p => ({ value: p.id, label: `${p.codigo} — ${p.descripcion}` })),
    [productos],
  )

  // Ítems del recibo standalone (sin OT): no se persisten (el modelo de Recibo no los tiene),
  // solo sirven para el desglose impreso y para calcular el monto automáticamente.
  const [itemRows, setItemRows] = useState<ReciboItemRow[]>([])

  const addItemRow    = () => setItemRows(rows => [...rows, { ...EMPTY_ITEM_ROW }])
  const removeItemRow = (index: number) => setItemRows(rows => rows.filter((_, i) => i !== index))
  const updateItemRow = (index: number, patch: Partial<ReciboItemRow>) =>
    setItemRows(rows => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const itemsTotal = useMemo(
    () => itemRows.reduce((acc, row) => acc + row.cantidad * row.precioUnitario, 0),
    [itemRows],
  )

  const form = useForm<z.input<typeof insertReciboSchema>, unknown, InsertRecibo>({
    resolver: zodResolver(insertReciboSchema),
    defaultValues: {
      clienteId:     undefined,
      clienteNombre: '',
      monto:         0,
      formaPago:     'EFECTIVO',
      observaciones: '',
    },
  })

  const watchedClienteId = useWatch({ control: form.control, name: 'clienteId' })

  useEffect(() => {
    if (!orden) return
    form.reset({
      clienteId:     orden.clienteId ?? undefined,
      clienteNombre: orden.clienteNombre,
      monto:         orden.total,
      formaPago:     orden.formaPago ?? 'EFECTIVO',
      ordenId:       orden.id,
      ordenNumero:   orden.numero,
      observaciones: '',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden?.id])

  // Autocompletar el nombre cuando se elige un cliente registrado
  useEffect(() => {
    if (!watchedClienteId) return
    const cliente = (clientes ?? []).find(c => c.id === watchedClienteId)
    if (cliente) form.setValue('clienteNombre', cliente.nombre)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedClienteId])

  // Si hay ítems cargados, el monto se calcula solo (igual que en comprobantes)
  useEffect(() => {
    if (itemRows.length === 0) return
    form.setValue('monto', itemsTotal)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsTotal])

  const handleClose = () => {
    form.reset()
    setItemRows([])
    onOpenChange(false)
  }

  // Para el flujo por OT, los ítems vienen del pedido (prop); para el standalone,
  // se arman acá mismo con el catálogo de productos.
  const effectiveItems = (): ReciboItem[] => {
    if (orden) return items
    const productoPorId = new Map((productos ?? []).map(p => [p.id, p]))
    return itemRows
      .filter(row => row.productoId)
      .map(row => {
        const producto = productoPorId.get(row.productoId)
        return {
          descripcion:    producto ? producto.descripcion : row.productoId,
          cantidad:       row.cantidad,
          precioUnitario: row.precioUnitario,
        }
      })
  }

  const handleImprimir = form.handleSubmit((data: InsertRecibo) => {
    createRecibo(data, {
      onSuccess: async (recibo) => {
        handleClose()
        const blob = await generarBlob(recibo, effectiveItems())
        const url  = URL.createObjectURL(blob)
        const win  = window.open(url, '_blank')
        win?.addEventListener('load', () => {
          win.print()
          URL.revokeObjectURL(url)
        })
      },
    })
  })

  const handleWhatsApp = form.handleSubmit((data: InsertRecibo) => {
    createRecibo(data, {
      onSuccess: async (recibo) => {
        handleClose()
        const blob     = await generarBlob(recibo, effectiveItems())
        const filename = nombreArchivo(recibo)
        const file     = new File([blob], filename, { type: 'application/pdf' })

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Recibo de pago — Trofeos Carrillon Siglo 21',
          })
        } else {
          const url = URL.createObjectURL(blob)
          const a   = document.createElement('a')
          a.href    = url
          a.download = filename
          a.click()
          URL.revokeObjectURL(url)
          const clienteRegistrado = (clientes ?? []).find(c => c.id === data.clienteId)
          const phone = orden?.clienteTelefono ?? (clienteRegistrado ? getClienteWhatsAppTelefono(clienteRegistrado) : undefined)
          const texto = encodeURIComponent(
            `Hola${recibo.clienteNombre ? ` ${recibo.clienteNombre}` : ''}, te enviamos el recibo de pago` +
            `${recibo.ordenNumero ? ` por la Orden N° ${recibo.ordenNumero}` : ''}.`,
          )
          window.open(
            phone
              ? `${getWhatsAppUrl(phone)}?text=${texto}`
              : `https://web.whatsapp.com/send?text=${texto}`,
            '_blank',
          )
        }
      },
    })
  })

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Generar recibo de pago</SheetTitle>
          {orden && (
            <SheetDescription>
              Orden N° {orden.numero} — {orden.clienteNombre}
            </SheetDescription>
          )}
        </SheetHeader>

        <form autoComplete="off" className="mt-4 flex flex-col gap-4">
          {!orden && (
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
          )}

          <div className="space-y-1">
            <Label htmlFor="clienteNombre">{orden ? 'Cliente' : 'Cliente (opcional)'}</Label>
            <Input id="clienteNombre" placeholder={orden ? undefined : 'O escribí un nombre'} {...form.register('clienteNombre')} />
            {form.formState.errors.clienteNombre && (
              <p className="text-sm text-destructive">{form.formState.errors.clienteNombre.message}</p>
            )}
          </div>

          {!orden && (
            <div className="space-y-2">
              <Label>Ítems (opcional)</Label>

              {itemRows.map((row, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-md border p-3">
                  <Combobox
                    value={row.productoId}
                    onChange={(productoId) => {
                      const producto = (productos ?? []).find(p => p.id === productoId)
                      updateItemRow(index, {
                        productoId,
                        precioUnitario: producto?.precioVenta ?? row.precioUnitario,
                      })
                    }}
                    options={productoOptions}
                    placeholder="Seleccionar producto..."
                    searchPlaceholder="Buscar producto..."
                    emptyText="No se encontró el producto."
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad</Label>
                      <NumberInput
                        value={row.cantidad}
                        onChange={(v) => updateItemRow(index, { cantidad: v ?? 0 })}
                        allowDecimals={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">P. Unitario</Label>
                      <MoneyInput
                        value={row.precioUnitario}
                        onChange={(v) => updateItemRow(index, { precioUnitario: v })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Subtotal: {formatMoney(row.cantidad * row.precioUnitario)}
                    </span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItemRow(index)}>
                      <Trash2 className="size-4" />
                      <span className="sr-only">Eliminar fila</span>
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" className="w-full" onClick={addItemRow}>
                <Plus className="size-4" />
                Agregar ítem
              </Button>
            </div>
          )}

          <div className="space-y-1">
            <Label>Monto recibido</Label>
            <Controller
              name="monto"
              control={form.control}
              render={({ field }) => (
                <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
              )}
            />
            {itemRows.length > 0 && (
              <p className="text-xs text-muted-foreground">Se calculó según los ítems cargados.</p>
            )}
            {form.formState.errors.monto && (
              <p className="text-sm text-destructive">{form.formState.errors.monto.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="formaPago">Forma de pago</Label>
            <Select id="formaPago" {...form.register('formaPago')}>
              {FORMA_PAGO_VALUES.map(fp => (
                <option key={fp} value={fp}>{FORMA_PAGO_LABELS[fp]}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input id="observaciones" placeholder="Opcional" {...form.register('observaciones')} />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1"
              disabled={isPending}
              onClick={handleImprimir}
            >
              <Printer className="size-4" />
              Imprimir
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isPending}
              onClick={handleWhatsApp}
            >
              <Share2 className="size-4" />
              WhatsApp
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
