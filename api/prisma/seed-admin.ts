import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@coachos.com'
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    console.log(`✓ Admin ya existe: ${email}`)
    return
  }

  const hash = await bcrypt.hash('Admin1234', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email,
      password: hash,
      role: 'ADMIN',
    },
  })

  console.log(`✓ Admin creado: ${admin.email} / Admin1234`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
