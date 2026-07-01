import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp } from 'firebase-admin/firestore'
import type { Empresa, InsertEmpresa, UpdateEmpresa } from './empresas.schema.js'

export const empresasRepository = {

  async findAll(): Promise<Empresa[]> {
    const snap = await db.collection(COLLECTIONS.EMPRESAS)
      .where('deletedAt', '==', null)
      .get()

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Empresa))
  },

  async findById(id: string): Promise<Empresa | null> {
    const doc = await db.collection(COLLECTIONS.EMPRESAS).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Empresa
  },

  async create(data: InsertEmpresa): Promise<Empresa> {
    const now = Timestamp.now()
    const ref = await db.collection(COLLECTIONS.EMPRESAS).add({
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
    const snap = await ref.get()
    return { id: snap.id, ...snap.data() } as Empresa
  },

  async update(id: string, data: UpdateEmpresa): Promise<Empresa> {
    await db.collection(COLLECTIONS.EMPRESAS).doc(id).update({
      ...data,
      updatedAt: Timestamp.now(),
    })
    return this.findById(id) as Promise<Empresa>
  },

  async softDelete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.EMPRESAS).doc(id).update({
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  },
}
