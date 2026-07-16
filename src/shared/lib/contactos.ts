export interface Contacto {
  slot:     1 | 2 | 3
  contacto?: string | null
  telefono: string
}

interface ConContactos {
  contacto1?: string | null
  telefono1?: string | null
  contacto2?: string | null
  telefono2?: string | null
  contacto3?: string | null
  telefono3?: string | null
}

// Lista los pares contacto+teléfono cargados (hasta 3), salteando los slots vacíos.
export function getContactos(entidad: ConContactos): Contacto[] {
  const contactos: Contacto[] = []
  if (entidad.telefono1) contactos.push({ slot: 1, contacto: entidad.contacto1, telefono: entidad.telefono1 })
  if (entidad.telefono2) contactos.push({ slot: 2, contacto: entidad.contacto2, telefono: entidad.telefono2 })
  if (entidad.telefono3) contactos.push({ slot: 3, contacto: entidad.contacto3, telefono: entidad.telefono3 })
  return contactos
}
