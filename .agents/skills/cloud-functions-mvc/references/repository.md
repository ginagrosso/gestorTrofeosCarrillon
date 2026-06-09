# Repository — Acceso a Firestore

Solo acceso a datos. Sin lógica de negocio.

```ts
// modules/articulos/articulos.repository.ts
import { db } from '../../shared/lib/firebase-admin'
import { COLLECTIONS } from '../../shared/lib/collections'
import { Timestamp } from 'firebase-admin/firestore'
import type { Articulo, InsertArticulo, UpdateArticulo } from './articulos.schema'

export const articulosRepository = {

  async findAll(proveedorId?: string): Promise<Articulo[]> {
    let query = db.collection(COLLECTIONS.ARTICULOS)
      .where('deletedAt', '==', null)

    if (proveedorId) {
      query = query.where('proveedorId', '==', proveedorId)
    }

    const snap = await query.get()
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

  async softDelete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.ARTICULOS).doc(id).update({
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  },

  // Actualización masiva de precios por proveedor
  async updatePreciosByProveedor(proveedorId: string, porcentaje: number): Promise<number> {
    const snap = await db.collection(COLLECTIONS.ARTICULOS)
      .where('proveedorId', '==', proveedorId)
      .where('deletedAt', '==', null)
      .get()

    const batch = db.batch()
    const now = Timestamp.now()
    const factor = 1 + porcentaje / 100

    snap.docs.forEach(doc => {
      const precioActual = doc.data().precioUnitario as number
      batch.update(doc.ref, {
        precioUnitario: parseFloat((precioActual * factor).toFixed(2)),
        updatedAt: now,
      })
    })

    await batch.commit()
    return snap.size
  },
}
```
