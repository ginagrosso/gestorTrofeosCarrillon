import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './button'
import { fromImportRow, parseExcelFile, toExportRows, exportToExcel, type ColumnMap } from '@/shared/lib/excel'
import type { ImportResult } from '@/shared/lib/types'

interface ImportarMutation {
  mutateAsync: (registros: Record<string, unknown>[]) => Promise<{ data: ImportResult }>
  isPending: boolean
}

interface ImportExportButtonsProps<T> {
  columns: ColumnMap<T>
  data: T[]
  filename: string
  importMutation: ImportarMutation
}

/** Botones de Importar/Exportar Excel para el header de un ABM. */
export function ImportExportButtons<T>({ columns, data, filename, importMutation }: ImportExportButtonsProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errores, setErrores] = useState<ImportResult['errores']>([])

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    let filas: Record<string, unknown>[]
    try {
      filas = await parseExcelFile(file, columns)
    } catch {
      toast.error('No se pudo leer el archivo. Verificá que sea un Excel válido (.xlsx)')
      return
    }

    const registros = filas.map(fila => fromImportRow(fila, columns))

    try {
      const { data: resultado } = await importMutation.mutateAsync(registros)
      setErrores(resultado.errores)
    } catch {
      setErrores([])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={importMutation.isPending}>
          <Upload />
          {importMutation.isPending ? 'Importando...' : 'Importar'}
        </Button>
        <Button
          variant="outline"
          onClick={() => exportToExcel(toExportRows(data, columns), filename)}
          disabled={data.length === 0}
        >
          <Download />
          Exportar
        </Button>
      </div>

      {errores.length > 0 && (
        <ul className="max-h-40 list-disc overflow-y-auto rounded border border-destructive/50 bg-destructive/5 p-3 pl-8 text-sm text-destructive">
          {errores.map(({ fila, error }) => (
            <li key={fila}>Fila {fila}: {error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
