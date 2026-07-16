import type { Cliente } from '@/shared/lib/types'

// Teléfono por default para prellenar campos de un solo valor (ej. "Teléfono de
// contacto" de una OT, o el número al compartir un recibo por WhatsApp) — el
// primer teléfono cargado. En la tabla y la ficha de cliente se listan los 3 y
// cada uno tiene su propio botón de WhatsApp (ver `getContactos`).
export function getClienteWhatsAppTelefono(cliente: Cliente): string | undefined {
  return cliente.telefono1 || cliente.telefono2 || cliente.telefono3 || undefined
}
