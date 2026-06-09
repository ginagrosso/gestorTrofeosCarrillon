---
name: react-fsd
description: >-
  Feature-Sliced Design para React + Vite + TypeScript.
  Usar cuando se crea o modifica cualquier archivo del frontend.
  Define la estructura de capas, reglas de importación y convenciones
  de componentes para este proyecto.
---

# React — Feature-Sliced Design (FSD)

## Capas (de mayor a menor abstracción)

```
src/
├── app/        # bootstrap: providers, router, estilos globales
├── pages/      # una carpeta por ruta, compone widgets y features
├── widgets/    # bloques UI grandes e independientes (Sidebar, Header, DataTable)
├── features/   # acciones de usuario con lógica (LoginForm, ActualizarPreciosModal)
├── entities/   # modelos de dominio + UI básica (ArticuloCard, ClienteRow)
└── shared/     # todo lo reutilizable sin contexto de negocio
    ├── api/    # cliente HTTP, llamadas a la API
    ├── ui/     # componentes base (Button, Input, Modal)
    ├── lib/    # helpers, formatters, constants
    ├── hooks/  # hooks genéricos (useDebounce, usePagination)
    └── config/ # variables de entorno, configuración Firebase
```

## Regla de importación (la más importante)

**Las capas solo pueden importar capas inferiores.**

```
app     → puede importar todo
pages   → widgets, features, entities, shared
widgets → features, entities, shared
features→ entities, shared
entities→ shared
shared  → nada del proyecto (solo librerías externas)
```

Nunca importar hacia arriba. Nunca importar entre slices del mismo nivel (usar shared si es necesario compartir).

## Convenciones
Ver `rules.md` para reglas operativas.
Ver `references/` para estructura concreta de cada capa.

## Referencias
- [Estructura shared](references/shared.md)
- [Entities](references/entities.md)
- [Features](references/features.md)
- [Pages](references/pages.md)
