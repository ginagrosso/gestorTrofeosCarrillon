import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { commitInBatches } from '../../shared/lib/firestore-batch.js'
import { Timestamp } from 'firebase-admin/firestore'
import type { DocumentReference, WriteBatch } from 'firebase-admin/firestore'
import type { Articulo, InsertArticulo, UpdateArticulo } from './articulos.schema.js'

export const articulosRepository = {

  async findAll(): Promise<Articulo[]> {
    const snap = await db.collection(COLLECTIONS.ARTICULOS)
      .where('deletedAt', '==', null)
      .get()

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Articulo))
  },

  async findById(id: string): Promise<Articulo | null> {
    const doc = await db.collection(COLLECTIONS.ARTICULOS).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Articulo
  },

  async create(data: InsertArticulo): Promise<Articulo> {
    const now = Timestamp.now()
    const ref = await db.collection(COLLECTIONS.ARTICULOS).add({
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
    const snap = await ref.get()
    return { id: snap.id, ...snap.data() } as Articulo
  },

  async update(id: string, data: UpdateArticulo): Promise<Articulo> {
    await db.collection(COLLECTIONS.ARTICULOS).doc(id).update({
      ...data,
      updatedAt: Timestamp.now(),
    })
    return this.findById(id) as Promise<Articulo>
  },

  /**
   * Crea/actualiza muchos artículos por código en lotes (Firestore WriteBatch).
   * Evita N+1 queries: precarga los existentes con una sola consulta.
   */
  async upsertManyByCodigo(items: InsertArticulo[]): Promise<{ creados: number; actualizados: number }> {
    const existentes = await this.findAll()
    const refsByCodigo = new Map(
      existentes.map(a => [a.codigo, db.collection(COLLECTIONS.ARTICULOS).doc(a.id)]),
    )

    const pendientes = new Map<string, { ref: DocumentReference; data: InsertArticulo; creado: boolean }>()
    for (const data of items) {
      const refExistente = pendientes.get(data.codigo)?.ref ?? refsByCodigo.get(data.codigo)
      const ref = refExistente ?? db.collection(COLLECTIONS.ARTICULOS).doc()
      pendientes.set(data.codigo, { ref, data, creado: !refExistente })
    }

    const now = Timestamp.now()
    let creados = 0
    let actualizados = 0
    const writes: ((batch: WriteBatch) => void)[] = []

    for (const { ref, data, creado } of pendientes.values()) {
      if (creado) {
        creados++
        writes.push(batch => batch.set(ref, { ...data, createdAt: now, updatedAt: now, deletedAt: null }))
      } else {
        actualizados++
        writes.push(batch => batch.update(ref, { ...data, updatedAt: now }))
      }
    }

    await commitInBatches(writes)
    return { creados, actualizados }
  },
}
