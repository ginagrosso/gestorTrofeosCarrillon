import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ComprobanteItemInput } from '@/shared/lib/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { formatMoney } from '@/shared/lib/money'

export type TipoComprobanteDesdeOrden = 'FACTURA_C' | 'REMITO'

const TIPO_LABEL: Record<TipoComprobanteDesdeOrden, string> = {
  FACTURA_C: 'Factura C',
  REMITO:    'Remito',
}

export interface ConfirmarComprobanteData {
  clienteNombre:     string
  clienteDireccion?: string
  clienteLocalidad?: string
  clienteCuit?:      string
  clienteSitIva?:    string
  condVenta:         string
}

export interface ComprobanteOrigen {
  clienteNombre:     string
  clienteDireccion?: string
  clienteLocalidad?: string
  clienteCuit?:      string
  clienteSitIva?:    string
  condVenta:         string
  items:             ComprobanteItemInput[]
}

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  tipo:         TipoComprobanteDesdeOrden
  origen:       ComprobanteOrigen | null
  onConfirm:    (data: ConfirmarComprobanteData) => void
  isPending:    boolean
}

const subtotalItem = (item: ComprobanteItemInput): number =>
  item.cantidad * item.precioUnitario * (1 - item.bonificacion / 100)

const EMPTY_DEFAULTS: ConfirmarComprobanteData = {
  clienteNombre:    '',
  clienteDireccion: '',
  clienteLocalidad: '',
  clienteCuit:      '',
  clienteSitIva:    '',
  condVenta:        'CONTADO',
}

export function ConfirmarComprobanteSheet({ open, onOpenChange, tipo, origen, onConfirm, isPending }: Props) {
  // El CUIT solo es obligatorio para Factura C — un Remito no lo necesita.
  const schema = useMemo(() => z.object({
    clienteNombre:    z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
    clienteDireccion: z.string().max(300).optional(),
    clienteLocalidad: z.string().max(100).optional(),
    clienteCuit:      z.string().max(20).optional(),
    clienteSitIva:    z.string().max(50).optional(),
    condVenta:        z.string().min(1, 'La condición de venta es obligatoria').max(50),
  }).superRefine((data, ctx) => {
    if (tipo === 'FACTURA_C' && !data.clienteCuit) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El CUIT es obligatorio para facturar', path: ['clienteCuit'] })
    }
  }), [tipo])

  const form = useForm<ConfirmarComprobanteData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  })

  useEffect(() => {
    if (!origen) return
    form.reset({
      clienteNombre:    origen.clienteNombre,
      clienteDireccion: origen.clienteDireccion ?? '',
      clienteLocalidad: origen.clienteLocalidad ?? '',
      clienteCuit:      origen.clienteCuit ?? '',
      clienteSitIva:    origen.clienteSitIva ?? '',
      condVenta:        origen.condVenta,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origen])

  const total = (origen?.items ?? []).reduce((acc, item) => acc + subtotalItem(item), 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Confirmar {TIPO_LABEL[tipo]}</SheetTitle>
          <SheetDescription>Revisá y completá los datos del cliente antes de generarlo.</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onConfirm)} autoComplete="off" className="mt-4 flex flex-col gap-4">
          <div className="space-y-1">
            <Label htmlFor="clienteNombre">Cliente</Label>
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
              <Label htmlFor="clienteCuit">CUIT{tipo === 'FACTURA_C' ? ' *' : ''}</Label>
              <Input
                id="clienteCuit"
                placeholder={tipo === 'FACTURA_C' ? 'Obligatorio para facturar' : 'Opcional'}
                {...form.register('clienteCuit')}
              />
              {form.formState.errors.clienteCuit && (
                <p className="text-sm text-destructive">{form.formState.errors.clienteCuit.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="clienteSitIva">Condición IVA</Label>
              <Input id="clienteSitIva" placeholder="Ej: Monotributo" {...form.register('clienteSitIva')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="condVenta">Condición de venta</Label>
            <Input id="condVenta" {...form.register('condVenta')} />
            {form.formState.errors.condVenta && (
              <p className="text-sm text-destructive">{form.formState.errors.condVenta.message}</p>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">P/Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(origen?.items ?? []).map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.descripcion}</TableCell>
                  <TableCell className="text-right">{item.cantidad}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.precioUnitario)}</TableCell>
                  <TableCell className="text-right">{formatMoney(subtotalItem(item))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Generando...' : `Generar ${TIPO_LABEL[tipo]}`}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
