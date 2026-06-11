import { Router } from 'express'
import { proveedoresController } from './proveedores.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

router.get('/',       asyncHandler(proveedoresController.getAll))
router.get('/:id',    asyncHandler(proveedoresController.getById))
router.post('/',      asyncHandler(proveedoresController.create))
router.patch('/:id',  asyncHandler(proveedoresController.update))
router.delete('/:id', asyncHandler(proveedoresController.delete))

export { router as proveedoresRouter }
