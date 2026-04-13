import { Router, Response } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { requireAuth, requireTrainer, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth, requireTrainer)

// GET /sessions?clientId=xxx&from=&to=
router.get('/', async (req: AuthRequest, res: Response) => {
  const { clientId, from, to } = req.query

  const where: any = { client: { trainerId: req.user!.id } }
  if (clientId) where.clientId = clientId
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from as string)
    if (to) where.date.lte = new Date(to as string)
  }

  const sessions = await prisma.session.findMany({
    where,
    include: { client: { include: { user: { select: { name: true } } } } },
    orderBy: { date: 'asc' },
  })
  res.json(sessions)
})

const sessionSchema = z.object({
  clientId: z.string().uuid(),
  date: z.string().datetime(),
  duration: z.number().int().min(15),
  type: z.enum(['PRESENCIAL', 'ONLINE']).default('PRESENCIAL'),
  notes: z.string().optional(),
})

// POST /sessions
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = sessionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, trainerId: req.user!.id },
  })
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const session = await prisma.session.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      createdByRole: 'TRAINER',
    },
  })
  res.status(201).json(session)
})

// PATCH /sessions/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const { status } = req.body
  const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Estado inválido' })
    return
  }

  const session = await prisma.session.findFirst({
    where: { id: req.params.id, client: { trainerId: req.user!.id } },
  })
  if (!session) {
    res.status(404).json({ error: 'Sesión no encontrada' })
    return
  }

  const updated = await prisma.session.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(status === 'CANCELLED' ? { cancelledByRole: 'TRAINER' } : {}),
      ...(status !== 'CANCELLED' ? { cancelledByRole: null } : {}),
    },
  })
  res.json(updated)
})

// DELETE /sessions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const session = await prisma.session.findFirst({
    where: { id: req.params.id, client: { trainerId: req.user!.id } },
  })
  if (!session) {
    res.status(404).json({ error: 'Sesión no encontrada' })
    return
  }
  await prisma.session.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
