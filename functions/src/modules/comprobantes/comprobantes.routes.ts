import { Router } from 'express'
import { comprobantesController } from './comprobantes.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

router.use(authenticate)

router.get('/',       asyncHandler(comprobantesController.getAll))
router.get('/:id',    asyncHandler(comprobantesController.getById))
router.post('/',      asyncHandler(comprobantesController.create))
router.delete('/:id', asyncHandler(comprobantesController.delete))

export { router as comprobantesRouter }
