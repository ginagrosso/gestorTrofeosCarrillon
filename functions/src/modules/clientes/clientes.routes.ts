import { Router } from 'express'
import { clientesController } from './clientes.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

router.get('/',       asyncHandler(clientesController.getAll))
router.get('/:id',    asyncHandler(clientesController.getById))
router.post('/',      asyncHandler(clientesController.create))
router.patch('/:id',  asyncHandler(clientesController.update))
router.delete('/:id', asyncHandler(clientesController.delete))

export { router as clientesRouter }
