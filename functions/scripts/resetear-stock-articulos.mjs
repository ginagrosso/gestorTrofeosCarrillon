// Script puntual — pone en 0 el stock de todos los artículos ya cargados en Firestore
// (pedido único del cliente). No forma parte del build ni del deploy de Cloud Functions.
//
// Uso:
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/resetear-stock-articulos.mjs
//     → dry-run (default): solo loguea cuántos artículos cambiarían, no escribe nada.
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/resetear-stock-articulos.mjs --write
//     → aplica los cambios.
//
// Contra la base real (sin FIRESTORE_EMULATOR_HOST) solo correr con --write después
// de confirmar el resultado del dry-run.

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

const WRITE = process.argv.includes('--write')

async function main() {
  console.log(WRITE ? 'Modo: WRITE (aplica cambios)' : 'Modo: dry-run (no escribe nada, pasá --write para aplicar)')

  const snap = await db.collection('articulos').get()
  const aCambiar = snap.docs.filter(doc => (doc.data().stock ?? 0) !== 0)

  console.log(`\narticulos: ${aCambiar.length} de ${snap.size} documentos con stock distinto de 0.`)
  for (const doc of aCambiar.slice(0, 5)) {
    console.log(`  ${doc.id} (${doc.data().codigo ?? '?'}): stock ${doc.data().stock} → 0`)
  }
  if (aCambiar.length > 5) console.log(`  ...y ${aCambiar.length - 5} más.`)

  if (!WRITE || aCambiar.length === 0) return

  const batchSize = 400
  for (let i = 0; i < aCambiar.length; i += batchSize) {
    const batch = db.batch()
    for (const doc of aCambiar.slice(i, i + batchSize)) {
      batch.update(doc.ref, { stock: 0 })
    }
    await batch.commit()
  }
  console.log(`  ✓ ${aCambiar.length} artículos actualizados a stock 0.`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
