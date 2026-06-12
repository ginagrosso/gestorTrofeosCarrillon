import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp } from 'firebase-admin/firestore'
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

  async findByNombre(nombre: string): Promise<Proveedor | null> {
    const snap = await db.collection(COLLECTIONS.PROVEEDORES)
      .where('nombre', '==', nombre)
      .where('deletedAt', '==', null)
      .limit(1)
      .get()

    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Proveedor
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

  async upsertByNombre(data: InsertProveedor): Promise<{ proveedor: Proveedor; creado: boolean }> {
    const existente = await this.findByNombre(data.nombre)

    if (existente) {
      return { proveedor: await this.update(existente.id, data), creado: false }
    }

    return { proveedor: await this.create(data), creado: true }
  },
}
