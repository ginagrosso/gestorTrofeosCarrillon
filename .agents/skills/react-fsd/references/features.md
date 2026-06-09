# Features — Acciones de usuario

Cada feature encapsula una acción completa: sus hooks de React Query, su form, su lógica.

## Estructura de un feature

```
features/articulos/
├── hooks/
│   ├── useArticulos.ts          # useQuery lista
│   ├── useArticulo.ts           # useQuery detalle
│   └── useArticulosMutations.ts # useMutation crear/editar/borrar/precios
├── ui/
│   ├── ArticuloForm.tsx         # formulario crear/editar
│   └── ActualizarPreciosModal.tsx
└── index.ts                     # exports públicos del feature
```

## Hooks de React Query

```ts
// features/articulos/hooks/useArticulos.ts
import { useQuery } from '@tanstack/react-query'
import { articulosApi } from '@/shared/api/articulos.api'

export const useArticulos = (proveedorId?: string) =>
  useQuery({
    queryKey: ['articulos', { proveedorId }],
    queryFn:  () => articulosApi.list({ proveedorId }),
    select:   res => res.data,
  })
```

```ts
// features/articulos/hooks/useArticulosMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { articulosApi } from '@/shared/api/articulos.api'
import { toast } from 'sonner'

export const useCreateArticulo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: articulosApi.create,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['articulos'] })
      toast.success('Artículo creado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useActualizarPrecios = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ proveedorId, porcentaje }: { proveedorId: string; porcentaje: number }) =>
      articulosApi.actualizarPreciosMasivo(proveedorId, porcentaje),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['articulos'] })
      toast.success(`${res.data.actualizados} artículos actualizados`)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
```

## Formulario con React Hook Form + Zod

```ts
// features/articulos/ui/ArticuloForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { insertArticuloSchema, type InsertArticulo } from '@/shared/lib/types'
import { useCreateArticulo } from '../hooks/useArticulosMutations'

export default function ArticuloForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateArticulo()

  const form = useForm<InsertArticulo>({
    resolver: zodResolver(insertArticuloSchema),
  })

  const onSubmit = (data: InsertArticulo) =>
    mutate(data, { onSuccess })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* campos con form.register y form.formState.errors */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
```
