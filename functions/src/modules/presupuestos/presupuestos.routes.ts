import { Router } from 'express'
import { presupuestosController } from './presupuestos.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

router.use(authenticate)

router.get('/',      asyncHandler(presupuestosController.getAll))
router.get('/:id',   asyncHandler(presupuestosController.getById))
router.post('/',     asyncHandler(presupuestosController.create))
router.patch('/:id', asyncHandler(presupuestosController.update))
router.delete('/:id', asyncHandler(presupuestosController.delete))

export { router as presupuestosRouter }
