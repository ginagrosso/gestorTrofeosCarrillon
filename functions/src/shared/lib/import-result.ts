export interface ImportResult {
  creados: number
  actualizados: number
  errores: { fila: number; error: string }[]
}
