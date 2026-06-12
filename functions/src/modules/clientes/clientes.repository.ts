import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { commitInBatches } from '../../shared/lib/firestore-batch.js'
import { Timestamp } from 'firebase-admin/firestore'
import type { DocumentReference, WriteBatch } from 'firebase-admin/firestore'
import type { Cliente, InsertCliente, UpdateCliente } from './clientes.schema.js'

export const clientesRepository = {

  async findAll(): Promise<Cliente[]> {
    const snap = await db.collection(COLLECTIONS.CLIENTES)
      .where('deletedAt', '==', null)
      .get()

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente))
  },

  async findById(id: string): Promise<Cliente | null> {
    const doc = await db.collection(COLLECTIONS.CLIENTES).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Cliente
  },

  async create(data: InsertCliente): Promise<Cliente> {
    const now = Timestamp.now()
    const ref = await db.collection(COLLECTIONS.CLIENTES).add({
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
    const snap = await ref.get()
    return { id: snap.id, ...snap.data() } as Cliente
  },

  async update(id: string, data: UpdateCliente): Promise<Cliente> {
    await db.collection(COLLECTIONS.CLIENTES).doc(id).update({
      ...data,
      updatedAt: Timestamp.now(),
    })
    return this.findById(id) as Promise<Cliente>
  },

  /**
   * Crea/actualiza muchos clientes por nombre en lotes (Firestore WriteBatch).
   * Evita N+1 queries: precarga los existentes con una sola consulta.
   */
  async upsertManyByNombre(items: InsertCliente[]): Promise<{ creados: number; actualizados: number }> {
    const existentes = await this.findAll()
    const refsByNombre = new Map(
      existentes.map(c => [c.nombre, db.collection(COLLECTIONS.CLIENTES).doc(c.id)]),
    )

    const pendientes = new Map<string, { ref: DocumentReference; data: InsertCliente; creado: boolean }>()
    for (const data of items) {
      const refExistente = pendientes.get(data.nombre)?.ref ?? refsByNombre.get(data.nombre)
      const ref = refExistente ?? db.collection(COLLECTIONS.CLIENTES).doc()
      pendientes.set(data.nombre, { ref, data, creado: !refExistente })
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
