import { setGlobalOptions } from 'firebase-functions'
import { onRequest } from 'firebase-functions/https'
import express from 'express'
import cors from 'cors'
import { errorHandler } from './shared/middleware/error-handler.js'
import { proveedoresRouter } from './modules/proveedores/proveedores.routes.js'
import { clientesRouter } from './modules/clientes/clientes.routes.js'
import { articulosRouter } from './modules/articulos/articulos.routes.js'
import { productosRouter } from './modules/productos/productos.routes.js'
import { productoArticulosRouter } from './modules/producto-articulos/producto-articulos.routes.js'
import { importarRouter } from './modules/importar/importar.routes.js'
import { comprasRouter } from './modules/compras/compras.routes.js'
import { presupuestosRouter } from './modules/presupuestos/presupuestos.routes.js'
import { ordenesRouter } from './modules/ordenes/ordenes.routes.js'
import { recibosRouter } from './modules/recibos/recibos.routes.js'
import { empresasRouter } from './modules/empresas/empresas.routes.js'
import { comprobantesRouter } from './modules/comprobantes/comprobantes.routes.js'

// Misma región que Firestore (southamerica-west1) para evitar latencia cross-region.
// maxInstances: límite para controlar costos.
setGlobalOptions({ region: 'southamerica-west1', maxInstances: 10 })

// Solo el hosting de producción (ambos dominios que da Firebase) y el entorno de
// desarrollo local (Vite) pueden llamar a la API.
const ALLOWED_ORIGINS = [
  'https://gestorcarrillon.web.app',
  'https://gestorcarrillon.firebaseapp.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const app = express()

app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

app.use('/v1/proveedores', proveedoresRouter)
app.use('/v1/clientes', clientesRouter)
app.use('/v1/articulos', articulosRouter)
app.use('/v1/productos', productosRouter)
app.use('/v1/producto-articulos', productoArticulosRouter)
app.use('/v1/importar', importarRouter)
app.use('/v1/compras', comprasRouter)
app.use('/v1/presupuestos', presupuestosRouter)
app.use('/v1/ordenes', ordenesRouter)
app.use('/v1/recibos', recibosRouter)
app.use('/v1/empresas', empresasRouter)
app.use('/v1/comprobantes', comprobantesRouter)

app.use(errorHandler)

export const api = onRequest(app)
