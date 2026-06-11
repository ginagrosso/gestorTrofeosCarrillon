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
- ABM Proveedores con datos de contacto
- ABM Clientes con historial de compras, fechas y montos
- Import/export Excel: artículos, clientes, ventas
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
id, nombre, situacion_fiscal, tipo_doc (CUIT|CUIL|DNI|CUE),
cuit, empresa (M.E.P.B.|M.A.D.), rubro, direccion,
telefono, celular, email
```

### articulos
```
id, codigo, descripcion, precio_unitario, proveedorId, unidad, stock
```

### productos
```
id, codigo, nombre, descripcion, imagenUrl
```

### productoArticulos (lista de materiales)
```
productoId, articuloId, cantidad
→ costo = SUM(cantidad × articulo.precio_unitario)  [siempre calculado, nunca persistido]
```

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

## Skills disponibles
Ver `.agents/README.md` para el índice completo.
