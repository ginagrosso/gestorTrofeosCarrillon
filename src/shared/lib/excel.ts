import * as XLSX from '@e965/xlsx'

export interface ColumnDef<T> {
  header: string
  /** Encabezados alternativos aceptados al importar (ej. nombres usados por el sistema legacy). */
  aliases?: string[]
  export?: (item: T) => string | number
  import?: (value: unknown) => unknown
}

export type ColumnMap<T> = Record<string, ColumnDef<T>>

/** Normaliza un encabezado para que coincidan variantes con/sin tildes, mayúsculas o puntos. */
function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function toExportRows<T>(items: T[], columns: ColumnMap<T>): Record<string, unknown>[] {
  return items.map((item) => {
    const row: Record<string, unknown> = {}
    for (const { header, export: getValue } of Object.values(columns)) {
      if (getValue) row[header] = getValue(item)
    }
    return row
  })
}

export function fromImportRow<T>(row: Record<string, unknown>, columns: ColumnMap<T>): Record<string, unknown> {
  const normalizedRow = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]))

  const result: Record<string, unknown> = {}
  for (const [field, { header, aliases, import: parseValue }] of Object.entries(columns)) {
    if (!parseValue) continue
    const claves = [header, ...(aliases ?? [])].map(normalizeHeader)
    const raw = claves.map(clave => normalizedRow.get(clave)).find(valor => valor !== undefined)
    if (raw === undefined || raw === null) continue
    const value = parseValue(raw)
    if (value !== undefined) result[field] = value
  }
  return result
}

export function exportToExcel(rows: Record<string, unknown>[], filename: string, sheetName = 'Datos'): void {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}

/**
 * Lee la primera hoja de un Excel y la convierte en objetos clave/valor.
 * Detecta automáticamente la fila de encabezados (los exports del sistema legacy
 * incluyen filas de título/vacías antes de los encabezados reales).
 */
export async function parseExcelFile<T>(file: File, columns: ColumnMap<T>): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })

  const encabezadosConocidos = new Set(
    Object.values(columns).flatMap(({ header, aliases }) => [header, ...(aliases ?? [])].map(normalizeHeader)),
  )

  const headerRowIndex = rows.findIndex(row =>
    row.filter(cell => typeof cell === 'string' && encabezadosConocidos.has(normalizeHeader(cell))).length >= 2,
  )
  if (headerRowIndex === -1) throw new Error('No se encontró la fila de encabezados')

  const headers = rows[headerRowIndex].map(cell => (cell === null ? '' : String(cell)))
  return rows.slice(headerRowIndex + 1)
    .filter(row => row.some(cell => cell !== null && cell !== ''))
    .map(row => Object.fromEntries(
      headers.map((header, i) => [header, row[i] ?? null]).filter(([header]) => header !== ''),
    ))
}
