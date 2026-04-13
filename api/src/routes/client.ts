import { Router, Response } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

const SESSION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const
const SESSION_TYPES = ['PRESENCIAL', 'ONLINE'] as const

// Resuelve el Client del usuario logueado (rol CLIENT)
async function getMyClient(userId: string) {
  return prisma.client.findUnique({ where: { userId } })
}

async function getActiveProgram(clientId: string) {
  return prisma.program.findFirst({
    where: { clientId, active: true },
    orderBy: { createdAt: 'desc' },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          days: {
            orderBy: { dayOfWeek: 'asc' },
            include: {
              exercises: {
                orderBy: { order: 'asc' },
                include: { exercise: true },
              },
            },
          },
        },
      },
    },
  })
}

function resolveCurrentWeekNumber(program: Awaited<ReturnType<typeof getActiveProgram>>) {
  if (!program) return 1

  let weekNumber = 1
  if (program.startDate) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const elapsed = Date.now() - program.startDate.getTime()
    weekNumber = Math.max(1, Math.min(program.weeks.length, Math.floor(elapsed / msPerWeek) + 1))
  }

  return weekNumber
}

// ─── GET /client/today ────────────────────────────────────────────────────────
// Devuelve los ejercicios del día de hoy del programa activo.
// Calcula la semana actual basándose en startDate del programa.
// Si no hay startDate usa la semana 1.
router.get('/today', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
    return
  }

  const program = await getActiveProgram(client.id)

  if (!program) {
    res.json({ program: null, day: null })
    return
  }

  // Día de la semana: JS 0=Dom → nosotros 0=Lun
  const jsDay = new Date().getDay() // 0=Dom, 1=Lun ... 6=Sáb
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1 // 0=Lun ... 6=Dom

  // Semana actual basada en startDate
  const weekNumber = resolveCurrentWeekNumber(program)

  const week = program.weeks.find((w) => w.weekNumber === weekNumber) ?? program.weeks[0]
  if (!week) {
    res.json({ program: { id: program.id, name: program.name }, day: null })
    return
  }

  const day = week.days.find((d) => d.dayOfWeek === todayIndex) ?? null

  // ¿Ya hay un workout log de hoy?
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const existingLog = await prisma.workoutLog.findFirst({
    where: { clientId: client.id, date: { gte: todayStart, lte: todayEnd } },
    include: { sets: true },
  })

  res.json({
    program: { id: program.id, name: program.name },
    week: { id: week.id, weekNumber },
    day,
    existingLog,
  })
})

// ─── GET /client/program ─────────────────────────────────────────────────────
// Devuelve el programa activo completo para que el cliente pueda ver su rutina
// aunque hoy no le toque entrenar.
router.get('/program', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
    return
  }

  const program = await getActiveProgram(client.id)
  if (!program) {
    res.json({ program: null, currentWeekNumber: null })
    return
  }

  const currentWeekNumber = resolveCurrentWeekNumber(program)

  res.json({
    program: {
      id: program.id,
      name: program.name,
      description: program.description,
      startDate: program.startDate,
      endDate: program.endDate,
      weeks: program.weeks,
    },
    currentWeekNumber,
  })
})

// ─── GET /client/workouts ─────────────────────────────────────────────────────
router.get('/workouts', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
    return
  }

  const logs = await prisma.workoutLog.findMany({
    where: { clientId: client.id },
    orderBy: { date: 'desc' },
    take: 30,
    include: {
      sets: {
        include: { exercise: true },
        orderBy: [{ exercise: { name: 'asc' } }, { setNumber: 'asc' }],
      },
    },
  })

  res.json(logs)
})

// ─── POST /client/workouts ────────────────────────────────────────────────────
const logSetSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1),
  weight: z.number().min(0),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
})

const workoutSchema = z.object({
  notes: z.string().optional(),
  sets: z.array(logSetSchema).min(1),
})

router.post('/workouts', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
    return
  }

  const parsed = workoutSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const log = await prisma.workoutLog.create({
    data: {
      clientId: client.id,
      notes: parsed.data.notes,
      sets: {
        create: parsed.data.sets.map((s) => ({
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: s.reps,
          weight: s.weight,
          rpe: s.rpe,
          notes: s.notes,
        })),
      },
    },
    include: { sets: { include: { exercise: true } } },
  })

  res.status(201).json(log)
})

// ─── GET /client/workouts/:id ─────────────────────────────────────────────────
router.get('/workouts/:id', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
    return
  }

  const log = await prisma.workoutLog.findFirst({
    where: { id: req.params.id, clientId: client.id },
    include: {
      sets: {
        include: { exercise: true },
        orderBy: [{ exercise: { name: 'asc' } }, { setNumber: 'asc' }],
      },
    },
  })

  if (!log) {
    res.status(404).json({ error: 'Entrenamiento no encontrado' })
    return
  }

  res.json(log)
})

// ─── GET /client/progress/:exerciseId ────────────────────────────────────────
// Historial de peso máximo por fecha para un ejercicio concreto
router.get('/progress/:exerciseId', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
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
  const byDate: Record<string, number> = {}
  for (const s of sets) {
    const date = s.workoutLog.date.toISOString().split('T')[0]
    byDate[date] = Math.max(byDate[date] ?? 0, s.weight)
  }

  res.json(Object.entries(byDate).map(([date, maxWeight]) => ({ date, maxWeight })))
})

// ─── GET /client/sessions ────────────────────────────────────────────────────
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
    return
  }

  const sessions = await prisma.session.findMany({
    where: { clientId: client.id },
    orderBy: { date: 'asc' },
  })

  res.json(sessions)
})

const clientSessionSchema = z.object({
  date: z.string().datetime(),
  duration: z.number().int().min(15).max(180),
  type: z.enum(SESSION_TYPES).default('PRESENCIAL'),
  notes: z.string().trim().max(300).optional(),
})

// ─── POST /client/sessions ───────────────────────────────────────────────────
// Reserva simple: el cliente solicita una sesion y queda en estado PENDING.
router.post('/sessions', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
    return
  }

  const parsed = clientSessionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const sessionDate = new Date(parsed.data.date)
  if (Number.isNaN(sessionDate.getTime())) {
    res.status(400).json({ error: 'Fecha inválida' })
    return
  }

  if (sessionDate.getTime() <= Date.now()) {
    res.status(400).json({ error: 'La sesión debe ser futura' })
    return
  }

  const existing = await prisma.session.findFirst({
    where: {
      clientId: client.id,
      date: sessionDate,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  })

  if (existing) {
    res.status(409).json({ error: 'Ya tienes una sesión activa en esa fecha' })
    return
  }

  const session = await prisma.session.create({
    data: {
      clientId: client.id,
      date: sessionDate,
      duration: parsed.data.duration,
      type: parsed.data.type,
      notes: parsed.data.notes,
      status: 'PENDING',
      createdByRole: 'CLIENT',
    },
  })

  res.status(201).json(session)
})

const updateClientSessionStatusSchema = z.object({
  status: z.enum(SESSION_STATUSES),
})

// ─── PATCH /client/sessions/:id/status ───────────────────────────────────────
// El cliente puede confirmar o cancelar sus sesiones futuras no completadas.
router.patch('/sessions/:id/status', async (req: AuthRequest, res: Response) => {
  const client = await getMyClient(req.user!.id)
  if (!client) {
    res.status(404).json({ error: 'Perfil de cliente no encontrado' })
    return
  }

  const parsed = updateClientSessionStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const session = await prisma.session.findFirst({
    where: { id: req.params.id, clientId: client.id },
  })

  if (!session) {
    res.status(404).json({ error: 'Sesión no encontrada' })
    return
  }

  if (!['CANCELLED', 'CONFIRMED'].includes(parsed.data.status)) {
    res.status(403).json({ error: 'El cliente solo puede confirmar o cancelar sesiones' })
    return
  }

  if (session.status === parsed.data.status) {
    res.json(session)
    return
  }

  if (session.status === 'COMPLETED') {
    res.status(400).json({ error: 'No puedes modificar una sesión completada' })
    return
  }

  if (session.date.getTime() <= Date.now()) {
    res.status(400).json({ error: 'Solo puedes modificar sesiones futuras' })
    return
  }

  if (session.status === 'CANCELLED') {
    res.status(400).json({ error: 'No puedes modificar una sesión cancelada' })
    return
  }

  const updated = await prisma.session.update({
    where: { id: session.id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === 'CANCELLED' ? { cancelledByRole: 'CLIENT' } : {}),
      ...(parsed.data.status !== 'CANCELLED' ? { cancelledByRole: null } : {}),
    },
  })

  res.json(updated)
})

export default router
