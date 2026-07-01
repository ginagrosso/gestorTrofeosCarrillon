import { Router } from 'express'
import { ordenesController } from './ordenes.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

router.use(authenticate)

router.get('/',           asyncHandler(ordenesController.getAll))
router.get('/:id',        asyncHandler(ordenesController.getById))
router.post('/',          asyncHandler(ordenesController.create))
router.patch('/:id/pago', asyncHandler(ordenesController.updatePago))
router.delete('/:id',     asyncHandler(ordenesController.delete))

export { router as ordenesRouter }
