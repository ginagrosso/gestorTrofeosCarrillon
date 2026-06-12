# CLAUDE.md — Gestor Trofeos Carrillon

Leé este archivo **antes de tocar cualquier archivo de código**.

---

## Proyecto

Sistema de gestión para **Trofeos Carrillon** (Resistencia, Chaco, Argentina).
Reemplaza y extiende un sistema legacy.
Presupuesto cerrado: ARS $420.000 · 3 cuotas · garantía 1 mes post-entrega.

**Alcance contratado (fijo — sin excepciones):**
- ABM Artículos (piezas) con filtro por proveedor
- Actualización masiva de precios por proveedor (un % único)
- Ficha de Producto con lista de materiales → costo calculado automáticamente
- ABM Productos (trofeos/premios armados) con lista de materiales (artículos + cantidades) y costo calculado automáticamente como SUM(cantidad × precioCosto)
- ABM Proveedores con datos de contacto
- ABM Clientes con historial de compras, fechas y montos
- Import/export Excel: artículos, productos, clientes, ventas
- Login con usuario y contraseña
- Acceso web + mobile (responsive)
- PWA instalable (manifest + service worker, soporte offline básico)

**Fuera de alcance sin nuevo presupuesto:** cualquier feature no listada arriba.

---

## Stack

```
Firebase Auth        autenticación
Firestore            base de datos
Cloud Functions      backend (Node.js 22)
Firebase Hosting     deploy frontend
React 18 + Vite      frontend
TypeScript           todo el codebase
Zod                  validación de schemas
vite-plugin-pwa      manifest + service worker (PWA)
```

---

## Arquitecturas

### Backend — MVC en Cloud Functions
```
functions/src/
├── modules/
│   └── {modulo}/
│       ├── {modulo}.schema.ts       # Zod schemas + tipos inferidos
│       ├── {modulo}.repository.ts   # acceso a Firestore
│       ├── {modulo}.service.ts      # lógica de negocio
│       ├── {modulo}.controller.ts   # manejo de req/res HTTP
│       └── {modulo}.routes.ts       # definición de rutas Express
├── shared/
│   ├── middleware/                  # auth, error handler, logger
│   └── lib/                        # helpers reutilizables
└── index.ts                        # entry point, registra routes
```

### Frontend — Feature-Sliced Design (FSD)
```
src/
├── app/          # providers, router, estilos globales
├── pages/        # composición de features por ruta
├── widgets/      # bloques UI compuestos e independientes
├── features/     # acciones de usuario con lógica de negocio
├── entities/     # modelos de dominio (Articulo, Cliente, etc.)
├── shared/       # ui, api, lib, hooks, config reutilizables
```

---

## Modelos de datos (extraídos del sistema legacy)

### proveedores (~60 registros)
```
id, nombre, contacto, localidad, direccion, cuit,
sit_iva, telefono1, telefono2, rubro
```
`sit_iva`: `RESPONSABLE_INSCRIPTO | MONOTRIBUTO | EXENTO | CONSUMIDOR_FINAL`
`rubro`: texto libre, opcional (categoría descriptiva del proveedor, sin valores fijos)

### clientes (~1000 registros)
```
id, nombre, situacion_fiscal, tipo_doc (CUIT|CUIL|DNI|CUE|CUI),
cuit, empresa (M.E.P.B.|M.A.D., opcional), rubro, direccion,
telefono, celular, email
```

### articulos (piezas individuales — ~2375 registros)
```
id              string    — Firestore auto-id
codigo          string    requerido, único — campo de upsert al importar
descripcion     string    requerido
precioCosto     number    requerido, >= 0 — puede ser 0 (ítems sin precio definido en el legacy)
porcIva         number    requerido, default 21
precioVenta     number    requerido, >= 0 — puede ser 0
proveedorId     string    requerido — referencia al proveedor
unidad          string    default "unidad"
stock           number    int, default 0 — puede ser negativo (datos legacy)
createdAt       timestamp requerido — auto
updatedAt       timestamp requerido — auto
deletedAt       timestamp nullable, default null — soft delete
```

Import/export Excel: acepta los encabezados del legacy (`Codigo Articulo`, `Porc Iva`, `Stock Actual`, etc.) como aliases — ver `articuloColumns` en `columns.ts`.
- Al importar: `Proveedor` se busca por nombre para obtener `proveedorId`. Si no existe → reportar error en esa fila, no abortar el lote.
- Al exportar: escribir el nombre del proveedor en la columna `Proveedor`, no el ID (denormalizado en runtime, no persistido).

### productos (trofeos/premios armados — ~1948 registros)
```
id              string    — Firestore auto-id
codigo          string    requerido, único — campo de upsert al importar — ej: "X0982", "X-COT-058", "W-2667"
descripcion     string    requerido — ej: "COPA LUCY Nº1-43cm."
precioCosto     number    requerido, >= 0 — puede ser 0 (ítems sin precio definido en el legacy)
porcIva         number    requerido, default 21 — valores legacy: 0 o 21
precioVenta     number    requerido, >= 0 — puede ser 0
proveedorId     string    requerido — referencia al proveedor (igual que articulos)
stockActual     number    int, default 0 — puede ser negativo (datos legacy)
categoria       string    opcional — ej: "COPAS", "MEDALLAS", "TROFEOS", "PLAQUETAS"
subcategoria    string    opcional — ej: "COPAS METALICAS", "MEDALLAS POLIRESINA"
createdAt       timestamp requerido — auto
updatedAt       timestamp requerido — auto
deletedAt       timestamp nullable, default null — soft delete
```
- En el sistema legacy, `productos` y `articulos` convivían en una sola pantalla (diferenciados por color: azul = producto, negro = artículo) y se exportaban en 2 Excel separados con el mismo layout de columnas (`exportacionProductosCarrillon.xls` ~1948 filas, `exportacionArticulosCarrillon.xls` ~2375 filas).
- Estos ~1948 productos son el catálogo de productos ya armados/terminados del cliente: se cargan vía Importar, igual que `articulos` (`productoColumns` en `columns.ts`) — es una funcionalidad permanente, no una migración única.
- Import/export Excel: mismas reglas que `articulos` — `Proveedor` se busca por nombre al importar (si no existe → error en esa fila, no se aborta el lote) y se escribe el nombre del proveedor al exportar (denormalizado en runtime, no persistido).
- Cuando un producto tiene `productoArticulos` (lista de materiales) definida, su `precioCosto` se recalcula automáticamente como `SUM(cantidad × articulo.precioCosto)` y se persiste. Sin lista de materiales, `precioCosto` queda con el valor importado/editado manualmente.

### productoArticulos (lista de materiales / BOM)
```
productoId, articuloId, cantidad
```
- Al guardarse, recalcula y persiste `producto.precioCosto = SUM(cantidad × articulo.precioCosto)`

### ventas
```
id, clienteId, fecha, total, estado (pendiente|confirmada|cancelada)
```

### ventaItems
```
ventaId, productoId, cantidad, precioUnitario
```

### usuarios
```
id, nombre, email, rol
```

---

## Paleta de colores (fachada del local)
```
--color-brand-brown: #7B4A2D   /* marrón principal */
--color-brand-gold:  #C9A84C   /* dorado vitrinas  */
--color-brand-cream: #F5EFE0   /* crema fondo      */
```

---

## Reglas globales

- TypeScript estricto — sin `any` sin justificación comentada
- Zod en **toda** entrada de datos: request body, params, query
- Sin lógica de negocio en controllers ni en repositories
- Soft delete en todas las entidades principales (`deletedAt`)
- Timestamps `createdAt` / `updatedAt` en todos los documentos
- Sin `console.log` en código commiteado — usar el logger de Functions
- Solo `pnpm` — nunca `npm` ni `yarn`
- Commits siguiendo convención del proyecto (ver `.agents/skills/commits/`)
- Toda tabla/listado (ABM) usa paginación client-side vía `usePagination` (`shared/hooks`) + `Pagination` (`shared/ui`) — tamaño de página por defecto: 20
- Toda tabla/listado (ABM) tiene un buscador arriba de la tabla vía `useSearch` (`shared/hooks`) + `SearchInput` (`shared/ui`) — filtra client-side por los campos de texto relevantes de cada entidad
- No existe una sección/página separada de "Importar/Exportar": cada ABM tiene sus propios botones de Importar/Exportar Excel en el header, vía `ImportExportButtons` (`shared/ui`) + el `ColumnMap` de la entidad (`features/importar-exportar/lib/columns.ts`)

## Skills disponibles
Ver `.agents/README.md` para el índice completo.
