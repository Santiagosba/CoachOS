import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { id: string; role: string }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

export function requireTrainer(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'TRAINER' && req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Solo para trainers' })
    return
  }
  next()
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Solo para administradores' })
    return
  }
  next()
}
