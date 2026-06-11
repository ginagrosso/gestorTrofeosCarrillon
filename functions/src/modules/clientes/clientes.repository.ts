import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp } from 'firebase-admin/firestore'
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

  async findByNombre(nombre: string): Promise<Cliente | null> {
    const snap = await db.collection(COLLECTIONS.CLIENTES)
      .where('nombre', '==', nombre)
      .where('deletedAt', '==', null)
      .limit(1)
      .get()

    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Cliente
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

  async upsertByNombre(data: InsertCliente): Promise<{ cliente: Cliente; creado: boolean }> {
    const existente = await this.findByNombre(data.nombre)

    if (existente) {
      return { cliente: await this.update(existente.id, data), creado: false }
    }

    return { cliente: await this.create(data), creado: true }
  },
}
