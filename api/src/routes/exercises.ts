import { Router, Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

// GET /exercises?q=bench — búsqueda por nombre
router.get('/', async (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q : ''
  const category = typeof req.query.category === 'string' ? req.query.category : ''
  const exercises = await prisma.exercise.findMany({
    where: {
      ...(q ? { name: { contains: q } } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { name: 'asc' },
    take: 50,
  })
  res.json(exercises)
})

// GET /exercises/:id
router.get('/:id', async (req: Request, res: Response) => {
  const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } })
  if (!exercise) {
    res.status(404).json({ error: 'Ejercicio no encontrado' })
    return
  }
  res.json(exercise)
})

const exerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.string().optional(),
  category: z.string().optional(),
  equipment: z.string().optional(),
  description: z.string().optional(),
  videoUrl: z.string().url().optional(),
})

// POST /exercises
router.post('/', async (req: Request, res: Response) => {
  const parsed = exerciseSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  try {
    const exercise = await prisma.exercise.create({ data: parsed.data })
    res.status(201).json(exercise)
  } catch {
    res.status(409).json({ error: 'Ya existe un ejercicio con ese nombre' })
  }
})

export default router
