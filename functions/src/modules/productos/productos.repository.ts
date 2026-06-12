import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { commitInBatches } from '../../shared/lib/firestore-batch.js'
import { Timestamp } from 'firebase-admin/firestore'
import type { DocumentReference, WriteBatch } from 'firebase-admin/firestore'
import type { Producto, InsertProducto, UpdateProducto } from './productos.schema.js'

export const productosRepository = {

  async findAll(): Promise<Producto[]> {
    const snap = await db.collection(COLLECTIONS.PRODUCTOS)
      .where('deletedAt', '==', null)
      .get()

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Producto))
  },

  async findById(id: string): Promise<Producto | null> {
    const doc = await db.collection(COLLECTIONS.PRODUCTOS).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Producto
  },

  async create(data: InsertProducto): Promise<Producto> {
    const now = Timestamp.now()
    const ref = await db.collection(COLLECTIONS.PRODUCTOS).add({
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
    const snap = await ref.get()
    return { id: snap.id, ...snap.data() } as Producto
  },

  async update(id: string, data: UpdateProducto): Promise<Producto> {
    await db.collection(COLLECTIONS.PRODUCTOS).doc(id).update({
      ...data,
      updatedAt: Timestamp.now(),
    })
    return this.findById(id) as Promise<Producto>
  },

  /**
   * Crea/actualiza muchos productos por código en lotes (Firestore WriteBatch).
   * Evita N+1 queries: precarga los existentes con una sola consulta.
   */
  async upsertManyByCodigo(items: InsertProducto[]): Promise<{ creados: number; actualizados: number }> {
    const existentes = await this.findAll()
    const refsByCodigo = new Map(
      existentes.map(p => [p.codigo, db.collection(COLLECTIONS.PRODUCTOS).doc(p.id)]),
    )

    const pendientes = new Map<string, { ref: DocumentReference; data: InsertProducto; creado: boolean }>()
    for (const data of items) {
      const refExistente = pendientes.get(data.codigo)?.ref ?? refsByCodigo.get(data.codigo)
      const ref = refExistente ?? db.collection(COLLECTIONS.PRODUCTOS).doc()
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
