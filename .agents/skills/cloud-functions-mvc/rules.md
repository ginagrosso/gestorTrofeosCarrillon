# Cloud Functions MVC — Reglas

## Reglas fundamentales

1. Un módulo = una entidad de negocio. Sin excepciones.
2. Las capas solo se comunican hacia abajo (routes → controller → service → repository → Firestore).
3. Zod valida **toda** entrada externa antes de que llegue al service.
4. Los repositories devuelven tipos del dominio, nunca `DocumentSnapshot` crudos.
5. Los services lanzan errores de dominio tipados, nunca strings.
6. Los controllers no tienen `if/else` de negocio — solo transforman y delegan.

## DO (Prácticas requeridas)

### Schema
- Definir un schema Zod para crear (`insertSchema`) y otro para actualizar (`updateSchema` con `.partial()`).
- Inferir los tipos TypeScript desde Zod: `type Articulo = z.infer<typeof articuloSchema>`.
- Incluir `id`, `createdAt`, `updatedAt`, `deletedAt` en el schema de lectura.

### Repository
- Todas las queries de lista deben filtrar `where('deletedAt', '==', null)`.
- El soft delete setea `deletedAt: Timestamp.now()`, nunca borra el documento.
- Usar `admin.firestore()` — nunca el SDK de cliente en Functions.
- Tipear el retorno de cada método explícitamente.

### Service
- Lanzar `AppError` con código y mensaje cuando algo falla.
- El costo de un producto siempre se calcula en tiempo real: `SUM(cantidad × precio_unitario)`. Nunca persistirlo.
- La actualización masiva de precios es una sola operación con `batch.commit()`.

### Controller
- Validar con Zod el body/params/query antes de llamar al service.
- Responder siempre con el mismo formato: `{ data }` en éxito, `{ error, details? }` en fallo.
- Códigos HTTP: 200 lista/detalle, 201 creación, 204 delete, 400 validación, 401 no auth, 404 no encontrado, 422 error de negocio, 500 inesperado.

### Routes
- Todas las rutas protegidas con el middleware `authenticate` como primer middleware.
- Prefijo de versión: `/v1/{recurso}`.

## DO NOT (Prácticas prohibidas)

- No importar `admin.firestore()` en un controller o service directamente — solo en repositories.
- No usar `any` en TypeScript sin comentario justificando.
- No capturar errores silenciosamente (`catch (e) {}`).
- No hardcodear IDs de colecciones — usar constantes en `shared/lib/collections.ts`.
- No `console.log` — usar el logger importado de `shared/lib/logger.ts`.
- No retornar datos de un documento eliminado (soft-deleted).
