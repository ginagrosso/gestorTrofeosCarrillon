// Script puntual — migra los proveedores/clientes ya cargados en Firestore de los
// campos viejos (contacto/telefono/celular) a la nueva estructura de hasta 3 pares
// contacto+teléfono, y borra campos obsoletos (incluido `whatsappTelefono`, de un
// diseño anterior) donde queden. No forma parte del build ni del deploy de Cloud
// Functions. Es idempotente: correrlo de nuevo sobre documentos ya migrados no
// hace nada, salvo que quede algún campo obsoleto por limpiar.
//
// Uso:
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/migrar-contactos.mjs
//     → dry-run (default): solo loguea qué haría, no escribe nada.
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/migrar-contactos.mjs --write
//     → aplica los cambios.
//
// Contra la base real (sin FIRESTORE_EMULATOR_HOST) solo correr con --write después
// de confirmar el resultado del dry-run.

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

const WRITE = process.argv.includes('--write')

function planProveedor(data) {
  if (!data.contacto) return null
  if (data.contacto1) return null // ya migrado
  return {
    contacto1: data.contacto,
    contacto: FieldValue.delete(),
  }
}

function planCliente(data) {
  const update = {}

  // `whatsappTelefono` era de un diseño anterior (elegir un solo teléfono "de
  // WhatsApp") que se abandonó — cada teléfono cargado tiene su propio botón de
  // WhatsApp ahora, así que el campo quedó obsoleto. Se borra donde aparezca,
  // incluso en documentos ya migrados.
  if (data.whatsappTelefono !== undefined) update.whatsappTelefono = FieldValue.delete()

  const yaMigrado = data.telefono1 || data.telefono2
  if (!yaMigrado && (data.celular || data.telefono)) {
    update.telefono = FieldValue.delete()
    update.celular = FieldValue.delete()
    if (data.celular) {
      update.telefono1 = data.celular
      if (data.telefono) update.telefono2 = data.telefono
    } else {
      update.telefono1 = data.telefono
    }
  }

  return Object.keys(update).length > 0 ? update : null
}

async function migrarColeccion(nombre, planFn) {
  const snap = await db.collection(nombre).get()
  const cambios = []

  for (const doc of snap.docs) {
    const plan = planFn(doc.data())
    if (plan) cambios.push({ id: doc.id, plan })
  }

  console.log(`\n${nombre}: ${cambios.length} de ${snap.size} documentos a migrar.`)
  for (const { id, plan } of cambios.slice(0, 5)) {
    console.log(`  ${id}:`, plan)
  }
  if (cambios.length > 5) console.log(`  ...y ${cambios.length - 5} más.`)

  if (!WRITE || cambios.length === 0) return

  const batchSize = 400
  for (let i = 0; i < cambios.length; i += batchSize) {
    const batch = db.batch()
    for (const { id, plan } of cambios.slice(i, i + batchSize)) {
      batch.update(db.collection(nombre).doc(id), plan)
    }
    await batch.commit()
  }
  console.log(`  ✓ ${cambios.length} documentos actualizados.`)
}

async function main() {
  console.log(WRITE ? 'Modo: WRITE (aplica cambios)' : 'Modo: dry-run (no escribe nada, pasá --write para aplicar)')
  await migrarColeccion('proveedores', planProveedor)
  await migrarColeccion('clientes', planCliente)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
