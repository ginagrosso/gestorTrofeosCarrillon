import { db } from './firebase-admin.js'
import type { WriteBatch } from 'firebase-admin/firestore'

const BATCH_LIMIT = 500

/** Ejecuta escrituras en lotes de hasta 500 operaciones (límite de WriteBatch en Firestore). */
export async function commitInBatches(writes: ((batch: WriteBatch) => void)[]): Promise<void> {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch()
    writes.slice(i, i + BATCH_LIMIT).forEach(write => write(batch))
    await batch.commit()
  }
}
