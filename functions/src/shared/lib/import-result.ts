import { z } from 'zod'

export const importRequestSchema = z.array(z.unknown())

export type ImportRequest = z.infer<typeof importRequestSchema>

export interface ImportResult {
  creados: number
  actualizados: number
  errores: { fila: number; error: string }[]
}
