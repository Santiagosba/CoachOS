import { Router, Response } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { requireAuth, requireTrainer, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth, requireTrainer)

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
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

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

async function verifyTemplateOwner(templateId: string, trainerId: string) {
  return prisma.programTemplate.findFirst({
    where: { id: templateId, trainerId },
  })
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const templates = await prisma.programTemplate.findMany({
    where: { trainerId: req.user!.id },
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
    orderBy: { createdAt: 'desc' },
  })

  res.json(
    templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      createdAt: template.createdAt,
      weeksCount: template.weeks.length,
      daysCount: template.weeks.reduce((acc, week) => acc + week.days.length, 0),
      exercisesCount: template.weeks.reduce(
        (acc, week) =>
          acc + week.days.reduce((dayAcc, day) => dayAcc + day.exercises.length, 0),
        0
      ),
    }))
  )
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = templateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const template = await prisma.programTemplate.create({
    data: {
      trainerId: req.user!.id,
      name: parsed.data.name,
      description: parsed.data.description,
      weeks: {
        create: parsed.data.weeks.map((week) => ({
          weekNumber: week.weekNumber,
          days: {
            create: week.days.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              label: day.label,
              exercises: {
                create: day.exercises.map((exercise) => ({
                  exerciseId: exercise.exerciseId,
                  order: exercise.order,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  rpe: exercise.rpe,
                  notes: exercise.notes,
                })),
              },
            })),
          },
        })),
      },
    },
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

  res.status(201).json(template)
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const template = await prisma.programTemplate.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
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

  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  res.json(template)
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = updateTemplateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const template = await verifyTemplateOwner(req.params.id, req.user!.id)
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  const updated = await prisma.programTemplate.update({
    where: { id: template.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
    },
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

  res.json(updated)
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const template = await prisma.programTemplate.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
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

  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  const weekIds = template.weeks.map((week) => week.id)
  const dayIds = template.weeks.flatMap((week) => week.days.map((day) => day.id))
  const exerciseIds = template.weeks.flatMap((week) =>
    week.days.flatMap((day) => day.exercises.map((exercise) => exercise.id))
  )

  await prisma.$transaction(async (tx) => {
    if (exerciseIds.length > 0) {
      await tx.programTemplateDayExercise.deleteMany({
        where: { id: { in: exerciseIds } },
      })
    }

    if (dayIds.length > 0) {
      await tx.programTemplateDay.deleteMany({
        where: { id: { in: dayIds } },
      })
    }

    if (weekIds.length > 0) {
      await tx.programTemplateWeek.deleteMany({
        where: { id: { in: weekIds } },
      })
    }

    await tx.programTemplate.delete({ where: { id: template.id } })
  })

  res.status(204).send()
})

router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  const parsed = z
    .object({
      clientId: z.string().uuid(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const template = await prisma.programTemplate.findFirst({
    where: { id: req.params.id, trainerId: req.user!.id },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          days: {
            orderBy: { dayOfWeek: 'asc' },
            include: {
              exercises: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
    },
  })

  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, trainerId: req.user!.id },
  })

  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const program = await prisma.$transaction(async (tx) => {
    await tx.program.updateMany({
      where: { clientId: client.id, active: true },
      data: { active: false },
    })

    return tx.program.create({
      data: {
        clientId: client.id,
        name: template.name,
        description: template.description,
        active: true,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
        weeks: {
          create: template.weeks.map((week) => ({
            weekNumber: week.weekNumber,
            days: {
              create: week.days.map((day) => ({
                dayOfWeek: day.dayOfWeek,
                label: day.label,
                exercises: {
                  create: day.exercises.map((exercise) => ({
                    exerciseId: exercise.exerciseId,
                    order: exercise.order,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    rpe: exercise.rpe,
                    notes: exercise.notes,
                  })),
                },
              })),
            },
          })),
        },
      },
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
  })

  res.status(201).json(program)
})

router.post('/:id/weeks', async (req: AuthRequest, res: Response) => {
  const template = await verifyTemplateOwner(req.params.id, req.user!.id)
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  const last = await prisma.programTemplateWeek.findFirst({
    where: { templateId: req.params.id },
    orderBy: { weekNumber: 'desc' },
  })

  const week = await prisma.programTemplateWeek.create({
    data: {
      templateId: req.params.id,
      weekNumber: (last?.weekNumber ?? 0) + 1,
    },
    include: { days: true },
  })

  res.status(201).json(week)
})

router.delete('/:id/weeks/:weekId', async (req: AuthRequest, res: Response) => {
  const template = await verifyTemplateOwner(req.params.id, req.user!.id)
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  await prisma.programTemplateWeek.delete({ where: { id: Number(req.params.weekId) } })
  res.status(204).send()
})

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  label: z.string().optional(),
})

router.post('/:id/weeks/:weekId/days', async (req: AuthRequest, res: Response) => {
  const template = await verifyTemplateOwner(req.params.id, req.user!.id)
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  const parsed = daySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const day = await prisma.programTemplateDay.create({
    data: { weekId: Number(req.params.weekId), ...parsed.data },
    include: { exercises: { include: { exercise: true } } },
  })

  res.status(201).json(day)
})

router.delete('/:id/weeks/:weekId/days/:dayId', async (req: AuthRequest, res: Response) => {
  const template = await verifyTemplateOwner(req.params.id, req.user!.id)
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  await prisma.programTemplateDay.delete({ where: { id: Number(req.params.dayId) } })
  res.status(204).send()
})

const exerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.number().int().min(1),
  reps: z.string().min(1),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
})

router.post('/:id/days/:dayId/exercises', async (req: AuthRequest, res: Response) => {
  const template = await verifyTemplateOwner(req.params.id, req.user!.id)
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  const parsed = exerciseSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const last = await prisma.programTemplateDayExercise.findFirst({
    where: { dayId: Number(req.params.dayId) },
    orderBy: { order: 'desc' },
  })

  const exercise = await prisma.programTemplateDayExercise.create({
    data: {
      dayId: Number(req.params.dayId),
      order: (last?.order ?? 0) + 1,
      ...parsed.data,
    },
    include: { exercise: true },
  })

  res.status(201).json(exercise)
})

router.patch('/:id/days/:dayId/exercises/:exId', async (req: AuthRequest, res: Response) => {
  const template = await verifyTemplateOwner(req.params.id, req.user!.id)
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  const parsed = exerciseSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const updated = await prisma.programTemplateDayExercise.update({
    where: { id: Number(req.params.exId) },
    data: parsed.data,
    include: { exercise: true },
  })

  res.json(updated)
})

router.delete('/:id/days/:dayId/exercises/:exId', async (req: AuthRequest, res: Response) => {
  const template = await verifyTemplateOwner(req.params.id, req.user!.id)
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' })
    return
  }

  await prisma.programTemplateDayExercise.delete({
    where: { id: Number(req.params.exId) },
  })
  res.status(204).send()
})

export default router
