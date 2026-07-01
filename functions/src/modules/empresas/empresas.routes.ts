import { Router } from 'express'
import { empresasController } from './empresas.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

router.use(authenticate)

router.get('/',       asyncHandler(empresasController.getAll))
router.get('/:id',    asyncHandler(empresasController.getById))
router.post('/',      asyncHandler(empresasController.create))
router.patch('/:id',  asyncHandler(empresasController.update))
router.delete('/:id', asyncHandler(empresasController.delete))

export { router as empresasRouter }
