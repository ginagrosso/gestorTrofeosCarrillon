# Service — Lógica de negocio

Solo lógica de negocio. Sin Firestore directo. Sin manejo de HTTP.

```ts
// modules/articulos/articulos.service.ts
import { AppError } from '../../shared/lib/app-error'
import { articulosRepository } from './articulos.repository'
import type { InsertArticulo, UpdateArticulo, Articulo } from './articulos.schema'

export const articulosService = {

  async getAll(proveedorId?: string): Promise<Articulo[]> {
    return articulosRepository.findAll(proveedorId)
  },

  async getById(id: string): Promise<Articulo> {
    const articulo = await articulosRepository.findById(id)
    if (!articulo) throw new AppError(404, 'Artículo no encontrado')
    return articulo
  },

  async create(data: InsertArticulo): Promise<Articulo> {
    return articulosRepository.create(data)
  },

  async update(id: string, data: UpdateArticulo): Promise<Articulo> {
    await this.getById(id) // lanza 404 si no existe
    return articulosRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    await this.getById(id) // lanza 404 si no existe
    await articulosRepository.softDelete(id)
  },

  async actualizarPreciosMasivo(proveedorId: string, porcentaje: number): Promise<{ actualizados: number }> {
    if (porcentaje === 0) throw new AppError(422, 'El porcentaje no puede ser 0')
    if (porcentaje < -99) throw new AppError(422, 'El porcentaje no puede reducir el precio más del 99%')

    const actualizados = await articulosRepository.updatePreciosByProveedor(proveedorId, porcentaje)
    if (actualizados === 0) throw new AppError(404, 'No se encontraron artículos para ese proveedor')

    return { actualizados }
  },
}
```

## AppError

```ts
// shared/lib/app-error.ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```
