import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  insertProveedorSchema,
  type InsertProveedor,
  type Proveedor,
  SIT_IVA_LABELS,
  RUBRO_PROVEEDOR_LABELS,
} from '@/shared/lib/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { useCreateProveedor, useUpdateProveedor } from '../hooks/useProveedoresMutations'

interface ProveedorFormProps {
  proveedor?: Proveedor
  onSuccess: () => void
}

export default function ProveedorForm({ proveedor, onSuccess }: ProveedorFormProps) {
  const { mutate: createProveedor, isPending: isCreating } = useCreateProveedor()
  const { mutate: updateProveedor, isPending: isUpdating } = useUpdateProveedor()
  const isPending = isCreating || isUpdating

  const form = useForm<InsertProveedor>({
    resolver: zodResolver(insertProveedorSchema),
    defaultValues: proveedor ?? {
      nombre: '',
      contacto: '',
      localidad: '',
      direccion: '',
      cuit: '',
      sitIva: 'RESPONSABLE_INSCRIPTO',
      telefono1: '',
      telefono2: '',
      rubro: 'AUTOPARTES',
    },
  })

  const onSubmit = (data: InsertProveedor) => {
    if (proveedor) {
      updateProveedor({ id: proveedor.id, data }, { onSuccess })
    } else {
      createProveedor(data, { onSuccess })
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
        <Label htmlFor="contacto">Contacto</Label>
        <Input id="contacto" {...form.register('contacto')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="localidad">Localidad</Label>
        <Input id="localidad" {...form.register('localidad')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" {...form.register('direccion')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cuit">CUIT</Label>
        <Input id="cuit" {...form.register('cuit')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="sitIva">Situación frente al IVA</Label>
        <Select id="sitIva" {...form.register('sitIva')}>
          {Object.entries(SIT_IVA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="telefono1">Teléfono 1</Label>
          <Input id="telefono1" {...form.register('telefono1')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="telefono2">Teléfono 2</Label>
          <Input id="telefono2" {...form.register('telefono2')} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="rubro">Rubro</Label>
        <Select id="rubro" {...form.register('rubro')}>
          {Object.entries(RUBRO_PROVEEDOR_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
