import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  insertClienteSchema,
  type InsertCliente,
  type Cliente,
  SIT_IVA_LABELS,
  TIPO_DOC_LABELS,
} from '@/shared/lib/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { useCreateCliente, useUpdateCliente } from '../hooks/useClientesMutations'

interface ClienteFormProps {
  cliente?: Cliente
  onSuccess: () => void
}

export default function ClienteForm({ cliente, onSuccess }: ClienteFormProps) {
  const { mutate: createCliente, isPending: isCreating } = useCreateCliente()
  const { mutate: updateCliente, isPending: isUpdating } = useUpdateCliente()
  const isPending = isCreating || isUpdating

  const form = useForm<InsertCliente>({
    resolver: zodResolver(insertClienteSchema),
    defaultValues: cliente ?? {
      nombre: '',
      situacionFiscal: 'CONSUMIDOR_FINAL',
      tipoDoc: 'DNI',
      cuit: '',
      direccion: '',
      email: '',
      contacto1: '',
      telefono1: '',
      contacto2: '',
      telefono2: '',
      contacto3: '',
      telefono3: '',
    },
  })

  const onSubmit = (data: InsertCliente) => {
    if (cliente) {
      updateCliente({ id: cliente.id, data }, { onSuccess })
    } else {
      createCliente(data, { onSuccess })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
      <div className="space-y-1">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="situacionFiscal">Situación frente al IVA</Label>
        <Select id="situacionFiscal" {...form.register('situacionFiscal')}>
          {Object.entries(SIT_IVA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="tipoDoc">Tipo de documento</Label>
          <Select id="tipoDoc" {...form.register('tipoDoc')}>
            {Object.entries(TIPO_DOC_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="cuit">Número de documento (opcional)</Label>
          <Input id="cuit" {...form.register('cuit')} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="direccion">Dirección (opcional)</Label>
        <Input id="direccion" {...form.register('direccion')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="localidad">Localidad (opcional)</Label>
          <Input id="localidad" {...form.register('localidad')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="provincia">Provincia (opcional)</Label>
          <Input id="provincia" {...form.register('provincia')} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Email (opcional)</Label>
        <Input id="email" type="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Contactos (opcional, hasta 3)</Label>
        {([1, 2, 3] as const).map(n => (
          <div key={n} className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`contacto${n}`} className="text-xs">Contacto {n}</Label>
              <Input id={`contacto${n}`} {...form.register(`contacto${n}`)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`telefono${n}`} className="text-xs">Teléfono {n}</Label>
              <Input id={`telefono${n}`} {...form.register(`telefono${n}`)} />
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
