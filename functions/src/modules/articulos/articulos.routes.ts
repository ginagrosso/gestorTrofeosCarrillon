import { Router } from 'express'
import { articulosController } from './articulos.controller.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { asyncHandler } from '../../shared/lib/async-handler.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

router.get('/', asyncHandler(articulosController.getAll))

export { router as articulosRouter }
