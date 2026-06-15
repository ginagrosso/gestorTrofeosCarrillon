import { Router } from 'express'
import { productoArticulosController } from './producto-articulos.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

router.get('/', asyncHandler(productoArticulosController.getAll))
router.get('/:productoId', asyncHandler(productoArticulosController.getByProducto))
router.put('/:productoId', asyncHandler(productoArticulosController.replaceForProducto))

export { router as productoArticulosRouter }
