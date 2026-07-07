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
- Compras a proveedores con actualización automática de stock de artículos
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

**Deuda técnica pendiente — modularizar `shared/lib/types.ts`:**
Hoy **todos** los schemas Zod y tipos inferidos del frontend (de todas las entidades: Proveedor, Cliente, Articulo, Producto, Compra, Presupuesto, Orden, Empresa, Comprobante, Recibo, etc.) viven en un único archivo `src/shared/lib/types.ts`, que ya creció demasiado. La carpeta `entities/` está prevista en la arquitectura pero sigue vacía.
Próxima refactorización (hacerla de forma incremental, entidad por entidad, sin mezclarla con features nuevas): mover cada schema + tipos de esa entidad a `src/entities/{entidad}/model.ts` (o `index.ts`), y actualizar los imports (`@/shared/lib/types` → `@/entities/{entidad}`) en todo el código que los consume (`shared/api/*.api.ts`, `features/*/hooks`, `features/*/ui`, `pages/*`).

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
id              string    — Firestore auto-id
nombre          string    requerido
situacionFiscal enum      requerido — RESPONSABLE_INSCRIPTO | MONOTRIBUTO | EXENTO | CONSUMIDOR_FINAL (mismos valores/labels que sitIva de proveedores)
tipoDoc         enum      requerido — CUIT | CUIL | DNI | CUE | CUI
cuit            string    opcional — número de documento (según tipoDoc)
direccion       string    opcional
telefono        string    opcional
celular         string    opcional — usado para el botón de WhatsApp
email           string    opcional
createdAt       timestamp requerido — auto
updatedAt       timestamp requerido — auto
deletedAt       timestamp nullable, default null — soft delete
```
- El Excel legacy (`exportarClienteCarrillon.xls`, ~1026 filas) trae además las columnas `Empresa` (M.E.P.B./M.A.D.) y `Rubro` (códigos `01-`..`18-` sin significado claro): son datos del sistema viejo sin uso real, no forman parte del modelo y se ignoran al importar.
- `Situación Fiscal` del Excel ("EXENTO EN IVA", "RESPONSABLE INSCRIPTO", "CONSUMIDOR FINAL", "MONOTRIBUTO") se mapea al enum `situacionFiscal` igual que `sitIva` de proveedores (reutiliza `SIT_IVA_LABELS`).
- Import/export Excel: upsert por `nombre` (no hay campo `codigo` único como en artículos/productos).

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

### compras (recepciones de mercadería de proveedores)
```
id              string    — Firestore auto-id
proveedorId     string    requerido
fecha           timestamp requerido — auto al guardar
nroComprobante  string    opcional — nro de factura/remito del proveedor
total           number    calculado = SUM(cantidad × precioUnitario)
createdAt       timestamp requerido — auto
updatedAt       timestamp requerido — auto
deletedAt       timestamp nullable, default null — soft delete con reversión de stock
```
- Al guardar: batch transaction que crea la compra + los ítems + incrementa `articulo.stock += cantidad` para cada ítem, en una sola operación atómica.
- Al eliminar (soft delete): revierte el stock (`articulo.stock -= cantidad`) en la misma operación.
- El registro es de solo lectura una vez guardado (no se edita — si hay error, se elimina y se vuelve a cargar).

### compraItems
```
compraId        string    requerido
articuloId      string    requerido
cantidad        number    requerido, > 0
precioUnitario  number    requerido, >= 0
```

### UX — Modal/Sheet de carga de compra
1. Admin elige el proveedor.
2. Agrega filas: cada fila tiene un combobox de artículo que filtra **solo artículos de ese proveedor**.
3. Si el artículo no existe → opción "Crear artículo nuevo" en el combobox → mini-formulario inline (código, descripción, precio costo) → al confirmar, el artículo se crea con ese `proveedorId` y queda seleccionado en la fila.
4. Admin completa cantidad (y precio unitario si difiere del registrado).
5. Guardar → batch atómico: crea artículos nuevos si los hay → crea la compra → actualiza stocks.

### presupuestos
```
id              string    — Firestore auto-id
numero          number    — secuencial interno (NO se muestra en el PDF)
fecha           timestamp requerido — auto
empresaId       string    requerido — empresa a la que se le imputa (MAD o MEPB), elegida en el formulario
clienteId       string    opcional — si es cliente registrado
clienteNombre   string    requerido — autocompletado desde cliente o escrito a mano
clienteLocalidad string   opcional
clienteCuit     string    opcional
clienteSitIva   string    opcional
condVenta       string    default "CONTADO"
observaciones   string    opcional
plazoEntrega    string    default "INMEDIATO"
validezDias     number    default 30
total           number    calculado = SUM(subtotal de items)
createdAt       timestamp requerido — auto
updatedAt       timestamp requerido — auto
deletedAt       timestamp nullable, default null — soft delete
```

### presupuestoItems
```
presupuestoId   string    requerido
productoId      string    requerido
cantidad        number    requerido, > 0
precioUnitario  number    pre-cargado desde producto.precioVenta, editable
bonificacion    number    % descuento, default 0
subtotal        number    calculado = cantidad × precioUnitario × (1 - bonificacion/100)
```

### PDF de presupuesto
- Encabezado hardcodeado (no configurable desde UI):
  - Nombre: **Trofeos Carrillon Siglo 21**
  - Dirección: Av. Italia 947 — Resistencia, Chaco
  - Tel: 3624-103544
  - Email: carrillonventas@gmail.com
- **El número de presupuesto NO aparece en el PDF** (solo uso interno)
- Sin datos fiscales (CUIT, condición IVA del negocio) — el presupuesto no es documento fiscal
- Generado client-side con `@react-pdf/renderer`
- Botón "Compartir por WhatsApp": en mobile usa `navigator.share()` (API nativa); en desktop descarga el PDF y abre WhatsApp Web con mensaje pre-escrito
- Botón "Imprimir": `window.print()` con estilos CSS de impresión
- El admin puede editar y eliminar presupuestos sin restricciones (a diferencia de compras, no tienen efectos secundarios sobre stock u otros datos)

### órdenesDeTrabajo (reemplaza el modelo simplificado de ventas)
```
id              string    — Firestore auto-id
numero          number    — secuencial visible en PDF, empieza desde 1
fecha           timestamp requerido — auto al guardar
fechaPrometida  string    requerido — fecha prometida de entrega (ej: "Viernes 8")
empresaId       string    requerido — empresa a la que se le imputa (MAD o MEPB), elegida en el formulario. Se usa para generar la Factura C sin volver a preguntar.
clienteId       string    opcional — si es cliente registrado
clienteNombre   string    requerido — autocompletado desde cliente o escrito a mano
clienteLocalidad string   opcional
clienteCuit     string    opcional
condVenta       string    default "CONTADO"
formaPago       enum      EFECTIVO | CHEQUE | TRANSFERENCIA | CTA_CTE
reciboNumero    string    opcional — nro de recibo emitido
facturaNumero   string    opcional — nro de factura emitida
montoEntrega    number    default 0 — monto ya cobrado (seña o pago total)
total           number    calculado = SUM(subtotal de items)
saldo           number    calculado = total - montoEntrega
estado          enum      PENDIENTE | PARCIAL | PAGADO — calculado automáticamente
presupuestoId   string    opcional — si se originó desde un presupuesto aprobado
createdAt       timestamp requerido — auto
updatedAt       timestamp requerido — auto
deletedAt       timestamp nullable, default null — soft delete
```
- `estado` se calcula automáticamente: `montoEntrega == 0` → PENDIENTE · `0 < montoEntrega < total` → PARCIAL · `montoEntrega >= total` → PAGADO
- Al guardar: decrementa `producto.stockActual -= cantidad` para cada ítem (batch atómico).
- Al eliminar (soft delete): revierte el stock (`producto.stockActual += cantidad`).
- El registro es de solo lectura una vez guardado (no se edita — si hay error, se elimina y se vuelve a cargar), excepto para actualizar `montoEntrega`, `reciboNumero`, `facturaNumero` y `formaPago` (campos de pago editables post-creación).

### ordenDeTrabajoItems
```
ordenId         string    requerido
productoId      string    requerido
cantidad        number    requerido, > 0
precioUnitario  number    pre-cargado desde producto.precioVenta, editable
subtotal        number    calculado = cantidad × precioUnitario
```

### PDF de orden de trabajo
- Encabezado idéntico al presupuesto (hardcodeado): Trofeos Carrillon Siglo 21 / Av. Italia 947 — Resistencia, Chaco / Tel: 3624-103544 / carrillonventas@gmail.com
- **Número visible en PDF** (a diferencia del presupuesto)
- Tabla de ítems con columnas: `# | DETALLE | P/UNIT. | TOTALES` — la columna `#` enumera las filas como `#1`, `#2`, etc.
- Sección "FORMA DE PAGO": Recibo N° / Factura N° / checkboxes Efectivo · Cheque · Transferencia · Cta. Cte.
- Totales: TOTAL / ENTREGA / SALDO
- Estado PAGADO visible si corresponde (texto, no sello)
- **Bloque de líneas en blanco al pie** para que el operario anote instrucciones de grabado/personalización a mano — sin campo digital. Los ítems están numerados (`#1`, `#2`) para referenciarlos en las notas escritas.
- Generado client-side con `@react-pdf/renderer`
- Botón "Imprimir": `window.print()` con estilos CSS de impresión
- La impresión es el documento de taller (referencia de producción). El sistema es la fuente de verdad para el estado de pago — cuando se cobra, el admin actualiza `montoEntrega` en el sistema.

### usuarios
- Un único usuario administrador. Se crea directamente en la consola de Firebase Auth — no requiere ABM en el sistema.

### empresas (configuración del sistema — no hardcodeado)
```
id              string    — Firestore auto-id
nombreFantasia  string    requerido — ej: "Trofeos Siglo XXI"
razonSocial     string    requerido — ej: "DIEZ MARIA AGOSTINA"
domicilio       string    requerido
localidad       string    requerido
cuit            string    requerido
iibb            string    requerido — número de Ingresos Brutos
fechaInicioAct  string    requerido — fecha de inicio de actividades
condIva         string    requerido — ej: "Responsable Monotributo"
activa          boolean   default true
contadores      object    requerido — numeración de comprobantes por tipo, ver abajo
```
`contadores`: un objeto con una entrada por cada tipo (`FACTURA_C | REMITO | NOTA_CREDITO_C | NOTA_DEBITO_C`), cada una `{ puntoVenta: string (ej: "0001"), ultimoNumero: number }`. Al cargar la empresa, el admin define `puntoVenta` y deja `ultimoNumero` en el último número ya usado (ej: si el talonario físico previo llegó hasta el 1312, se carga `ultimoNumero: 1312` para que el próximo comprobante sea el 1313). No hay talonarios, rangos, CAI ni vencimientos en el sistema — es solo un contador simple que se incrementa en cada comprobante emitido, sin tope.
- Gestionable desde la sección de Configuración del sistema (ABM). **No hay datos de empresa hardcodeados en el código.**
- Actualmente hay 2 empresas: MAD (Diez María Agostina / Trofeos Siglo XXI) y MEPB (Pérez Brignole María Ercilia / Premios & Homenajes), pero el modelo soporta N empresas.

### comprobantes (Factura C, Remito, Nota de Crédito C, Nota de Débito C)
```
id              string    — Firestore auto-id
tipo            enum      FACTURA_C | REMITO | NOTA_CREDITO_C | NOTA_DEBITO_C
numero          string    — generado de empresa.contadores[tipo], ej: "0001-00001313"
fecha           timestamp requerido — auto al guardar
empresaId       string    requerido — ref a empresa
clienteId       string    opcional — si es cliente registrado
clienteNombre   string    requerido
clienteDireccion string   opcional
clienteLocalidad string   opcional
clienteCuit     string    opcional
clienteSitIva   string    opcional
condVenta       string    default "CONTADO"
observaciones   string    opcional
total           number    calculado = SUM(subtotal de items)
ordenId         string    opcional — si se generó desde una OT
presupuestoId   string    opcional — si se generó desde un presupuesto
comprobanteRef  string    opcional — solo NC/ND: número del comprobante original acreditado/debitado
createdAt       timestamp requerido — auto
updatedAt       timestamp requerido — auto
deletedAt       timestamp nullable, default null — soft delete
```
- Registro de solo lectura una vez guardado (no se edita).
- Al crear (transacción atómica): lee `empresa.contadores[tipo].ultimoNumero`, calcula `nuevoNumero = ultimoNumero + 1`, formatea `numero = "{puntoVenta}-{nuevoNumero con padding a 8 dígitos}"`, actualiza `empresa.contadores[tipo].ultimoNumero = nuevoNumero` y crea el comprobante, todo en la misma transacción de Firestore.

### comprobanteItems
```
comprobanteId   string    requerido
codigo          string    — código del producto
descripcion     string    requerido
cantidad        number    requerido, > 0
precioUnitario  number    requerido, >= 0
bonificacion    number    % descuento, default 0
subtotal        number    calculado = cantidad × precioUnitario × (1 - bonificacion/100)
```

### recibos de pago
```
id              string    — Firestore auto-id
numero          number    — secuencial interno (NO se muestra en el impreso)
fecha           timestamp requerido — auto
empresaId       string    opcional
clienteNombre   string    requerido
monto           number    requerido
formaPago       enum      EFECTIVO | CHEQUE | TRANSFERENCIA | CTA_CTE
ordenId         string    opcional — OT a la que corresponde el pago
observaciones   string    opcional
createdAt       timestamp requerido — auto
deletedAt       timestamp nullable, default null — soft delete
```
- Sin items. Ticket simple de confirmación de pago — no es documento fiscal.
- El `numero` existe en el sistema para registro interno pero **no aparece en el impreso**.

### PDF e impresión de comprobantes

**Factura C y Remito — overlay sobre formulario preimpreso**
- El sistema genera un PDF con **solo los datos variables** (fecha, datos del cliente, observaciones, items, total) posicionados con coordenadas exactas para superponerse sobre la plantilla preimpresa de AFIP.
- **El overlay NO imprime ningún número de comprobante.** Cada hoja de la plantilla preimpresa ya trae su propio número de fábrica (impreso por la imprenta habilitada junto con el resto del formulario, ej. "Punto de Venta: 0001-00001312"). El `numero` que genera el sistema (`empresa.contadores[tipo]`) es exclusivamente para el registro interno/búsqueda dentro del sistema — no tiene por qué coincidir con el número físico de la hoja y no se imprime.
- El empleado coloca la plantilla preimpresa en la impresora y la pasa por segunda vez con el PDF del sistema. El formulario físico (con CAI, número y pie de imprenta de la imprenta habilitada) **es el documento legal**; el sistema solo imprime los datos variables encima.
- Las coordenadas de cada campo se calibran durante la implementación contra los formularios físicos reales. El cliente debe proveer ejemplares de ambas empresas (MAD y MEPB) para la calibración.
- El "pie de imprenta" (sello de la imprenta habilitada con datos fiscales, número de comprobante y CAI) está preimpreso en el formulario — **el sistema no lo genera ni lo necesita**.
- El formulario preimpreso trae el recuadro/título ("FACTURA", código, encabezado de la empresa) y los encabezados de columna de la tabla (`Cant. | Código | Nom. Producto | Precio | Bonif. | Sub Total`), pero **no** trae los labels de los campos de datos ("Cliente:", "Dirección:", "Sit.IVA:", "Localidad:", "CUIT:", "Cond.Venta:", "Obs.:") ni la palabra "Total:" — esos los imprime el sistema junto con el valor (igual que el sistema legacy), en la misma posición fija de cada campo, y el label se imprime siempre aunque el valor esté vacío (ej. "Obs.:" sin nada al lado si no hay observaciones).

**Nota de Crédito C y Nota de Débito C — PDF completo en hoja en blanco**
- Misma estructura visual que Factura C pero generado en su totalidad (sin overlay).
- No tienen validez fiscal formal sin pie de imprenta, pero queda el registro en el sistema. Cuando el cliente adquiera talonarios impresos para estos tipos, el sistema ya los soporta y solo se cambia al flujo overlay.
- Campo adicional en el PDF: "Comprobante de referencia" (número de la factura original que se acredita/debita).

**Recibo de pago — PDF informal en hoja en blanco**
- Se imprime en hoja A4 normal, pero el contenido se ve como un ticket angosto y compacto (no como un recibo formal para completar a mano): datos en lista — Cliente / Forma de pago / Obs. — separados por líneas punteadas.
- Sin frases tipo "Recibí de... la suma de...". **No se muestra el número de Orden de Trabajo** en el impreso (aunque el recibo quede vinculado internamente por `ordenId`).
- Cuando el recibo es "por el total" (botón en la tabla de OT), incluye una tabla de ítems (Descripción / Cant. / P. Unit. / Subtotal) con el detalle de los productos de la orden, antes del total. Los recibos de pagos parciales (desde "Registrar pago") no llevan esta tabla — muestran solo el monto del pago de ese momento, sin desglose de ítems (porque no equivale al total de la orden).
- Sin CAI, sin pie de imprenta. No es documento fiscal.
- El número interno del recibo **no aparece** en el impreso.

### UX — Generación de comprobantes

**Factura C y Remito desde una OT (flujo principal, único lugar donde se generan):**
- En la tabla de OT, botones `Factura C` / `Remito`. Ambos usan directamente `empresaId` de la OT (ya no se pregunta la empresa) y, si la OT está vinculada a un cliente registrado, precargan sus datos fiscales completos y actuales (dirección, localidad, CUIT, condición IVA) — no solo lo que haya guardado la propia OT.
- Los dos abren el mismo sheet de revisión (`ConfirmarComprobanteSheet`, con el tipo como parámetro) con los datos del cliente **editables** (nombre, dirección, localidad, CUIT, condición IVA, condición de venta) y los ítems en solo lectura, antes de confirmar.
- **El CUIT es obligatorio solo para Factura C** (no para Remito) — no deja generar la factura sin completarlo.
- Al confirmar: genera el comprobante, lo deja guardado en la sección Comprobantes, **y en el mismo paso abre la vista previa de impresión** — no hace falta ir a la sección Comprobantes para imprimirlo.
- Si la OT no tiene `empresaId` (registros de antes de este campo), el botón avisa con un error en vez de abrir el sheet.
- Sin restricción por estado de pago: se puede generar en cualquier estado (PENDIENTE, PARCIAL o PAGADO).
- El comprobante queda vinculado a la OT (`ordenId`).

**Standalone (venta de mostrador sin OT previa):**
- Desde la sección Comprobantes, crear nuevo comprobante con formulario completo (empresa, tipo, cliente, items) — los ítems se eligen del catálogo de productos (combobox), igual que en presupuestos/OT.

**Presupuestos:** no generan comprobantes. La Factura C solo se genera desde la OT (ver arriba); un presupuesto se convierte primero en OT y desde ahí se factura.

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
