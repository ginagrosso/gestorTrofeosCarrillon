import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { insertProductoSchema, type InsertProducto, type UpdateProducto, type Producto } from '@/shared/lib/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { MoneyInput } from '@/shared/ui/money-input'
import { NumberInput } from '@/shared/ui/number-input'
import { formatMoney } from '@/shared/lib/money'
import { useProductos } from '../hooks/useProductos'
import { useProductoArticulos } from '../hooks/useProductoArticulos'
import { useCreateProducto, useUpdateProducto } from '../hooks/useProductosMutations'
import ProductoArticulosForm from './ProductoArticulosForm'

// El cliente no trabaja con decimales en los precios: se truncan (no se redondean).
const truncar = (value: number) => Math.trunc(value)

interface ProductoFormProps {
  producto?: Producto
  onSuccess: (producto?: Producto) => void
}

export default function ProductoForm({ producto, onSuccess }: ProductoFormProps) {
  const { mutate: createProducto, isPending: isCreating } = useCreateProducto()
  const { mutate: updateProducto, isPending: isUpdating } = useUpdateProducto()
  const { data: productos } = useProductos()
  const { data: bom } = useProductoArticulos(producto?.id)
  const hasBom = (bom?.length ?? 0) > 0
  const bomTotal = truncar((bom ?? []).reduce((sum, item) => sum + item.cantidad * (item.articulo?.precioCosto ?? 0), 0))
  const isPending = isCreating || isUpdating
  const categoriaOptions = [...new Set((productos ?? []).map(p => p.categoria).filter((c): c is string => !!c))].sort()
  const subcategoriaOptions = [...new Set((productos ?? []).map(p => p.subcategoria).filter((c): c is string => !!c))].sort()

  const form = useForm<z.input<typeof insertProductoSchema>, unknown, InsertProducto>({
    resolver: zodResolver(insertProductoSchema),
    defaultValues: producto ?? {
      codigo: '',
      descripcion: '',
      precioCosto: 0,
      porcIva: 21,
      precioVenta: 0,
      stockActual: 0,
      categoria: '',
      subcategoria: '',
    },
  })

  const precioCostoActual = form.watch('precioCosto') ?? 0

  const [recargo, setRecargo] = useState(() => {
    if (producto && producto.precioCosto > 0 && producto.precioVenta > producto.precioCosto) {
      return Math.round(((producto.precioVenta / producto.precioCosto) - 1) * 100 * 100) / 100
    }
    return 0
  })

  const handleRecargoChange = (value: number) => {
    setRecargo(value)
    form.setValue('precioVenta', truncar(precioCostoActual * (1 + value / 100)), { shouldValidate: true })
  }

  // Si la lista de materiales recalculó el costo (al guardarla recién o por
  // cambios de precio en sus artículos), sincronizamos precioCosto y
  // recalculamos precioVenta con el recargo actual.
  useEffect(() => {
    if (!hasBom) return
    if (bomTotal === form.getValues('precioCosto')) return
    form.setValue('precioCosto', bomTotal)
    form.setValue('precioVenta', truncar(bomTotal * (1 + recargo / 100)), { shouldValidate: true })
  }, [hasBom, bomTotal, recargo, form])

  const onSubmit = (data: InsertProducto) => {
    if (!producto) {
      createProducto(data, { onSuccess: (res) => onSuccess(res.data) })
      return
    }
    // Si tiene lista de materiales, precioCosto es calculado: no se envía (queda fuera del JSON).
    const payload: UpdateProducto = hasBom ? { ...data, precioCosto: undefined } : data
    updateProducto({ id: producto.id, data: payload }, { onSuccess: () => onSuccess() })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">

      {/* — Identificación — */}
      <div className="space-y-1">
        <Label htmlFor="codigo">Código</Label>
        <Input id="codigo" {...form.register('codigo')} />
        {form.formState.errors.codigo && (
          <p className="text-sm text-destructive">{form.formState.errors.codigo.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input id="descripcion" {...form.register('descripcion')} />
        {form.formState.errors.descripcion && (
          <p className="text-sm text-destructive">{form.formState.errors.descripcion.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="porcIva">% IVA</Label>
          <Controller
            name="porcIva"
            control={form.control}
            render={({ field }) => (
              <NumberInput id="porcIva" value={field.value} onChange={field.onChange} />
            )}
          />
          {form.formState.errors.porcIva && (
            <p className="text-sm text-destructive">{form.formState.errors.porcIva.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="stockActual">Stock</Label>
          <Controller
            name="stockActual"
            control={form.control}
            render={({ field }) => (
              <NumberInput id="stockActual" value={field.value} onChange={field.onChange} allowDecimals={false} />
            )}
          />
          {form.formState.errors.stockActual && (
            <p className="text-sm text-destructive">{form.formState.errors.stockActual.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="categoria">Categoría (opcional)</Label>
          <Input id="categoria" list="categoria-options" {...form.register('categoria')} />
          <datalist id="categoria-options">
            {categoriaOptions.map(opcion => <option key={opcion} value={opcion} />)}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="subcategoria">Subcategoría (opcional)</Label>
          <Input id="subcategoria" list="subcategoria-options" {...form.register('subcategoria')} />
          <datalist id="subcategoria-options">
            {subcategoriaOptions.map(opcion => <option key={opcion} value={opcion} />)}
          </datalist>
        </div>
      </div>

      {/* — Lista de materiales y precios: solo al editar (después de crear el producto) — */}
      {producto && (
        <>
          <ProductoArticulosForm key={producto.id} productoId={producto.id} />

          {!hasBom && (
            <div className="space-y-1">
              <Label htmlFor="precioCosto">Precio Costo</Label>
              <Controller
                name="precioCosto"
                control={form.control}
                render={({ field }) => (
                  <MoneyInput id="precioCosto" value={field.value ?? 0} onChange={field.onChange} allowDecimals={false} />
                )}
              />
              {form.formState.errors.precioCosto && (
                <p className="text-sm text-destructive">{form.formState.errors.precioCosto.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="recargo">Recargo %</Label>
              <NumberInput
                id="recargo"
                value={recargo}
                onChange={v => handleRecargoChange(v ?? 0)}
              />
              <p className="text-sm text-muted-foreground">Costo: ${formatMoney(precioCostoActual)}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="precioVenta">Precio Venta</Label>
              <Controller
                name="precioVenta"
                control={form.control}
                render={({ field }) => (
                  <MoneyInput id="precioVenta" value={field.value ?? 0} onChange={field.onChange} allowDecimals={false} />
                )}
              />
              <p className="text-sm text-muted-foreground">Se calcula con el Recargo %, podés editarlo a mano</p>
              {form.formState.errors.precioVenta && (
                <p className="text-sm text-destructive">{form.formState.errors.precioVenta.message}</p>
              )}
            </div>
          </div>
        </>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
