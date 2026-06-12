import { Router } from 'express'
import { importarController } from './importar.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

router.post('/proveedores', asyncHandler(importarController.proveedores))
router.post('/clientes',    asyncHandler(importarController.clientes))
router.post('/articulos',   asyncHandler(importarController.articulos))

export { router as importarRouter }
