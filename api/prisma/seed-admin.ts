import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim() || 'admin@coachos.com'
  const password = process.env.ADMIN_PASSWORD?.trim() || 'Admin1234'
  const name = process.env.ADMIN_NAME?.trim() || 'Super Admin'
  const existing = await prisma.user.findUnique({ where: { email } })
  const hash = await bcrypt.hash(password, 10)

  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        name,
        password: hash,
        role: 'ADMIN',
      },
    })

    console.log(`✓ Admin actualizado: ${updated.email} / ${password}`)
    return
  }

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role: 'ADMIN',
    },
  })

  console.log(`✓ Admin creado: ${admin.email} / ${password}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
