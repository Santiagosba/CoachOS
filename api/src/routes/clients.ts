import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { requireAuth, requireTrainer, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth, requireTrainer)

const strongPasswordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir una minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir un número')

const createClientSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: strongPasswordSchema,
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  goal: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  birthDate: z.string().datetime().optional(),
})

// POST /clients — crea usuario cliente + perfil vinculado al trainer
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = createClientSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })
  if (existing) {
    res.status(409).json({ error: 'Email ya registrado' })
    return
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10)

  const created = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password: hashed,
      name: parsed.data.name,
      role: 'CLIENT',
      clientProfile: {
        create: {
          trainerId: req.user!.id,
          height: parsed.data.height,
          weight: parsed.data.weight,
          goal: parsed.data.goal,
          notes: parsed.data.notes,
          birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : undefined,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      clientProfile: true,
    },
  })

  res.status(201).json(created)
})

// GET /clients — lista todos los clientes del trainer
router.get('/', async (req: AuthRequest, res: Response) => {
  const clients = await prisma.client.findMany({
    where: { trainerId: req.user!.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(clients)
})

// GET /clients/:id — detalle de un cliente
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      programs: { orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] },
      sessions: { orderBy: { date: 'desc' }, take: 10 },
    },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }
  res.json(client)
})

// PATCH /clients/:id — actualiza métricas/notas
const updateClientSchema = z.object({
  height: z.number().optional(),
  weight: z.number().optional(),
  goal: z.string().optional(),
  notes: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  name: z.string().trim().min(1).optional(),
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = updateClientSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const client = await prisma.client.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const updated = await prisma.client.update({
    where: { id: req.params.id },
    data: {
      height: parsed.data.height,
      weight: parsed.data.weight,
      goal: parsed.data.goal,
      notes: parsed.data.notes,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : undefined,
      user: parsed.data.name
        ? {
            update: {
              name: parsed.data.name,
            },
          }
        : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      programs: { orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] },
      sessions: { orderBy: { date: 'desc' }, take: 10 },
    },
  })
  res.json(updated)
})

const updateClientPasswordSchema = z.object({
  password: strongPasswordSchema,
})

router.patch('/:id/password', async (req: AuthRequest, res: Response) => {
  const parsed = updateClientPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? 'La contraseña no cumple los requisitos'
    res.status(400).json({ error: firstError })
    return
  }

  const client = await prisma.client.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
    include: { user: true },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10)
  await prisma.user.update({
    where: { id: client.userId },
    data: { password: hashed },
  })

  res.json({ success: true })
})

// GET /clients/:id/workouts — historial de entrenamientos del cliente (para el trainer)
router.get('/:id/workouts', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const logs = await prisma.workoutLog.findMany({
    where: { clientId: client.id },
    orderBy: { date: 'desc' },
    take: 50,
    include: {
      sets: {
        include: { exercise: { select: { id: true, name: true, muscleGroup: true } } },
        orderBy: [{ exercise: { name: 'asc' } }, { setNumber: 'asc' }],
      },
    },
  })

  res.json(logs)
})

// GET /clients/:id/progress/:exerciseId — progreso de un ejercicio concreto
router.get('/:id/progress/:exerciseId', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const sets = await prisma.logSet.findMany({
    where: {
      exerciseId: req.params.exerciseId,
      workoutLog: { clientId: client.id },
    },
    include: { workoutLog: { select: { date: true } } },
    orderBy: { workoutLog: { date: 'asc' } },
  })

  // Agrupar por fecha: peso máximo del día
  const byDate: Record<string, { maxWeight: number; totalVolume: number; bestSet: string }> = {}
  for (const s of sets) {
    const date = s.workoutLog.date.toISOString().split('T')[0]
    if (!byDate[date]) byDate[date] = { maxWeight: 0, totalVolume: 0, bestSet: '' }
    byDate[date].maxWeight = Math.max(byDate[date].maxWeight, s.weight)
    byDate[date].totalVolume += s.reps * s.weight
    if (s.weight >= byDate[date].maxWeight) {
      byDate[date].bestSet = `${s.reps}×${s.weight}kg`
    }
  }

  res.json(
    Object.entries(byDate).map(([date, data]) => ({ date, ...data }))
  )
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
    include: {
      user: true,
      programs: {
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  exercises: true,
                },
              },
            },
          },
        },
      },
      workoutLogs: {
        include: {
          sets: true,
        },
      },
      sessions: true,
    },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const weekIds = client.programs.flatMap((program) => program.weeks.map((week) => week.id))
  const dayIds = client.programs.flatMap((program) =>
    program.weeks.flatMap((week) => week.days.map((day) => day.id))
  )
  const dayExerciseIds = client.programs.flatMap((program) =>
    program.weeks.flatMap((week) =>
      week.days.flatMap((day) => day.exercises.map((exercise) => exercise.id))
    )
  )
  const workoutLogIds = client.workoutLogs.map((log) => log.id)
  const logSetIds = client.workoutLogs.flatMap((log) => log.sets.map((set) => set.id))
  const sessionIds = client.sessions.map((session) => session.id)
  const programIds = client.programs.map((program) => program.id)

  await prisma.$transaction(async (tx) => {
    if (dayExerciseIds.length > 0) {
      await tx.dayExercise.deleteMany({
        where: { id: { in: dayExerciseIds } },
      })
    }

    if (dayIds.length > 0) {
      await tx.day.deleteMany({
        where: { id: { in: dayIds } },
      })
    }

    if (weekIds.length > 0) {
      await tx.week.deleteMany({
        where: { id: { in: weekIds } },
      })
    }

    if (programIds.length > 0) {
      await tx.program.deleteMany({
        where: { id: { in: programIds } },
      })
    }

    if (logSetIds.length > 0) {
      await tx.logSet.deleteMany({
        where: { id: { in: logSetIds } },
      })
    }

    if (workoutLogIds.length > 0) {
      await tx.workoutLog.deleteMany({
        where: { id: { in: workoutLogIds } },
      })
    }

    if (sessionIds.length > 0) {
      await tx.session.deleteMany({
        where: { id: { in: sessionIds } },
      })
    }

    await tx.client.delete({
      where: { id: client.id },
    })

    await tx.user.delete({
      where: { id: client.userId },
    })
  })

  res.status(204).send()
})

export default router
