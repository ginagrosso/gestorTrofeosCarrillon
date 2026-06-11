import { setGlobalOptions } from 'firebase-functions'
import { onRequest } from 'firebase-functions/https'
import express from 'express'
import cors from 'cors'
import { errorHandler } from './shared/middleware/error-handler.js'
import { proveedoresRouter } from './modules/proveedores/proveedores.routes.js'
import { clientesRouter } from './modules/clientes/clientes.routes.js'
import { articulosRouter } from './modules/articulos/articulos.routes.js'

// Para controlar costos: máximo de instancias concurrentes por función.
setGlobalOptions({ maxInstances: 10 })

const app = express()

app.use(cors({ origin: true }))
app.use(express.json())

app.use('/v1/proveedores', proveedoresRouter)
app.use('/v1/clientes', clientesRouter)
app.use('/v1/articulos', articulosRouter)

app.use(errorHandler)

export const api = onRequest(app)
