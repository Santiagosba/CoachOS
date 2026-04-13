import { Router, Response } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { requireAuth, requireTrainer, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth, requireTrainer)

// GET /programs?clientId=xxx
router.get('/', async (req: AuthRequest, res: Response) => {
  const { clientId } = req.query
  if (!clientId || typeof clientId !== 'string') {
    res.status(400).json({ error: 'clientId requerido' })
    return
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, trainerId: req.user!.id },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const programs = await prisma.program.findMany({
    where: { clientId },
    include: {
      weeks: {
        include: {
          days: {
            include: {
              exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(programs)
})

const programSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  weeks: z.array(
    z.object({
      weekNumber: z.number().int().min(1),
      days: z.array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          label: z.string().optional(),
          exercises: z.array(
            z.object({
              exerciseId: z.string().uuid(),
              order: z.number().int(),
              sets: z.number().int().min(1),
              reps: z.string(),
              rpe: z.number().optional(),
              notes: z.string().optional(),
            })
          ),
        })
      ),
    })
  ),
})

// POST /programs — crea programa completo
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = programSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { clientId, name, description, startDate, endDate, weeks } = parsed.data

  const client = await prisma.client.findFirst({
    where: { id: clientId, trainerId: req.user!.id },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const program = await prisma.$transaction(async (tx) => {
    await tx.program.updateMany({
      where: { clientId, active: true },
      data: { active: false },
    })

    return tx.program.create({
      data: {
        clientId,
        name,
        description,
        active: true,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        weeks: {
          create: weeks.map((w) => ({
            weekNumber: w.weekNumber,
            days: {
              create: w.days.map((d) => ({
                dayOfWeek: d.dayOfWeek,
                label: d.label,
                exercises: {
                  create: d.exercises.map((e) => ({
                    exerciseId: e.exerciseId,
                    order: e.order,
                    sets: e.sets,
                    reps: e.reps,
                    rpe: e.rpe,
                    notes: e.notes,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: { weeks: { include: { days: { include: { exercises: true } } } } },
    })
  })

  res.status(201).json(program)
})

// PATCH /programs/:id/activate
router.patch('/:id/activate', async (req: AuthRequest, res: Response) => {
  const program = await prisma.program.findFirst({
    where: { id: req.params.id, client: { trainerId: req.user!.id } },
    include: { client: true },
  })
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }

  const activatedProgram = await prisma.$transaction(async (tx) => {
    await tx.program.updateMany({
      where: { clientId: program.clientId, active: true },
      data: { active: false },
    })

    return tx.program.update({
      where: { id: program.id },
      data: { active: true },
    })
  })

  res.json(activatedProgram)
})

// GET /programs/:id — detalle completo
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const program = await prisma.program.findFirst({
    where: { id: req.params.id, client: { trainerId: req.user!.id } },
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
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }
  res.json(program)
})

// DELETE /programs/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const program = await prisma.program.findFirst({
    where: { id: req.params.id, client: { trainerId: req.user!.id } },
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
  })
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }

  const weekIds = program.weeks.map((week) => week.id)
  const dayIds = program.weeks.flatMap((week) => week.days.map((day) => day.id))
  const dayExerciseIds = program.weeks.flatMap((week) =>
    week.days.flatMap((day) => day.exercises.map((exercise) => exercise.id))
  )

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

    await tx.program.delete({ where: { id: req.params.id } })
  })

  res.status(204).send()
})

// ─── Endpoints incrementales ──────────────────────────────────────────────────

async function verifyProgramOwner(programId: string, trainerId: string) {
  return prisma.program.findFirst({
    where: { id: programId, client: { trainerId } },
  })
}

// POST /programs/:id/weeks — añade una semana
router.post('/:id/weeks', async (req: AuthRequest, res: Response) => {
  const program = await verifyProgramOwner(req.params.id, req.user!.id)
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }

  const last = await prisma.week.findFirst({
    where: { programId: req.params.id },
    orderBy: { weekNumber: 'desc' },
  })
  const weekNumber = (last?.weekNumber ?? 0) + 1

  const week = await prisma.week.create({
    data: { programId: req.params.id, weekNumber },
    include: { days: true },
  })
  res.status(201).json(week)
})

// DELETE /programs/:id/weeks/:weekId
router.delete('/:id/weeks/:weekId', async (req: AuthRequest, res: Response) => {
  const program = await verifyProgramOwner(req.params.id, req.user!.id)
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }
  await prisma.week.delete({ where: { id: Number(req.params.weekId) } })
  res.status(204).send()
})

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  label: z.string().optional(),
})

// POST /programs/:id/weeks/:weekId/days — añade un día
router.post('/:id/weeks/:weekId/days', async (req: AuthRequest, res: Response) => {
  const program = await verifyProgramOwner(req.params.id, req.user!.id)
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }

  const parsed = daySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const day = await prisma.day.create({
    data: { weekId: Number(req.params.weekId), ...parsed.data },
    include: { exercises: { include: { exercise: true } } },
  })
  res.status(201).json(day)
})

// DELETE /programs/:id/weeks/:weekId/days/:dayId
router.delete('/:id/weeks/:weekId/days/:dayId', async (req: AuthRequest, res: Response) => {
  const program = await verifyProgramOwner(req.params.id, req.user!.id)
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }
  await prisma.day.delete({ where: { id: Number(req.params.dayId) } })
  res.status(204).send()
})

const dayExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.number().int().min(1),
  reps: z.string().min(1),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
})

// POST /programs/:id/days/:dayId/exercises — añade ejercicio a un día
router.post('/:id/days/:dayId/exercises', async (req: AuthRequest, res: Response) => {
  const program = await verifyProgramOwner(req.params.id, req.user!.id)
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }

  const parsed = dayExerciseSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const last = await prisma.dayExercise.findFirst({
    where: { dayId: Number(req.params.dayId) },
    orderBy: { order: 'desc' },
  })
  const order = (last?.order ?? 0) + 1

  const dayExercise = await prisma.dayExercise.create({
    data: { dayId: Number(req.params.dayId), order, ...parsed.data },
    include: { exercise: true },
  })
  res.status(201).json(dayExercise)
})

// PATCH /programs/:id/days/:dayId/exercises/:exId — edita sets/reps/rpe
router.patch('/:id/days/:dayId/exercises/:exId', async (req: AuthRequest, res: Response) => {
  const program = await verifyProgramOwner(req.params.id, req.user!.id)
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }

  const parsed = dayExerciseSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const updated = await prisma.dayExercise.update({
    where: { id: Number(req.params.exId) },
    data: parsed.data,
    include: { exercise: true },
  })
  res.json(updated)
})

// DELETE /programs/:id/days/:dayId/exercises/:exId
router.delete('/:id/days/:dayId/exercises/:exId', async (req: AuthRequest, res: Response) => {
  const program = await verifyProgramOwner(req.params.id, req.user!.id)
  if (!program) {
    res.status(404).json({ error: 'Programa no encontrado' })
    return
  }
  await prisma.dayExercise.delete({ where: { id: Number(req.params.exId) } })
  res.status(204).send()
})

export default router
