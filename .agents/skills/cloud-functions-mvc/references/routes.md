# Routes — Definición de endpoints

```ts
// modules/articulos/articulos.routes.ts
import { Router } from 'express'
import { articulosController } from './articulos.controller'
import { authenticate } from '../../shared/middleware/authenticate'
import { asyncHandler } from '../../shared/lib/async-handler'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

router.get('/',                                    asyncHandler(articulosController.getAll))
router.get('/:id',                                 asyncHandler(articulosController.getById))
router.post('/',                                   asyncHandler(articulosController.create))
router.patch('/:id',                               asyncHandler(articulosController.update))
router.delete('/:id',                              asyncHandler(articulosController.delete))
router.patch('/proveedor/:proveedorId/precios',    asyncHandler(articulosController.actualizarPreciosMasivo))

export { router as articulosRouter }
```

## Registro en index.ts

```ts
// functions/src/index.ts
import * as functions from 'firebase-functions'
import express from 'express'
import { articulosRouter } from './modules/articulos/articulos.routes'
import { clientesRouter }   from './modules/clientes/clientes.routes'
import { proveedoresRouter } from './modules/proveedores/proveedores.routes'
import { productosRouter }  from './modules/productos/productos.routes'
import { ventasRouter }     from './modules/ventas/ventas.routes'
import { authRouter }       from './modules/auth/auth.routes'
import { errorHandler }     from './shared/middleware/error-handler'

const app = express()
app.use(express.json())

app.use('/v1/auth',        authRouter)
app.use('/v1/articulos',   articulosRouter)
app.use('/v1/clientes',    clientesRouter)
app.use('/v1/proveedores', proveedoresRouter)
app.use('/v1/productos',   productosRouter)
app.use('/v1/ventas',      ventasRouter)

app.use(errorHandler)

export const api = functions.https.onRequest(app)
```

## asyncHandler helper

```ts
// shared/lib/async-handler.ts
import type { Request, Response, NextFunction, RequestHandler } from 'express'

export const asyncHandler = (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)
```
