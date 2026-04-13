import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../lib/prisma'

const router = Router()

const strongPasswordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir una minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir un número')

const registerSchema = z.object({
  email: z.string().email(),
  password: strongPasswordSchema,
  name: z.string().trim().min(3),
  role: z.enum(['TRAINER', 'CLIENT']),
  trainerId: z.string().uuid().optional(), // requerido si role=CLIENT
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { email, password, name, role, trainerId } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Email ya registrado' })
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashed, name, role },
    select: { id: true, email: true, name: true, role: true },
  })

  if (role === 'CLIENT') {
    if (!trainerId) {
      res.status(400).json({ error: 'trainerId requerido para clientes' })
      return
    }
    await prisma.client.create({
      data: { userId: user.id, trainerId },
    })
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  })

  res.status(201).json({ user, token })
})

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  })

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  })
})

export default router
