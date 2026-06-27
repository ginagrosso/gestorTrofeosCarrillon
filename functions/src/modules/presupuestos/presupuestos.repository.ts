import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp } from 'firebase-admin/firestore'
import type {
  InsertPresupuesto,
  Presupuesto,
  PresupuestoConItems,
  PresupuestoItem,
  UpdatePresupuesto,
} from './presupuestos.schema.js'

const calcSubtotal = (cantidad: number, precioUnitario: number, bonificacion: number) =>
  cantidad * precioUnitario * (1 - bonificacion / 100)

export const presupuestosRepository = {

  async findAll(): Promise<Presupuesto[]> {
    const snap = await db.collection(COLLECTIONS.PRESUPUESTOS)
      .where('deletedAt', '==', null)
      .get()
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Presupuesto))
    return docs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
  },

  async findById(id: string): Promise<Presupuesto | null> {
    const doc = await db.collection(COLLECTIONS.PRESUPUESTOS).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Presupuesto
  },

  async findItemsByPresupuestoId(presupuestoId: string): Promise<PresupuestoItem[]> {
    const snap = await db.collection(COLLECTIONS.PRESUPUESTO_ITEMS)
      .where('presupuestoId', '==', presupuestoId)
      .get()
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PresupuestoItem))
  },

  async findByIdConItems(id: string): Promise<PresupuestoConItems | null> {
    const presupuesto = await this.findById(id)
    if (!presupuesto) return null
    const items = await this.findItemsByPresupuestoId(id)
    return { ...presupuesto, items }
  },

  async create(data: InsertPresupuesto): Promise<PresupuestoConItems> {
    const now = Timestamp.now()
    const total = data.items.reduce(
      (acc, item) => acc + calcSubtotal(item.cantidad, item.precioUnitario, item.bonificacion ?? 0),
      0,
    )

    const counterRef = db.collection('counters').doc('presupuestos')
    const presupuestoRef = db.collection(COLLECTIONS.PRESUPUESTOS).doc()
    const presupuestoId = presupuestoRef.id
    let numero = 0

    // Transacción atómica para el contador secuencial
    await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef)
      numero = ((counterSnap.exists ? counterSnap.data()?.ultimo : 0) ?? 0) + 1
      tx.set(counterRef, { ultimo: numero }, { merge: true })
      tx.set(presupuestoRef, {
        numero,
        clienteId:        data.clienteId ?? null,
        clienteNombre:    data.clienteNombre,
        clienteLocalidad: data.clienteLocalidad ?? null,
        clienteCuit:      data.clienteCuit ?? null,
        clienteSitIva:    data.clienteSitIva ?? null,
        condVenta:        data.condVenta,
        observaciones:    data.observaciones ?? null,
        plazoEntrega:     data.plazoEntrega,
        validezDias:      data.validezDias,
        total,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
    })

    const batch = db.batch()
    const createdItems: PresupuestoItem[] = data.items.map(item => {
      const itemRef = db.collection(COLLECTIONS.PRESUPUESTO_ITEMS).doc()
      const subtotal = calcSubtotal(item.cantidad, item.precioUnitario, item.bonificacion ?? 0)
      batch.set(itemRef, {
        presupuestoId,
        productoId:     item.productoId,
        cantidad:       item.cantidad,
        precioUnitario: item.precioUnitario,
        bonificacion:   item.bonificacion ?? 0,
        subtotal,
      })
      return {
        id:             itemRef.id,
        presupuestoId,
        productoId:     item.productoId,
        cantidad:       item.cantidad,
        precioUnitario: item.precioUnitario,
        bonificacion:   item.bonificacion ?? 0,
        subtotal,
      }
    })
    await batch.commit()

    return {
      id: presupuestoId,
      numero,
      clienteId:        data.clienteId ?? null,
      clienteNombre:    data.clienteNombre,
      clienteLocalidad: data.clienteLocalidad ?? null,
      clienteCuit:      data.clienteCuit ?? null,
      clienteSitIva:    data.clienteSitIva ?? null,
      condVenta:        data.condVenta,
      observaciones:    data.observaciones ?? null,
      plazoEntrega:     data.plazoEntrega,
      validezDias:      data.validezDias,
      total,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      items: createdItems,
    }
  },

  async update(id: string, data: UpdatePresupuesto): Promise<PresupuestoConItems> {
    const now = Timestamp.now()
    const batch = db.batch()

    const updateFields: Record<string, unknown> = { updatedAt: now }
    if ('clienteId' in data)        updateFields['clienteId']        = data.clienteId ?? null
    if ('clienteNombre' in data)    updateFields['clienteNombre']    = data.clienteNombre
    if ('clienteLocalidad' in data) updateFields['clienteLocalidad'] = data.clienteLocalidad ?? null
    if ('clienteCuit' in data)      updateFields['clienteCuit']      = data.clienteCuit ?? null
    if ('clienteSitIva' in data)    updateFields['clienteSitIva']    = data.clienteSitIva ?? null
    if ('condVenta' in data)        updateFields['condVenta']        = data.condVenta
    if ('observaciones' in data)    updateFields['observaciones']    = data.observaciones ?? null
    if ('plazoEntrega' in data)     updateFields['plazoEntrega']     = data.plazoEntrega
    if ('validezDias' in data)      updateFields['validezDias']      = data.validezDias

    if (data.items !== undefined) {
      const oldItems = await this.findItemsByPresupuestoId(id)
      for (const item of oldItems) {
        batch.delete(db.collection(COLLECTIONS.PRESUPUESTO_ITEMS).doc(item.id))
      }

      let total = 0
      data.items.forEach(item => {
        const itemRef = db.collection(COLLECTIONS.PRESUPUESTO_ITEMS).doc()
        const subtotal = calcSubtotal(item.cantidad!, item.precioUnitario!, item.bonificacion ?? 0)
        total += subtotal
        batch.set(itemRef, {
          presupuestoId: id,
          productoId:     item.productoId,
          cantidad:       item.cantidad,
          precioUnitario: item.precioUnitario,
          bonificacion:   item.bonificacion ?? 0,
          subtotal,
        })
      })
      updateFields['total'] = total
    }

    batch.update(db.collection(COLLECTIONS.PRESUPUESTOS).doc(id), updateFields)
    await batch.commit()

    const updated = await this.findByIdConItems(id)
    return updated!
  },

  async softDelete(id: string): Promise<void> {
    const now = Timestamp.now()
    await db.collection(COLLECTIONS.PRESUPUESTOS).doc(id).update({ deletedAt: now, updatedAt: now })
  },
}
