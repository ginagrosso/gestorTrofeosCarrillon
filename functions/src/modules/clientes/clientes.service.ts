import { clientesRepository } from './clientes.repository.js'
import { insertClienteSchema } from './clientes.schema.js'
import type { Cliente, InsertCliente } from './clientes.schema.js'
import type { ImportResult } from '../../shared/lib/import-result.js'

export const clientesService = {

  async getAll(): Promise<Cliente[]> {
    return clientesRepository.findAll()
  },

  async importar(registros: unknown[]): Promise<ImportResult> {
    const resultado: ImportResult = { creados: 0, actualizados: 0, errores: [] }

    const validos: InsertCliente[] = []
    for (const [index, registro] of registros.entries()) {
      const parsed = insertClienteSchema.safeParse(registro)

      if (!parsed.success) {
        resultado.errores.push({
          fila: index + 1,
          error: parsed.error.issues.map(issue => issue.message).join('; '),
        })
        continue
      }

      validos.push(parsed.data)
    }

    const { creados, actualizados } = await clientesRepository.upsertManyByNombre(validos)
    resultado.creados = creados
    resultado.actualizados = actualizados

    return resultado
  },
}
