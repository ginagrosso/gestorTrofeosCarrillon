import { Router } from 'express'
import { productosController } from './productos.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

router.get('/', asyncHandler(productosController.getAll))

export { router as productosRouter }
