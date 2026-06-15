import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { replaceProductoArticulosSchema, type ReplaceProductoArticulos, type ProductoArticulo, type Articulo } from '@/shared/lib/types'
import { formatMoney } from '@/shared/lib/money'
import { useArticulos } from '@/features/articulos'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Combobox } from '@/shared/ui/combobox'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { useProductoArticulos } from '../hooks/useProductoArticulos'
import { useReplaceProductoArticulos } from '../hooks/useProductosMutations'

interface ProductoArticulosFormProps {
  productoId: string
}

export default function ProductoArticulosForm({ productoId }: ProductoArticulosFormProps) {
  const { data: bom, isLoading } = useProductoArticulos(productoId)
  const { data: articulos } = useArticulos()

  if (isLoading || !bom) {
    return <Skeleton className="h-32 w-full" />
  }

  return <ProductoArticulosEditor productoId={productoId} bom={bom} articulos={articulos ?? []} />
}

interface ProductoArticulosEditorProps {
  productoId: string
  bom: ProductoArticulo[]
  articulos: Articulo[]
}

function ProductoArticulosEditor({ productoId, bom, articulos }: ProductoArticulosEditorProps) {
  const { mutate: replaceBom, isPending } = useReplaceProductoArticulos(productoId)
  const [selectedArticulo, setSelectedArticulo] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  const articuloOptions = articulos.map(articulo => ({ value: articulo.id, label: `${articulo.codigo} - ${articulo.descripcion}` }))
  const articulosPorId = new Map(articulos.map(articulo => [articulo.id, articulo]))

  const form = useForm<ReplaceProductoArticulos>({
    resolver: zodResolver(replaceProductoArticulosSchema),
    defaultValues: {
      items: bom.map(item => ({ articuloId: item.articuloId, cantidad: item.cantidad })),
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const items = form.watch('items')

  const handleAdd = () => {
    if (!selectedArticulo) return
    if (fields.some(field => field.articuloId === selectedArticulo)) {
      setDuplicateError('El artículo ya está en la lista de materiales')
      return
    }
    setDuplicateError(null)
    append({ articuloId: selectedArticulo, cantidad })
    setSelectedArticulo('')
    setCantidad(1)
  }

  const total = items.reduce((sum, item) => {
    const articulo = articulosPorId.get(item.articuloId)
    return sum + (articulo?.precioCosto ?? 0) * (item.cantidad || 0)
  }, 0)

  const onSubmit = (data: ReplaceProductoArticulos) => {
    replaceBom(data)
  }

  return (
    <div className="flex flex-col gap-4 border-t pt-4">
      <h3 className="font-semibold text-brand-brown">Lista de materiales</h3>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label>Artículo</Label>
          <Combobox
            value={selectedArticulo}
            onChange={setSelectedArticulo}
            options={articuloOptions}
            placeholder="Seleccionar artículo..."
            searchPlaceholder="Buscar artículo..."
            emptyText="No se encontró el artículo."
          />
        </div>
        <div className="w-24 space-y-1">
          <Label>Cantidad</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={cantidad}
            onChange={e => setCantidad(Number(e.target.value))}
          />
        </div>
        <Button type="button" onClick={handleAdd}>Agregar</Button>
      </div>
      {duplicateError && <p className="text-sm text-destructive">{duplicateError}</p>}

      {fields.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const articulo = articulosPorId.get(field.articuloId)
              const cantidadActual = items[index]?.cantidad || 0
              const subtotal = (articulo?.precioCosto ?? 0) * cantidadActual
              return (
                <TableRow key={field.id}>
                  <TableCell>{articulo ? `${articulo.codigo} - ${articulo.descripcion}` : '—'}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      className="text-right"
                      {...form.register(`items.${index}.cantidad`, { valueAsNumber: true })}
                    />
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(articulo?.precioCosto ?? 0)}</TableCell>
                  <TableCell className="text-right">{formatMoney(subtotal)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}>
                      <Trash2 />
                      <span className="sr-only">Quitar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <div className="text-right font-semibold">Costo total: {formatMoney(total)}</div>

      <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar lista de materiales'}
      </Button>
    </div>
  )
}
