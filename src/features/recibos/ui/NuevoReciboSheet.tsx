import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pdf } from '@react-pdf/renderer'
import { Printer, Share2 } from 'lucide-react'
import type { z } from 'zod'
import {
  insertReciboSchema,
  type InsertRecibo,
  type Recibo,
  type OrdenDeTrabajo,
  FORMA_PAGO_VALUES,
  FORMA_PAGO_LABELS,
} from '@/shared/lib/types'
import { getWhatsAppUrl } from '@/shared/lib/whatsapp'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { MoneyInput } from '@/shared/ui/money-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
import { useCreateRecibo } from '../hooks/useRecibosMutations'
import { ReciboPDF, type ReciboItem } from './ReciboPDF'

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  orden:        OrdenDeTrabajo | null
  items:        ReciboItem[]
}

async function generarBlob(recibo: Recibo, items: ReciboItem[]): Promise<Blob> {
  return pdf(<ReciboPDF recibo={recibo} items={items} />).toBlob()
}

function nombreArchivo(recibo: Recibo): string {
  const cliente = recibo.clienteNombre.trim().replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ ]/g, '').replace(/\s+/g, '-')
  return `recibo-${recibo.ordenNumero ?? recibo.numero}-${cliente}.pdf`
}

export default function NuevoReciboSheet({ open, onOpenChange, orden, items }: Props) {
  const { mutate: createRecibo, isPending } = useCreateRecibo()

  const form = useForm<z.input<typeof insertReciboSchema>, unknown, InsertRecibo>({
    resolver: zodResolver(insertReciboSchema),
    defaultValues: {
      clienteNombre: '',
      monto:         0,
      formaPago:     'EFECTIVO',
      observaciones: '',
    },
  })

  useEffect(() => {
    if (!orden) return
    form.reset({
      clienteNombre: orden.clienteNombre,
      monto:         orden.total,
      formaPago:     orden.formaPago ?? 'EFECTIVO',
      ordenId:       orden.id,
      ordenNumero:   orden.numero,
      observaciones: '',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden?.id])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const handleImprimir = form.handleSubmit((data: InsertRecibo) => {
    createRecibo(data, {
      onSuccess: async (recibo) => {
        handleClose()
        const blob = await generarBlob(recibo, items)
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
        const blob     = await generarBlob(recibo, items)
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
          const phone = orden?.clienteTelefono
          const texto = encodeURIComponent(
            `Hola${orden ? ` ${orden.clienteNombre}` : ''}, te enviamos el recibo de pago` +
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Generar recibo de pago</SheetTitle>
          {orden && (
            <SheetDescription>
              Orden N° {orden.numero} — {orden.clienteNombre}
            </SheetDescription>
          )}
        </SheetHeader>

        <form autoComplete="off" className="mt-4 flex flex-col gap-4">
          <div className="space-y-1">
            <Label htmlFor="clienteNombre">Cliente</Label>
            <Input id="clienteNombre" {...form.register('clienteNombre')} />
            {form.formState.errors.clienteNombre && (
              <p className="text-sm text-destructive">{form.formState.errors.clienteNombre.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Monto recibido</Label>
            <Controller
              name="monto"
              control={form.control}
              render={({ field }) => (
                <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
              )}
            />
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
