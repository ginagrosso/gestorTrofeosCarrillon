import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { commitInBatches } from '../../shared/lib/firestore-batch.js'
import { Timestamp } from 'firebase-admin/firestore'
import type { DocumentReference, WriteBatch } from 'firebase-admin/firestore'
import type { Proveedor, InsertProveedor, UpdateProveedor } from './proveedores.schema.js'

export const proveedoresRepository = {

  async findAll(): Promise<Proveedor[]> {
    const snap = await db.collection(COLLECTIONS.PROVEEDORES)
      .where('deletedAt', '==', null)
      .get()

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proveedor))
  },

  async findById(id: string): Promise<Proveedor | null> {
    const doc = await db.collection(COLLECTIONS.PROVEEDORES).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Proveedor
  },

  async create(data: InsertProveedor): Promise<Proveedor> {
    const now = Timestamp.now()
    const ref = await db.collection(COLLECTIONS.PROVEEDORES).add({
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
    const snap = await ref.get()
    return { id: snap.id, ...snap.data() } as Proveedor
  },

  async update(id: string, data: UpdateProveedor): Promise<Proveedor> {
    await db.collection(COLLECTIONS.PROVEEDORES).doc(id).update({
      ...data,
      updatedAt: Timestamp.now(),
    })
    return this.findById(id) as Promise<Proveedor>
  },

  async softDelete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.PROVEEDORES).doc(id).update({
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  },

  /**
   * Crea/actualiza muchos proveedores por nombre en lotes (Firestore WriteBatch).
   * Evita N+1 queries: precarga los existentes con una sola consulta.
   */
  async upsertManyByNombre(items: InsertProveedor[]): Promise<{ creados: number; actualizados: number }> {
    const existentes = await this.findAll()
    const refsByNombre = new Map(
      existentes.map(p => [p.nombre, db.collection(COLLECTIONS.PROVEEDORES).doc(p.id)]),
    )

    const pendientes = new Map<string, { ref: DocumentReference; data: InsertProveedor; creado: boolean }>()
    for (const data of items) {
      const refExistente = pendientes.get(data.nombre)?.ref ?? refsByNombre.get(data.nombre)
      const ref = refExistente ?? db.collection(COLLECTIONS.PROVEEDORES).doc()
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
