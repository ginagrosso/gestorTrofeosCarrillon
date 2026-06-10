import { setGlobalOptions } from 'firebase-functions'
import { onRequest } from 'firebase-functions/https'
import express from 'express'
import cors from 'cors'
import { errorHandler } from './shared/middleware/error-handler.js'

// Para controlar costos: máximo de instancias concurrentes por función.
setGlobalOptions({ maxInstances: 10 })

const app = express()

app.use(cors({ origin: true }))
app.use(express.json())

// Los routers de cada módulo se registran acá, ej:
// app.use('/v2/articulos', articulosRouter)

app.use(errorHandler)

export const api = onRequest(app)
