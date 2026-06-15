export function formatMoney(value: number): string {
  return value.toLocaleString('es-AR', { maximumFractionDigits: 2 })
}
