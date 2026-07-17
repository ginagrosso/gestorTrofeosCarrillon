// Script puntual — pone en 0 el % IVA de todos los artículos y productos ya
// cargados en Firestore (las dos empresas son monotributistas y no discriminan
// IVA). No forma parte del build ni del deploy de Cloud Functions.
//
// Uso:
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/resetear-iva-articulos-productos.mjs
//     → dry-run (default): solo loguea cuántos documentos cambiarían, no escribe nada.
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/resetear-iva-articulos-productos.mjs --write
//     → aplica los cambios.
//
// Contra la base real (sin FIRESTORE_EMULATOR_HOST) solo correr con --write después
// de confirmar el resultado del dry-run.

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

const WRITE = process.argv.includes('--write')

async function resetearColeccion(nombre) {
  const snap = await db.collection(nombre).get()
  const aCambiar = snap.docs.filter(doc => (doc.data().porcIva ?? 0) !== 0)

  console.log(`\n${nombre}: ${aCambiar.length} de ${snap.size} documentos con % IVA distinto de 0.`)
  for (const doc of aCambiar.slice(0, 5)) {
    console.log(`  ${doc.id} (${doc.data().codigo ?? '?'}): porcIva ${doc.data().porcIva} → 0`)
  }
  if (aCambiar.length > 5) console.log(`  ...y ${aCambiar.length - 5} más.`)

  if (!WRITE || aCambiar.length === 0) return

  const batchSize = 400
  for (let i = 0; i < aCambiar.length; i += batchSize) {
    const batch = db.batch()
    for (const doc of aCambiar.slice(i, i + batchSize)) {
      batch.update(doc.ref, { porcIva: 0 })
    }
    await batch.commit()
  }
  console.log(`  ✓ ${aCambiar.length} documentos de ${nombre} actualizados a % IVA 0.`)
}

async function main() {
  console.log(WRITE ? 'Modo: WRITE (aplica cambios)' : 'Modo: dry-run (no escribe nada, pasá --write para aplicar)')
  await resetearColeccion('articulos')
  await resetearColeccion('productos')
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
