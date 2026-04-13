import { Router, Response } from 'express'
import { AuthRequest, requireAuth } from '../middleware/auth'
import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const router = Router()

// ─── Middleware ───────────────────────────────────────────────────────────────

function requireAdmin(req: AuthRequest, res: Response, next: Function) {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Solo para administradores' })
    return
  }
  next()
}

router.use(requireAuth)
router.use(requireAdmin)

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [trainers, clients, sessions, workouts] = await Promise.all([
      prisma.user.count({ where: { role: 'TRAINER' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.session.count(),
      prisma.workoutLog.count(),
    ])

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    res.json({ trainers, clients, sessions, workouts, recentUsers })
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// ─── Users (all) ──────────────────────────────────────────────────────────────

router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { role, q } = req.query as { role?: string; q?: string }

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        clientProfile: {
          select: {
            id: true,
            goal: true,
            weight: true,
            height: true,
            trainer: { select: { id: true, name: true, email: true } },
          },
        },
        clients: {
          select: { id: true },
        },
      },
    })

    res.json(users)
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// ─── Single user ──────────────────────────────────────────────────────────────

router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        clientProfile: {
          include: {
            trainer: { select: { id: true, name: true, email: true } },
            programs: { select: { id: true, name: true, active: true } },
            sessions: {
              orderBy: { date: 'desc' },
              take: 10,
              select: { id: true, date: true, type: true, status: true, duration: true },
            },
            workoutLogs: {
              orderBy: { date: 'desc' },
              take: 10,
              select: { id: true, date: true, notes: true },
            },
          },
        },
        clients: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            programs: { select: { id: true, name: true, active: true } },
            sessions: {
              orderBy: { date: 'desc' },
              take: 5,
              select: { id: true, date: true, status: true, type: true },
            },
          },
        },
      },
    })

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
})

// ─── Create user ──────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['TRAINER', 'CLIENT', 'ADMIN']),
  trainerId: z.string().optional(), // required if role=CLIENT
})

router.post('/users', async (req: AuthRequest, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { name, email, password, role, trainerId } = parsed.data

  try {
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      res.status(409).json({ error: 'Ya existe un usuario con ese email' })
      return
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role,
        ...(role === 'CLIENT' && trainerId
          ? {
              clientProfile: {
                create: { trainerId },
              },
            }
          : {}),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    res.status(201).json(user)
  } catch (e: any) {
    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

// ─── Update user ──────────────────────────────────────────────────────────────

const updateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('El email no tiene un formato válido').optional(),
  role: z.enum(['TRAINER', 'CLIENT', 'ADMIN']).optional(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .optional(),
})

router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { name, email, role, password } = parsed.data

  // Check email not already taken by another user
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== req.params.id) {
      res.status(409).json({ error: 'Este email ya está en uso por otro usuario' })
      return
    }
  }

  try {
    const data: any = {}
    if (name) data.name = name
    if (email) data.email = email
    if (role) data.role = role
    if (password) data.password = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    })

    res.json(user)
  } catch (e: any) {
    if (e.code === 'P2025') res.status(404).json({ error: 'Usuario no encontrado' })
    else if (e.code === 'P2002') res.status(409).json({ error: 'Este email ya está en uso por otro usuario' })
    else res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

// ─── Delete user ──────────────────────────────────────────────────────────────

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  // Can't delete yourself
  if (req.params.id === req.user?.id) {
    res.status(400).json({ error: 'No puedes eliminarte a ti mismo' })
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { clientProfile: true },
    })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    await prisma.$transaction(async (tx) => {
      if (user.clientProfile) {
        // Delete workout logs + sets
        const logs = await tx.workoutLog.findMany({ where: { clientId: user.clientProfile!.id } })
        for (const log of logs) {
          await tx.logSet.deleteMany({ where: { workoutLogId: log.id } })
        }
        await tx.workoutLog.deleteMany({ where: { clientId: user.clientProfile!.id } })

        // Delete sessions
        await tx.session.deleteMany({ where: { clientId: user.clientProfile!.id } })

        // Delete programs (cascade: weeks→days→dayExercises)
        const programs = await tx.program.findMany({ where: { clientId: user.clientProfile!.id } })
        for (const prog of programs) {
          const weeks = await tx.week.findMany({ where: { programId: prog.id } })
          for (const week of weeks) {
            const days = await tx.day.findMany({ where: { weekId: week.id } })
            for (const day of days) {
              await tx.dayExercise.deleteMany({ where: { dayId: day.id } })
            }
            await tx.day.deleteMany({ where: { weekId: week.id } })
          }
          await tx.week.deleteMany({ where: { programId: prog.id } })
          await tx.program.delete({ where: { id: prog.id } })
        }

        await tx.client.delete({ where: { id: user.clientProfile!.id } })
      }

      await tx.user.delete({ where: { id: req.params.id } })
    })

    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
})

// ─── Trainers with stats ──────────────────────────────────────────────────────

router.get('/trainers', async (_req: AuthRequest, res: Response) => {
  try {
    const trainers = await prisma.user.findMany({
      where: { role: 'TRAINER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        clients: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
            goal: true,
            weight: true,
          },
        },
      },
    })

    res.json(trainers)
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener entrenadores' })
  }
})

export default router
