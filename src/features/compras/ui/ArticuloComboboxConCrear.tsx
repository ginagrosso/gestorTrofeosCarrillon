import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { MoneyInput } from '@/shared/ui/money-input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command'
import type { Articulo, InsertArticulo } from '@/shared/lib/types'
import { useCreateArticulo } from '@/features/articulos'

interface Props {
  proveedorId: string
  articulosPorProveedor: Articulo[]
  value: string
  onChange: (articuloId: string, precioCosto: number) => void
}

export function ArticuloComboboxConCrear({ proveedorId, articulosPorProveedor, value, onChange }: Props) {
  const [open, setOpen] = React.useState(false)
  const [crearMode, setCrearMode] = React.useState(false)
  const [codigo, setCodigo] = React.useState('')
  const [descripcion, setDescripcion] = React.useState('')
  const [precioCosto, setPrecioCosto] = React.useState(0)
  const { mutate: createArticulo, isPending } = useCreateArticulo()

  const selected = articulosPorProveedor.find(a => a.id === value)

  const resetCrearForm = () => {
    setCodigo('')
    setDescripcion('')
    setPrecioCosto(0)
    setCrearMode(false)
  }

  const handleCrear = () => {
    const data: InsertArticulo = {
      codigo:      codigo.trim(),
      descripcion: descripcion.trim(),
      precioCosto,
      porcIva:     21,
      precioVenta: 0,
      proveedorId,
      unidad:      'unidad',
      stock:       0,
    }
    createArticulo(data, {
      onSuccess: (res) => {
        onChange(res.data.id, res.data.precioCosto)
        setOpen(false)
        resetCrearForm()
      },
    })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) resetCrearForm()
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={!proveedorId}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? `${selected.codigo} — ${selected.descripcion}` : 'Seleccionar artículo...'}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        onInteractOutside={crearMode ? (e) => e.preventDefault() : undefined}
      >
        {crearMode ? (
          <div className="flex flex-col gap-3 p-3">
            <p className="text-sm font-medium">Nuevo artículo</p>
            <div className="space-y-1">
              <Label htmlFor="nuevo-codigo">Código</Label>
              <Input
                id="nuevo-codigo"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nuevo-descripcion">Descripción</Label>
              <Input
                id="nuevo-descripcion"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nuevo-precio">Precio Costo</Label>
              <MoneyInput id="nuevo-precio" value={precioCosto} onChange={setPrecioCosto} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={resetCrearForm}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!codigo.trim() || !descripcion.trim() || isPending}
                onClick={handleCrear}
              >
                {isPending ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="Buscar artículo..." />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup>
                {articulosPorProveedor.map(articulo => (
                  <CommandItem
                    key={articulo.id}
                    value={`${articulo.codigo} ${articulo.descripcion}`}
                    onSelect={() => {
                      onChange(articulo.id, articulo.precioCosto)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn('size-4', articulo.id === value ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate">{articulo.codigo} — {articulo.descripcion}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  value="__crear_nuevo__"
                  onSelect={() => setCrearMode(true)}
                >
                  <Plus className="size-4" />
                  Crear artículo nuevo
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
