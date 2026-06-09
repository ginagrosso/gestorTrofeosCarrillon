---
name: cloud-functions-mvc
description: >-
  Arquitectura MVC para Cloud Functions de Firebase con TypeScript.
  Usar cuando se crea o modifica un módulo del backend: schemas Zod,
  repositories Firestore, services de negocio, controllers HTTP y routes Express.
  Activar siempre que se trabaje en functions/src/modules/.
---

# Cloud Functions — Arquitectura MVC

## Estructura de un módulo

Cada entidad de negocio es un módulo independiente bajo `functions/src/modules/{modulo}/`:

```
{modulo}.schema.ts       → tipos Zod + tipos TypeScript inferidos
{modulo}.repository.ts   → CRUD Firestore, sin lógica de negocio
{modulo}.service.ts      → lógica de negocio, usa repository
{modulo}.controller.ts   → maneja req/res, delega al service
{modulo}.routes.ts       → define y exporta el Express Router
```

## Capas y responsabilidades

| Capa | Responsabilidad | Puede importar |
|---|---|---|
| schema | tipos y validación Zod | — |
| repository | operaciones Firestore | schema |
| service | reglas de negocio | repository, schema |
| controller | HTTP req/res, validación entrada | service, schema |
| routes | registrar endpoints | controller |

**Regla de oro:** cada capa solo conoce la capa inmediatamente inferior. Un controller nunca toca Firestore. Un repository nunca tiene lógica de negocio.

## Convenciones

Ver `rules.md` para las reglas operativas completas.
Ver `references/` para ejemplos concretos de cada capa.

## Referencias
- [Schema](references/schema.md)
- [Repository](references/repository.md)
- [Service](references/service.md)
- [Controller](references/controller.md)
- [Routes](references/routes.md)
- [Módulo completo de ejemplo](references/example-module.md)
