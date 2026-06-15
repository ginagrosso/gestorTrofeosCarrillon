import type { FirestoreTimestamp } from './types'

export function formatFecha(ts: FirestoreTimestamp | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts._seconds * 1000).toLocaleDateString('es-AR')
}
