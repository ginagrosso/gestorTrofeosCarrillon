import { db } from '../../shared/lib/firebase-admin.js'
import { COLLECTIONS } from '../../shared/lib/collections.js'
import { Timestamp } from 'firebase-admin/firestore'
import { AppError } from '../../shared/lib/app-error.js'
import type {
  InsertComprobante,
  Comprobante,
  ComprobanteConItems,
  ComprobanteItem,
  ComprobanteQuery,
} from './comprobantes.schema.js'
import type { Empresa } from '../empresas/empresas.schema.js'

const subtotalItem = (item: { cantidad: number; precioUnitario: number; bonificacion: number }): number =>
  item.cantidad * item.precioUnitario * (1 - item.bonificacion / 100)

export const comprobantesRepository = {

  async findAll(query: ComprobanteQuery): Promise<Comprobante[]> {
    const snap = await db.collection(COLLECTIONS.COMPROBANTES)
      .where('deletedAt', '==', null)
      .get()

    const docs = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Comprobante))
      .filter(c => !query.tipo || c.tipo === query.tipo)
      .filter(c => !query.empresaId || c.empresaId === query.empresaId)

    return docs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
  },

  async findById(id: string): Promise<Comprobante | null> {
    const doc = await db.collection(COLLECTIONS.COMPROBANTES).doc(id).get()
    if (!doc.exists || doc.data()?.deletedAt !== null) return null
    return { id: doc.id, ...doc.data() } as Comprobante
  },

  async findItemsByComprobanteId(comprobanteId: string): Promise<ComprobanteItem[]> {
    const snap = await db.collection(COLLECTIONS.COMPROBANTE_ITEMS)
      .where('comprobanteId', '==', comprobanteId)
      .get()
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ComprobanteItem))
  },

  async findByIdConItems(id: string): Promise<ComprobanteConItems | null> {
    const comprobante = await this.findById(id)
    if (!comprobante) return null
    const items = await this.findItemsByComprobanteId(id)
    return { ...comprobante, items }
  },

  async create(data: InsertComprobante): Promise<ComprobanteConItems> {
    const now = Timestamp.now()
    const comprobanteRef = db.collection(COLLECTIONS.COMPROBANTES).doc()
    const total = data.items.reduce((acc, item) => acc + subtotalItem(item), 0)

    const numero = await db.runTransaction(async (tx) => {
      const empresaRef  = db.collection(COLLECTIONS.EMPRESAS).doc(data.empresaId)
      const empresaSnap = await tx.get(empresaRef)

      if (!empresaSnap.exists) throw new AppError(404, 'Empresa no encontrada')

      const empresa           = empresaSnap.data() as Empresa
      const contador          = empresa.contadores[data.tipo]
      const nuevoNumero       = contador.ultimoNumero + 1
      const numeroFormateado  = `${contador.puntoVenta}-${String(nuevoNumero).padStart(8, '0')}`

      tx.update(empresaRef, {
        [`contadores.${data.tipo}.ultimoNumero`]: nuevoNumero,
        updatedAt: now,
      })

      tx.set(comprobanteRef, {
        tipo:             data.tipo,
        numero:           numeroFormateado,
        fecha:            now,
        empresaId:        data.empresaId,
        clienteId:        data.clienteId ?? null,
        clienteNombre:    data.clienteNombre,
        clienteDireccion: data.clienteDireccion ?? null,
        clienteLocalidad: data.clienteLocalidad ?? null,
        clienteCuit:      data.clienteCuit ?? null,
        clienteSitIva:    data.clienteSitIva ?? null,
        condVenta:        data.condVenta,
        observaciones:    data.observaciones ?? null,
        total,
        ordenId:          data.ordenId ?? null,
        presupuestoId:    data.presupuestoId ?? null,
        comprobanteRef:   data.comprobanteRef ?? null,
        createdAt:        now,
        updatedAt:        now,
        deletedAt:        null,
      })

      return numeroFormateado
    })

    const batch = db.batch()
    const items: ComprobanteItem[] = data.items.map(item => {
      const itemRef  = db.collection(COLLECTIONS.COMPROBANTE_ITEMS).doc()
      const subtotal = subtotalItem(item)
      const itemData = {
        comprobanteId:  comprobanteRef.id,
        codigo:         item.codigo ?? null,
        descripcion:    item.descripcion,
        cantidad:       item.cantidad,
        precioUnitario: item.precioUnitario,
        bonificacion:   item.bonificacion,
        subtotal,
      }
      batch.set(itemRef, itemData)
      return { id: itemRef.id, ...itemData }
    })
    await batch.commit()

    return {
      id:               comprobanteRef.id,
      tipo:             data.tipo,
      numero,
      fecha:            now,
      empresaId:        data.empresaId,
      clienteId:        data.clienteId ?? null,
      clienteNombre:    data.clienteNombre,
      clienteDireccion: data.clienteDireccion ?? null,
      clienteLocalidad: data.clienteLocalidad ?? null,
      clienteCuit:      data.clienteCuit ?? null,
      clienteSitIva:    data.clienteSitIva ?? null,
      condVenta:        data.condVenta,
      observaciones:    data.observaciones ?? null,
      total,
      ordenId:          data.ordenId ?? null,
      presupuestoId:    data.presupuestoId ?? null,
      comprobanteRef:   data.comprobanteRef ?? null,
      createdAt:        now,
      updatedAt:        now,
      deletedAt:        null,
      items,
    }
  },

  async softDelete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.COMPROBANTES).doc(id).update({
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  },
}
