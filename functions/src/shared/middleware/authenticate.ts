import type { Request, Response, NextFunction } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { AppError } from '../lib/app-error.js'

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Token de autenticación requerido'))
    return
  }

  try {
    const token = authHeader.split('Bearer ')[1]
    req.user = await getAuth().verifyIdToken(token)
    next()
  } catch {
    next(new AppError(401, 'Token inválido o expirado'))
  }
}
