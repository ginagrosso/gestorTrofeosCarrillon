import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'
import { recibosController } from './recibos.controller.js'

export const recibosRouter = Router()

recibosRouter.use(authenticate)
recibosRouter.get('/',     asyncHandler(recibosController.getAll))
recibosRouter.get('/:id',  asyncHandler(recibosController.getById))
recibosRouter.post('/',    asyncHandler(recibosController.create))
recibosRouter.delete('/:id', asyncHandler(recibosController.delete))
