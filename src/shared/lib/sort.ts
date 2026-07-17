const LEGACY_CODIGO_PREFIX = /^\d+\s*-\s*/

/**
 * Muchas descripciones migradas del sistema legacy traen un código numérico
 * pegado adelante (ej: "000 - BASE 10X10", "305 - LLAMA CON ARQUERO") que no
 * es un campo separado ni sigue un criterio consistente. Se ignora solo para
 * ordenar, para que "000 - ATRIL" quede junto al resto de los ítems con "A".
 */
export function compararAlfabetico(a: string, b: string): number {
  return a.replace(LEGACY_CODIGO_PREFIX, '').localeCompare(b.replace(LEGACY_CODIGO_PREFIX, ''), 'es')
}
