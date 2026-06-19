import { AppError } from '../../shared/lib/app-error.js'
import { clientesRepository } from './clientes.repository.js'
import { insertClienteSchema } from './clientes.schema.js'
import type { Cliente, InsertCliente, UpdateCliente } from './clientes.schema.js'
import type { ImportResult } from '../../shared/lib/import-result.js'

export const clientesService = {

  async getAll(): Promise<Cliente[]> {
    return clientesRepository.findAll()
  },

  async getById(id: string): Promise<Cliente> {
    const cliente = await clientesRepository.findById(id)
    if (!cliente) throw new AppError(404, 'Cliente no encontrado')
    return cliente
  },

  async create(data: InsertCliente): Promise<Cliente> {
    return clientesRepository.create(data)
  },

  async update(id: string, data: UpdateCliente): Promise<Cliente> {
    await this.getById(id) // lanza 404 si no existe
    return clientesRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    await this.getById(id) // lanza 404 si no existe
    await clientesRepository.softDelete(id)
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
