import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp } from 'firebase-admin/firestore'
import type { InsertRecibo, Recibo } from './recibos.schema.js'

export const recibosRepository = {

  async findAll(): Promise<Recibo[]> {
    const snap = await db.collection(COLLECTIONS.RECIBOS)
      .where('deletedAt', '==', null)
      .get()
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recibo))
    return docs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
  },

  async findById(id: string): Promise<Recibo | null> {
    const doc = await db.collection(COLLECTIONS.RECIBOS).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Recibo
  },

  async create(data: InsertRecibo): Promise<Recibo> {
    const now        = Timestamp.now()
    const counterRef = db.collection('counters').doc('recibos')
    const reciboRef  = db.collection(COLLECTIONS.RECIBOS).doc()
    let numero = 0

    await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef)
      numero = ((counterSnap.exists ? counterSnap.data()?.ultimo : 0) ?? 0) + 1
      tx.set(counterRef, { ultimo: numero }, { merge: true })
      tx.set(reciboRef, {
        numero,
        clienteId:     data.clienteId  ?? null,
        clienteNombre: data.clienteNombre ?? null,
        monto:         data.monto,
        formaPago:     data.formaPago,
        ordenId:       data.ordenId    ?? null,
        ordenNumero:   data.ordenNumero ?? null,
        observaciones: data.observaciones ?? null,
        empresaId:     data.empresaId  ?? null,
        fecha:         now,
        createdAt:     now,
        deletedAt:     null,
      })
    })

    return {
      id: reciboRef.id,
      numero,
      clienteId:     data.clienteId  ?? null,
      clienteNombre: data.clienteNombre ?? null,
      monto:         data.monto,
      formaPago:     data.formaPago,
      ordenId:       data.ordenId    ?? null,
      ordenNumero:   data.ordenNumero ?? null,
      observaciones: data.observaciones ?? null,
      empresaId:     data.empresaId  ?? null,
      fecha:         now,
      createdAt:     now,
      deletedAt:     null,
    }
  },

  async softDelete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.RECIBOS).doc(id).update({ deletedAt: Timestamp.now() })
  },
}
