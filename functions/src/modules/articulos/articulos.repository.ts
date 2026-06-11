import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp } from 'firebase-admin/firestore'
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

  async findByCodigo(codigo: string): Promise<Articulo | null> {
    const snap = await db.collection(COLLECTIONS.ARTICULOS)
      .where('codigo', '==', codigo)
      .where('deletedAt', '==', null)
      .limit(1)
      .get()

    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Articulo
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

  async upsertByCodigo(data: InsertArticulo): Promise<{ articulo: Articulo; creado: boolean }> {
    const existente = await this.findByCodigo(data.codigo)

    if (existente) {
      return { articulo: await this.update(existente.id, data), creado: false }
    }

    return { articulo: await this.create(data), creado: true }
  },
}
