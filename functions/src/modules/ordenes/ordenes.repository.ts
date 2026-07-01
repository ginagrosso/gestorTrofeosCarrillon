import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { calcEstado } from './ordenes.schema.js'
import type { InsertOrden, Orden, OrdenConItems, OrdenItem, UpdateOrdenPago } from './ordenes.schema.js'

export const ordenesRepository = {

  async findAll(): Promise<Orden[]> {
    const snap = await db.collection(COLLECTIONS.ORDENES)
      .where('deletedAt', '==', null)
      .get()
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Orden))
    return docs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
  },

  async findById(id: string): Promise<Orden | null> {
    const doc = await db.collection(COLLECTIONS.ORDENES).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Orden
  },

  async findItemsByOrdenId(ordenId: string): Promise<OrdenItem[]> {
    const snap = await db.collection(COLLECTIONS.ORDEN_ITEMS)
      .where('ordenId', '==', ordenId)
      .get()
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrdenItem))
  },

  async findByIdConItems(id: string): Promise<OrdenConItems | null> {
    const orden = await this.findById(id)
    if (!orden) return null
    const items = await this.findItemsByOrdenId(id)
    return { ...orden, items }
  },

  async create(data: InsertOrden): Promise<OrdenConItems> {
    const now = Timestamp.now()
    const total = data.items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0)
    const montoEntrega = data.montoEntrega ?? 0
    const saldo = total - montoEntrega
    const estado = calcEstado(montoEntrega, total)

    const counterRef = db.collection('counters').doc('ordenes')
    const ordenRef   = db.collection(COLLECTIONS.ORDENES).doc()
    const ordenId    = ordenRef.id
    let numero = 0

    await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef)
      numero = ((counterSnap.exists ? counterSnap.data()?.ultimo : 0) ?? 0) + 1
      tx.set(counterRef, { ultimo: numero }, { merge: true })
      tx.set(ordenRef, {
        numero,
        fechaPrometida:   data.fechaPrometida,
        clienteId:        data.clienteId ?? null,
        clienteNombre:    data.clienteNombre,
        clienteTelefono:  data.clienteTelefono ?? null,
        clienteLocalidad: data.clienteLocalidad ?? null,
        clienteCuit:      data.clienteCuit ?? null,
        condVenta:        data.condVenta,
        formaPago:        data.formaPago ?? null,
        reciboNumero:     data.reciboNumero ?? null,
        facturaNumero:    data.facturaNumero ?? null,
        montoEntrega,
        total,
        saldo,
        estado,
        presupuestoId:    data.presupuestoId ?? null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
    })

    const batch = db.batch()
    const createdItems: OrdenItem[] = data.items.map(item => {
      const itemRef  = db.collection(COLLECTIONS.ORDEN_ITEMS).doc()
      const subtotal = item.cantidad * item.precioUnitario
      batch.set(itemRef, {
        ordenId,
        productoId:     item.productoId,
        cantidad:       item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal,
      })
      batch.update(db.collection(COLLECTIONS.PRODUCTOS).doc(item.productoId), {
        stockActual: FieldValue.increment(-item.cantidad),
        updatedAt:   now,
      })
      return {
        id:             itemRef.id,
        ordenId,
        productoId:     item.productoId,
        cantidad:       item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal,
      }
    })

    // Decrementar stock de los artículos que componen cada producto (BOM)
    const bomSnapshots = await Promise.all(
      data.items.map(item =>
        db.collection(COLLECTIONS.PRODUCTO_ARTICULOS)
          .where('productoId', '==', item.productoId)
          .get()
          .then(snap => ({ cantidadOrden: item.cantidad, docs: snap.docs }))
      )
    )
    for (const { cantidadOrden, docs } of bomSnapshots) {
      for (const bomDoc of docs) {
        const { articuloId, cantidad: cantidadBom } = bomDoc.data() as { articuloId: string; cantidad: number }
        batch.update(db.collection(COLLECTIONS.ARTICULOS).doc(articuloId), {
          stock:     FieldValue.increment(-(cantidadBom * cantidadOrden)),
          updatedAt: now,
        })
      }
    }

    await batch.commit()

    return {
      id: ordenId,
      numero,
      fechaPrometida:   data.fechaPrometida,
      clienteId:        data.clienteId ?? null,
      clienteNombre:    data.clienteNombre,
      clienteTelefono:  data.clienteTelefono ?? null,
      clienteLocalidad: data.clienteLocalidad ?? null,
      clienteCuit:      data.clienteCuit ?? null,
      condVenta:        data.condVenta,
      formaPago:        data.formaPago ?? null,
      reciboNumero:     data.reciboNumero ?? null,
      facturaNumero:    data.facturaNumero ?? null,
      montoEntrega,
      total,
      saldo,
      estado,
      presupuestoId:    data.presupuestoId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      items: createdItems,
    }
  },

  async updatePago(id: string, data: UpdateOrdenPago): Promise<Orden> {
    const docRef  = db.collection(COLLECTIONS.ORDENES).doc(id)
    const docSnap = await docRef.get()
    const total        = (docSnap.data()!.total) as number
    const montoEntrega = data.montoEntrega
    const saldo        = total - montoEntrega
    const estado       = calcEstado(montoEntrega, total)
    const now          = Timestamp.now()

    await docRef.update({
      montoEntrega,
      formaPago:     data.formaPago,
      reciboNumero:  data.reciboNumero ?? null,
      facturaNumero: data.facturaNumero ?? null,
      saldo,
      estado,
      updatedAt: now,
    })

    const updated = await docRef.get()
    return { id, ...updated.data() } as Orden
  },

  async softDelete(id: string): Promise<void> {
    const items = await this.findItemsByOrdenId(id)
    const now   = Timestamp.now()
    const batch = db.batch()

    batch.update(db.collection(COLLECTIONS.ORDENES).doc(id), { deletedAt: now, updatedAt: now })

    for (const item of items) {
      batch.update(db.collection(COLLECTIONS.PRODUCTOS).doc(item.productoId), {
        stockActual: FieldValue.increment(item.cantidad),
        updatedAt:   now,
      })
    }

    // Revertir stock de los artículos del BOM
    const bomSnapshots = await Promise.all(
      items.map(item =>
        db.collection(COLLECTIONS.PRODUCTO_ARTICULOS)
          .where('productoId', '==', item.productoId)
          .get()
          .then(snap => ({ cantidadOrden: item.cantidad, docs: snap.docs }))
      )
    )
    for (const { cantidadOrden, docs } of bomSnapshots) {
      for (const bomDoc of docs) {
        const { articuloId, cantidad: cantidadBom } = bomDoc.data() as { articuloId: string; cantidad: number }
        batch.update(db.collection(COLLECTIONS.ARTICULOS).doc(articuloId), {
          stock:     FieldValue.increment(cantidadBom * cantidadOrden),
          updatedAt: now,
        })
      }
    }

    await batch.commit()
  },
}
