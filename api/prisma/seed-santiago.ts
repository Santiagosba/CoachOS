import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_TRAINER_EMAIL ?? ''
  const password = process.env.SEED_TRAINER_PASSWORD ?? ''

  if (!email || !password) {
    console.log('⚠ SEED_TRAINER_EMAIL / SEED_TRAINER_PASSWORD no definidos, omitiendo.')
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✓ Usuario ya existe: ${email}`)
    return
  }

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name: 'Santiago',
      email,
      password: hash,
      role: 'TRAINER',
    },
  })

  console.log(`✓ Usuario creado: ${user.email} | rol: ${user.role}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
