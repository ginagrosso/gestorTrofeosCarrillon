import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import type { Compra, CompraConItems, CompraItem, InsertCompra } from './compras.schema.js'

export const comprasRepository = {

  async findAll(): Promise<Compra[]> {
    const snap = await db.collection(COLLECTIONS.COMPRAS)
      .where('deletedAt', '==', null)
      .get()

    // Orden descendente client-side para no requerir un índice compuesto en Firestore
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Compra))
    return docs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
  },

  async findById(id: string): Promise<Compra | null> {
    const doc = await db.collection(COLLECTIONS.COMPRAS).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Compra
  },

  async findItemsByCompraId(compraId: string): Promise<CompraItem[]> {
    const snap = await db.collection(COLLECTIONS.COMPRA_ITEMS)
      .where('compraId', '==', compraId)
      .get()
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompraItem))
  },

  async findByIdConItems(id: string): Promise<CompraConItems | null> {
    const compra = await this.findById(id)
    if (!compra) return null
    const items = await this.findItemsByCompraId(id)
    return { ...compra, items }
  },

  async create(data: InsertCompra): Promise<CompraConItems> {
    const now = Timestamp.now()
    const total = data.items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0)

    const compraRef = db.collection(COLLECTIONS.COMPRAS).doc()
    const compraId = compraRef.id
    const batch = db.batch()

    batch.set(compraRef, {
      proveedorId:    data.proveedorId,
      nroComprobante: data.nroComprobante ?? null,
      total,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    const createdItems: CompraItem[] = data.items.map(item => {
      const itemRef = db.collection(COLLECTIONS.COMPRA_ITEMS).doc()
      batch.set(itemRef, {
        compraId,
        articuloId:     item.articuloId,
        cantidad:       item.cantidad,
        precioUnitario: item.precioUnitario,
      })
      const articuloRef = db.collection(COLLECTIONS.ARTICULOS).doc(item.articuloId)
      batch.update(articuloRef, { stock: FieldValue.increment(item.cantidad), updatedAt: now })

      return {
        id:             itemRef.id,
        compraId,
        articuloId:     item.articuloId,
        cantidad:       item.cantidad,
        precioUnitario: item.precioUnitario,
      }
    })

    await batch.commit()

    return {
      id:             compraId,
      proveedorId:    data.proveedorId,
      nroComprobante: data.nroComprobante,
      total,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      items:     createdItems,
    }
  },

  async softDelete(id: string): Promise<void> {
    const items = await this.findItemsByCompraId(id)
    const now = Timestamp.now()
    const batch = db.batch()

    batch.update(db.collection(COLLECTIONS.COMPRAS).doc(id), { deletedAt: now, updatedAt: now })

    for (const item of items) {
      batch.update(db.collection(COLLECTIONS.ARTICULOS).doc(item.articuloId), {
        stock: FieldValue.increment(-item.cantidad),
        updatedAt: now,
      })
    }

    await batch.commit()
  },
}
