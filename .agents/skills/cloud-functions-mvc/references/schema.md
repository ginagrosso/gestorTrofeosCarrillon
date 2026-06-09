# Schema — Zod + TypeScript

El schema es la única fuente de verdad para tipos y validación.

```ts
// modules/articulos/articulos.schema.ts
import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'

export const insertArticuloSchema = z.object({
  codigo:          z.string().max(50).optional(),
  descripcion:     z.string().min(1).max(300),
  precioUnitario:  z.number().positive(),
  proveedorId:     z.string().min(1),
  unidad:          z.string().max(20).default('unidad'),
  stock:           z.number().int().min(0).default(0),
})

export const updateArticuloSchema = insertArticuloSchema.partial()

// Schema de lectura (incluye campos generados por el sistema)
export const articuloSchema = insertArticuloSchema.extend({
  id:         z.string(),
  createdAt:  z.instanceof(Timestamp),
  updatedAt:  z.instanceof(Timestamp),
  deletedAt:  z.instanceof(Timestamp).nullable(),
})

// Tipos inferidos — nunca definir interfaces a mano si Zod ya las tiene
export type InsertArticulo = z.infer<typeof insertArticuloSchema>
export type UpdateArticulo = z.infer<typeof updateArticuloSchema>
export type Articulo       = z.infer<typeof articuloSchema>
```
