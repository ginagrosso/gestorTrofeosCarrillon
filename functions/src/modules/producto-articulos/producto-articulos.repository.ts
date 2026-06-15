import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { AppError } from '../../shared/lib/app-error.js'
import { commitInBatches } from '../../shared/lib/firestore-batch.js'
import { articulosRepository } from '../articulos/articulos.repository.js'
import { Timestamp } from 'firebase-admin/firestore'
import type { WriteBatch } from 'firebase-admin/firestore'
import type { ProductoArticulo, ProductoArticuloItem } from './producto-articulos.schema.js'

// Límite de Firestore para queries con 'in'
const IN_QUERY_LIMIT = 30

export const productoArticulosRepository = {

  async findAll(): Promise<ProductoArticulo[]> {
    const snap = await db.collection(COLLECTIONS.PRODUCTO_ARTICULOS).get()
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductoArticulo))
  },

  async findByProductoId(productoId: string): Promise<ProductoArticulo[]> {
    const snap = await db.collection(COLLECTIONS.PRODUCTO_ARTICULOS)
      .where('productoId', '==', productoId)
      .get()

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductoArticulo))
  },

  async findByArticuloIds(articuloIds: string[]): Promise<ProductoArticulo[]> {
    if (articuloIds.length === 0) return []

    const resultados: ProductoArticulo[] = []
    for (let i = 0; i < articuloIds.length; i += IN_QUERY_LIMIT) {
      const chunk = articuloIds.slice(i, i + IN_QUERY_LIMIT)
      const snap = await db.collection(COLLECTIONS.PRODUCTO_ARTICULOS)
        .where('articuloId', 'in', chunk)
        .get()
      resultados.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductoArticulo)))
    }

    return resultados
  },

  /**
   * Recalcula y persiste precioCosto = SUM(cantidad * articulo.precioCosto)
   * para cada producto, en base a su lista de materiales actual.
   */
  async recalcPrecioCostoForProductos(productoIds: string[]): Promise<void> {
    if (productoIds.length === 0) return

    const now = Timestamp.now()
    const writes: ((batch: WriteBatch) => void)[] = []

    await Promise.all(productoIds.map(async (productoId) => {
      const bom = await this.findByProductoId(productoId)
      const articulos = await articulosRepository.findByIds(bom.map(item => item.articuloId))
      const articulosPorId = new Map(articulos.map(articulo => [articulo.id, articulo]))

      const precioCosto = bom.reduce((sum, item) => {
        return sum + item.cantidad * (articulosPorId.get(item.articuloId)?.precioCosto ?? 0)
      }, 0)

      const ref = db.collection(COLLECTIONS.PRODUCTOS).doc(productoId)
      writes.push(batch => batch.update(ref, { precioCosto, updatedAt: now }))
    }))

    await commitInBatches(writes)
  },

  /**
   * Reemplaza por completo la lista de materiales de un producto y recalcula
   * su precioCosto en una sola transacción atómica.
   */
  async replaceForProducto(
    productoId: string,
    items: ProductoArticuloItem[],
  ): Promise<{ bom: ProductoArticulo[]; precioCosto: number }> {
    return db.runTransaction(async (tx) => {
      const productoRef = db.collection(COLLECTIONS.PRODUCTOS).doc(productoId)
      const bomQuery = db.collection(COLLECTIONS.PRODUCTO_ARTICULOS).where('productoId', '==', productoId)

      const [productoSnap, existingBomSnap] = await Promise.all([
        tx.get(productoRef),
        tx.get(bomQuery),
      ])

      if (!productoSnap.exists || productoSnap.data()?.deletedAt !== null) {
        throw new AppError(404, 'Producto no encontrado')
      }

      const articuloRefs = items.map(item => db.collection(COLLECTIONS.ARTICULOS).doc(item.articuloId))
      const articuloSnaps = articuloRefs.length > 0 ? await tx.getAll(...articuloRefs) : []

      let precioCosto = 0
      articuloSnaps.forEach((snap, index) => {
        const item = items[index]
        if (!snap.exists || snap.data()?.deletedAt !== null) {
          throw new AppError(404, `Artículo no encontrado: ${item.articuloId}`)
        }
        precioCosto += item.cantidad * (snap.data()?.precioCosto ?? 0)
      })

      const now = Timestamp.now()

      for (const doc of existingBomSnap.docs) {
        tx.delete(doc.ref)
      }

      const newRefs = items.map(() => db.collection(COLLECTIONS.PRODUCTO_ARTICULOS).doc())
      items.forEach((item, index) => {
        tx.set(newRefs[index], {
          productoId,
          articuloId: item.articuloId,
          cantidad:   item.cantidad,
          createdAt:  now,
          updatedAt:  now,
        })
      })

      tx.update(productoRef, { precioCosto, updatedAt: now })

      const bom: ProductoArticulo[] = items.map((item, index) => ({
        id:         newRefs[index].id,
        productoId,
        articuloId: item.articuloId,
        cantidad:   item.cantidad,
        createdAt:  now,
        updatedAt:  now,
      }))

      return { bom, precioCosto }
    })
  },
}
