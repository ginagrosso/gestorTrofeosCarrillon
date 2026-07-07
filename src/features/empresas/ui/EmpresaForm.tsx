import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import {
  insertEmpresaSchema,
  TIPO_COMPROBANTE_VALUES,
  TIPO_COMPROBANTE_LABELS,
  type InsertEmpresa,
  type Empresa,
  type Contadores,
} from '@/shared/lib/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useCreateEmpresa, useUpdateEmpresa } from '../hooks/useEmpresasMutations'

interface EmpresaFormProps {
  empresa?: Empresa
  onSuccess: () => void
}

const DEFAULT_CONTADORES: Contadores = {
  FACTURA_C:      { puntoVenta: '0001', ultimoNumero: 0 },
  REMITO:         { puntoVenta: '0001', ultimoNumero: 0 },
  NOTA_CREDITO_C: { puntoVenta: '0001', ultimoNumero: 0 },
  NOTA_DEBITO_C:  { puntoVenta: '0001', ultimoNumero: 0 },
}

export default function EmpresaForm({ empresa, onSuccess }: EmpresaFormProps) {
  const { mutate: createEmpresa, isPending: isCreating } = useCreateEmpresa()
  const { mutate: updateEmpresa, isPending: isUpdating } = useUpdateEmpresa()
  const isPending = isCreating || isUpdating

  const form = useForm<z.input<typeof insertEmpresaSchema>, unknown, InsertEmpresa>({
    resolver: zodResolver(insertEmpresaSchema),
    defaultValues: empresa
      ? { ...empresa, contadores: empresa.contadores ?? DEFAULT_CONTADORES }
      : {
          nombreFantasia: '',
          razonSocial:    '',
          domicilio:      '',
          localidad:      '',
          cuit:           '',
          iibb:           '',
          fechaInicioAct: '',
          condIva:        '',
          activa:         true,
          contadores:     DEFAULT_CONTADORES,
        },
  })

  const onSubmit = (data: InsertEmpresa) => {
    if (empresa) {
      updateEmpresa({ id: empresa.id, data }, { onSuccess })
    } else {
      createEmpresa(data, { onSuccess })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
      <div className="space-y-1">
        <Label htmlFor="nombreFantasia">Nombre de fantasía</Label>
        <Input id="nombreFantasia" {...form.register('nombreFantasia')} />
        {form.formState.errors.nombreFantasia && (
          <p className="text-sm text-destructive">{form.formState.errors.nombreFantasia.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="razonSocial">Razón social</Label>
        <Input id="razonSocial" {...form.register('razonSocial')} />
        {form.formState.errors.razonSocial && (
          <p className="text-sm text-destructive">{form.formState.errors.razonSocial.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="domicilio">Domicilio</Label>
        <Input id="domicilio" {...form.register('domicilio')} />
        {form.formState.errors.domicilio && (
          <p className="text-sm text-destructive">{form.formState.errors.domicilio.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="localidad">Localidad</Label>
        <Input id="localidad" {...form.register('localidad')} />
        {form.formState.errors.localidad && (
          <p className="text-sm text-destructive">{form.formState.errors.localidad.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cuit">CUIT</Label>
          <Input id="cuit" {...form.register('cuit')} />
          {form.formState.errors.cuit && (
            <p className="text-sm text-destructive">{form.formState.errors.cuit.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="iibb">Ingresos Brutos</Label>
          <Input id="iibb" {...form.register('iibb')} />
          {form.formState.errors.iibb && (
            <p className="text-sm text-destructive">{form.formState.errors.iibb.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="fechaInicioAct">Inicio de actividades</Label>
          <Input id="fechaInicioAct" placeholder="ej: 01/01/2010" {...form.register('fechaInicioAct')} />
          {form.formState.errors.fechaInicioAct && (
            <p className="text-sm text-destructive">{form.formState.errors.fechaInicioAct.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="condIva">Condición IVA</Label>
          <Input id="condIva" placeholder="ej: Responsable Monotributo" {...form.register('condIva')} />
          {form.formState.errors.condIva && (
            <p className="text-sm text-destructive">{form.formState.errors.condIva.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="activa"
          className="size-4 rounded border-input"
          {...form.register('activa')}
        />
        <Label htmlFor="activa">Activa</Label>
      </div>

      <div className="border-t pt-4">
        <p className="mb-3 text-sm font-medium text-brand-brown">Contadores de comprobantes</p>
        <div className="flex flex-col gap-3">
          {TIPO_COMPROBANTE_VALUES.map(tipo => (
            <div key={tipo} className="grid grid-cols-[1fr_6rem_7rem] items-center gap-3">
              <span className="text-sm text-muted-foreground">{TIPO_COMPROBANTE_LABELS[tipo]}</span>
              <div className="space-y-0.5">
                <Label className="text-xs">Pto. venta</Label>
                <Input
                  placeholder="0001"
                  className="h-8 text-sm"
                  {...form.register(`contadores.${tipo}.puntoVenta`)}
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs">Último N°</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-8 text-sm"
                  {...form.register(`contadores.${tipo}.ultimoNumero`, { valueAsNumber: true })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
