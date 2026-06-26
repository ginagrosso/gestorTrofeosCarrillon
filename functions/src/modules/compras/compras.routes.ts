import { Router } from 'express'
import { comprasController } from './compras.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

router.use(authenticate)

router.get('/',      asyncHandler(comprasController.getAll))
router.get('/:id',   asyncHandler(comprasController.getById))
router.post('/',     asyncHandler(comprasController.create))
router.delete('/:id', asyncHandler(comprasController.delete))

export { router as comprasRouter }
