import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pdf } from '@react-pdf/renderer'
import { Printer, Share2 } from 'lucide-react'
import type { z } from 'zod'
import {
  updateOrdenPagoSchema,
  type UpdateOrdenPago,
  type InsertRecibo,
  type Recibo,
  type OrdenDeTrabajo,
  FORMA_PAGO_VALUES,
  FORMA_PAGO_LABELS,
} from '@/shared/lib/types'
import { formatMoney } from '@/shared/lib/money'
import { getWhatsAppUrl } from '@/shared/lib/whatsapp'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { MoneyInput } from '@/shared/ui/money-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
import { useUpdateOrdenPago } from '../hooks/useOrdenesMutations'
import { useCreateRecibo, ReciboPDF } from '@/features/recibos'

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  orden:        OrdenDeTrabajo | null
}

async function generarBlob(recibo: Recibo): Promise<Blob> {
  return pdf(<ReciboPDF recibo={recibo} />).toBlob()
}

function nombreArchivo(recibo: Recibo): string {
  const cliente = (recibo.clienteNombre?.trim() || 'cliente').replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ ]/g, '').replace(/\s+/g, '-')
  return `recibo-${recibo.ordenNumero ?? recibo.numero}-${cliente}.pdf`
}

export default function ActualizarPagoSheet({ open, onOpenChange, orden }: Props) {
  const { mutate: updatePago,   isPending: isUpdating } = useUpdateOrdenPago()
  const { mutate: createRecibo, isPending: isCreating  } = useCreateRecibo()
  const isPending = isUpdating || isCreating

  const [generarRecibo, setGenerarRecibo] = useState(true)

  const form = useForm<z.input<typeof updateOrdenPagoSchema>, unknown, UpdateOrdenPago>({
    resolver: zodResolver(updateOrdenPagoSchema),
    defaultValues: {
      montoEntrega:  0,
      formaPago:     'EFECTIVO',
      reciboNumero:  '',
      facturaNumero: '',
    },
  })

  useEffect(() => {
    if (!orden) return
    form.reset({
      montoEntrega:  0,  // El usuario ingresa el pago de hoy, no el acumulado
      formaPago:     orden.formaPago ?? 'EFECTIVO',
      reciboNumero:  orden.reciboNumero  ?? '',
      facturaNumero: orden.facturaNumero ?? '',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden?.id])

  // montoEntrega en el form = pago incremental de este momento
  // el total que se envía a la API = acumulado anterior + pago de hoy
  const pagoHoy       = form.watch('montoEntrega') ?? 0
  const totalEntregado = (orden?.montoEntrega ?? 0) + pagoHoy
  const saldoRestante  = (orden?.total ?? 0) - totalEntregado

  const handleClose = () => onOpenChange(false)

  const ejecutar = (data: UpdateOrdenPago, accion: 'guardar' | 'imprimir' | 'whatsapp') => {
    if (!orden) return
    const montoFinal = orden.montoEntrega + data.montoEntrega
    updatePago({ id: orden.id, data: { ...data, montoEntrega: montoFinal } }, {
      onSuccess: () => {
        if (!generarRecibo || accion === 'guardar') {
          handleClose()
          return
        }
        const reciboData: InsertRecibo = {
          clienteId:     orden.clienteId ?? undefined,
          clienteNombre: orden.clienteNombre,
          monto:         data.montoEntrega,  // solo el pago de hoy en el recibo
          formaPago:     data.formaPago,
          ordenId:       orden.id,
          ordenNumero:   orden.numero,
        }
        createRecibo(reciboData, {
          onSuccess: async (recibo) => {
            handleClose()
            const blob     = await generarBlob(recibo)
            const filename = nombreArchivo(recibo)
            if (accion === 'imprimir') {
              const url = URL.createObjectURL(blob)
              const win = window.open(url, '_blank')
              win?.addEventListener('load', () => {
                win.print()
                URL.revokeObjectURL(url)
              })
            } else {
              const file = new File([blob], filename, { type: 'application/pdf' })
              if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Recibo de pago — Trofeos Carrillon Siglo 21' })
              } else {
                const url = URL.createObjectURL(blob)
                const a   = document.createElement('a')
                a.href    = url
                a.download = filename
                a.click()
                URL.revokeObjectURL(url)
                const phone = orden.clienteTelefono
                const texto = encodeURIComponent(
                  `Hola ${orden.clienteNombre}, te enviamos el recibo de pago por la Orden N° ${orden.numero}.`,
                )
                window.open(
                  phone
                    ? `${getWhatsAppUrl(phone)}?text=${texto}`
                    : `https://web.whatsapp.com/send?text=${texto}`,
                  '_blank',
                )
              }
            }
          },
        })
      },
    })
  }

  const handleGuardar  = form.handleSubmit((data) => ejecutar(data, 'guardar'))
  const handleImprimir = form.handleSubmit((data) => ejecutar(data, 'imprimir'))
  const handleWhatsApp = form.handleSubmit((data) => ejecutar(data, 'whatsapp'))

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Registrar pago</SheetTitle>
          <SheetDescription>
            {orden ? `Orden N° ${orden.numero} — ${orden.clienteNombre}` : ''}
          </SheetDescription>
        </SheetHeader>

        <form autoComplete="off" className="mt-4 flex flex-col gap-4">
          <div className="space-y-1">
            <Label htmlFor="formaPago">Forma de pago</Label>
            <Select id="formaPago" {...form.register('formaPago')}>
              {FORMA_PAGO_VALUES.map(fp => (
                <option key={fp} value={fp}>{FORMA_PAGO_LABELS[fp]}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Monto del pago</Label>
            <Controller
              name="montoEntrega"
              control={form.control}
              render={({ field }) => (
                <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
              )}
            />
            {form.formState.errors.montoEntrega && (
              <p className="text-sm text-destructive">{form.formState.errors.montoEntrega.message}</p>
            )}
          </div>

          {/* Resumen de totales */}
          {orden && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Ya cobrado</span>
                <span>{formatMoney(orden.montoEntrega)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total entregado</span>
                <span>{formatMoney(totalEntregado)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className={saldoRestante <= 0 ? 'text-green-600 font-medium' : ''}>Saldo restante</span>
                <span className={saldoRestante <= 0 ? 'text-green-600 font-medium' : ''}>{formatMoney(Math.max(0, saldoRestante))}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="reciboNumero">N° Recibo</Label>
            <Input id="reciboNumero" placeholder="Opcional" {...form.register('reciboNumero')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="facturaNumero">N° Factura</Label>
            <Input id="facturaNumero" placeholder="Opcional" {...form.register('facturaNumero')} />
          </div>

          {/* Checkbox generar recibo */}
          <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
            <input
              type="checkbox"
              checked={generarRecibo}
              onChange={e => setGenerarRecibo(e.target.checked)}
              className="h-4 w-4 accent-brand-brown"
            />
            <span className="text-sm">Generar recibo de pago para el cliente</span>
          </label>

          {generarRecibo ? (
            <div className="flex gap-2">
              <Button type="button" className="flex-1" disabled={isPending} onClick={handleImprimir}>
                <Printer className="size-4" />
                Imprimir
              </Button>
              <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={handleWhatsApp}>
                <Share2 className="size-4" />
                WhatsApp
              </Button>
            </div>
          ) : (
            <Button type="button" disabled={isPending} onClick={handleGuardar}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}
