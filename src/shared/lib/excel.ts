import * as XLSX from '@e965/xlsx'
import XLSXStyle from 'xlsx-js-style'

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

// Colores de la marca
const COLOR_HEADER_BG  = '7B4A2D' // marrón
const COLOR_HEADER_FG  = 'FFFFFF' // blanco
const COLOR_ROW_ODD    = 'F5EFE0' // crema (brand cream)
const COLOR_ROW_EVEN   = 'FFFFFF' // blanco
const COLOR_BORDER     = 'D6C4A8' // marrón claro para bordes

function makeBorder() {
  const side = { style: 'thin', color: { rgb: COLOR_BORDER } }
  return { top: side, bottom: side, left: side, right: side }
}

function makeCell(value: string | number, style: object): object {
  const t = typeof value === 'number' ? 'n' : 's'
  return { v: value, t, s: style }
}

export function exportToExcel(rows: Record<string, unknown>[], filename: string, sheetName = 'Datos'): void {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  const numCols = headers.length
  const numRows = rows.length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws: Record<string, any> = {}

  // Encabezados
  headers.forEach((header, c) => {
    ws[XLSXStyle.utils.encode_cell({ r: 0, c })] = makeCell(header, {
      fill: { patternType: 'solid', fgColor: { rgb: COLOR_HEADER_BG } },
      font: { bold: true, color: { rgb: COLOR_HEADER_FG }, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
      border: makeBorder(),
    })
  })

  // Filas de datos
  rows.forEach((row, rowIdx) => {
    const bgColor = rowIdx % 2 === 0 ? COLOR_ROW_EVEN : COLOR_ROW_ODD
    headers.forEach((header, c) => {
      const raw = row[header]
      const value = raw === null || raw === undefined ? '' : (raw as string | number)
      ws[XLSXStyle.utils.encode_cell({ r: rowIdx + 1, c })] = makeCell(value, {
        fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
        font: { sz: 10 },
        border: makeBorder(),
      })
    })
  })

  ws['!ref'] = XLSXStyle.utils.encode_range({ r: 0, c: 0 }, { r: numRows, c: numCols - 1 })

  // Anchos de columna automáticos
  ws['!cols'] = headers.map((header) => {
    const maxLen = Math.max(
      header.length,
      ...rows.map(row => String(row[header] ?? '').length),
    )
    return { wch: Math.min(Math.max(maxLen + 2, 10), 60) }
  })

  const wb = XLSXStyle.utils.book_new()
  XLSXStyle.utils.book_append_sheet(wb, ws, sheetName)
  XLSXStyle.writeFile(wb, filename)
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

  // Algunas columnas del legacy no tienen encabezado de texto (ej. Rubro/Subrubro
  // en exportacionProductosCarrillon.xls): se referencian por posición ("Columna N").
  const headers = rows[headerRowIndex].map((cell, i) => (
    cell === null || cell === '' ? `Columna ${i + 1}` : String(cell)
  ))
  return rows.slice(headerRowIndex + 1)
    .filter(row => row.some(cell => cell !== null && cell !== ''))
    .map(row => Object.fromEntries(
      headers.map((header, i) => [header, row[i] ?? null]),
    ))
}
