import { Router } from 'express'
import { productosController } from './productos.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

router.get('/',       asyncHandler(productosController.getAll))
router.get('/:id',    asyncHandler(productosController.getById))
router.post('/',      asyncHandler(productosController.create))
router.patch('/:id',  asyncHandler(productosController.update))
router.delete('/:id', asyncHandler(productosController.delete))

export { router as productosRouter }
