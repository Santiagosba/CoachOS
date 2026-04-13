require('dotenv/config')

const path = require('path')
const { execFileSync } = require('child_process')
const { PrismaClient } = require('@prisma/client')

const targetDatabaseUrl = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL
const sourceSqlitePath = path.resolve(
  process.cwd(),
  process.env.SOURCE_SQLITE_PATH || './prisma/dev.db'
)

if (!targetDatabaseUrl) {
  console.error('Falta TARGET_DATABASE_URL o DATABASE_URL para la base PostgreSQL de destino.')
  process.exit(1)
}

if (targetDatabaseUrl.startsWith('file:')) {
  console.error('La base de destino sigue apuntando a SQLite. Define TARGET_DATABASE_URL con tu PostgreSQL.')
  process.exit(1)
}

process.env.DATABASE_URL = targetDatabaseUrl

const prisma = new PrismaClient()

function querySqlite(tableName) {
  try {
    const raw = execFileSync(
      'sqlite3',
      ['-json', sourceSqlitePath, `SELECT * FROM "${tableName}";`],
      { encoding: 'utf8' }
    ).trim()

    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.error(`No se pudo leer la tabla ${tableName} desde SQLite.`)
    throw error
  }
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key]
    if (!acc[value]) acc[value] = []
    acc[value].push(item)
    return acc
  }, {})
}

function toDate(value) {
  return value ? new Date(value) : null
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null
  return Number(value)
}

function toNullableString(value) {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

function toBoolean(value) {
  return value === true || value === 1 || value === '1'
}

async function clearTargetDatabase() {
  await prisma.logSet.deleteMany()
  await prisma.workoutLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.dayExercise.deleteMany()
  await prisma.day.deleteMany()
  await prisma.week.deleteMany()
  await prisma.program.deleteMany()
  await prisma.programTemplateDayExercise.deleteMany()
  await prisma.programTemplateDay.deleteMany()
  await prisma.programTemplateWeek.deleteMany()
  await prisma.programTemplate.deleteMany()
  await prisma.client.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.user.deleteMany()
}

async function main() {
  console.log(`Migrando desde SQLite: ${sourceSqlitePath}`)

  const users = querySqlite('User')
  const clients = querySqlite('Client')
  const exercises = querySqlite('Exercise')
  const programs = querySqlite('Program')
  const weeks = querySqlite('Week')
  const days = querySqlite('Day')
  const dayExercises = querySqlite('DayExercise')
  const programTemplates = querySqlite('ProgramTemplate')
  const templateWeeks = querySqlite('ProgramTemplateWeek')
  const templateDays = querySqlite('ProgramTemplateDay')
  const templateDayExercises = querySqlite('ProgramTemplateDayExercise')
  const sessions = querySqlite('Session')
  const workoutLogs = querySqlite('WorkoutLog')
  const logSets = querySqlite('LogSet')

  const weeksByProgramId = groupBy(weeks, 'programId')
  const daysByWeekId = groupBy(days, 'weekId')
  const dayExercisesByDayId = groupBy(dayExercises, 'dayId')

  const templateWeeksByTemplateId = groupBy(templateWeeks, 'templateId')
  const templateDaysByWeekId = groupBy(templateDays, 'weekId')
  const templateExercisesByDayId = groupBy(templateDayExercises, 'dayId')

  const logSetsByWorkoutLogId = groupBy(logSets, 'workoutLogId')

  console.log('Limpiando base PostgreSQL de destino...')
  await clearTargetDatabase()

  console.log(`Importando ${users.length} usuarios...`)
  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
        createdAt: toDate(user.createdAt) || new Date(),
        updatedAt: toDate(user.updatedAt) || new Date(),
      },
    })
  }

  console.log(`Importando ${clients.length} clientes...`)
  for (const client of clients) {
    await prisma.client.create({
      data: {
        id: client.id,
        createdAt: toDate(client.createdAt) || new Date(),
        updatedAt: toDate(client.updatedAt) || new Date(),
        user: { connect: { id: client.userId } },
        trainer: { connect: { id: client.trainerId } },
        birthDate: toDate(client.birthDate),
        height: toNullableNumber(client.height),
        weight: toNullableNumber(client.weight),
        goal: toNullableString(client.goal),
        notes: toNullableString(client.notes),
      },
    })
  }

  console.log(`Importando ${exercises.length} ejercicios...`)
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: {
        id: exercise.id,
        name: exercise.name,
        muscleGroup: toNullableString(exercise.muscleGroup),
        category: toNullableString(exercise.category),
        equipment: toNullableString(exercise.equipment),
        description: toNullableString(exercise.description),
        videoUrl: toNullableString(exercise.videoUrl),
      },
    })
  }

  console.log(`Importando ${programTemplates.length} plantillas...`)
  for (const template of programTemplates) {
    const nestedWeeks = (templateWeeksByTemplateId[template.id] || []).map((week) => ({
      weekNumber: week.weekNumber,
      days: {
        create: (templateDaysByWeekId[week.id] || []).map((day) => ({
          dayOfWeek: day.dayOfWeek,
          label: toNullableString(day.label),
          exercises: {
            create: (templateExercisesByDayId[day.id] || [])
              .sort((a, b) => a.order - b.order)
              .map((exercise) => ({
                order: exercise.order,
                sets: exercise.sets,
                reps: exercise.reps,
                rpe: toNullableNumber(exercise.rpe),
                notes: toNullableString(exercise.notes),
                exercise: { connect: { id: exercise.exerciseId } },
              })),
          },
        })),
      },
    }))

    await prisma.programTemplate.create({
      data: {
        id: template.id,
        name: template.name,
        description: toNullableString(template.description),
        createdAt: toDate(template.createdAt) || new Date(),
        updatedAt: toDate(template.updatedAt) || new Date(),
        trainer: { connect: { id: template.trainerId } },
        weeks: { create: nestedWeeks },
      },
    })
  }

  console.log(`Importando ${programs.length} programas asignados...`)
  for (const program of programs) {
    const nestedWeeks = (weeksByProgramId[program.id] || []).map((week) => ({
      weekNumber: week.weekNumber,
      days: {
        create: (daysByWeekId[week.id] || []).map((day) => ({
          dayOfWeek: day.dayOfWeek,
          label: toNullableString(day.label),
          exercises: {
            create: (dayExercisesByDayId[day.id] || [])
              .sort((a, b) => a.order - b.order)
              .map((exercise) => ({
                order: exercise.order,
                sets: exercise.sets,
                reps: exercise.reps,
                rpe: toNullableNumber(exercise.rpe),
                notes: toNullableString(exercise.notes),
                exercise: { connect: { id: exercise.exerciseId } },
              })),
          },
        })),
      },
    }))

    await prisma.program.create({
      data: {
        id: program.id,
        name: program.name,
        description: toNullableString(program.description),
        startDate: toDate(program.startDate),
        endDate: toDate(program.endDate),
        active: toBoolean(program.active),
        createdAt: toDate(program.createdAt) || new Date(),
        client: { connect: { id: program.clientId } },
        weeks: { create: nestedWeeks },
      },
    })
  }

  console.log(`Importando ${sessions.length} sesiones...`)
  for (const session of sessions) {
    await prisma.session.create({
      data: {
        id: session.id,
        date: toDate(session.date) || new Date(),
        duration: session.duration,
        type: session.type,
        status: session.status,
        createdByRole: session.createdByRole || 'TRAINER',
        cancelledByRole: toNullableString(session.cancelledByRole),
        notes: toNullableString(session.notes),
        createdAt: toDate(session.createdAt) || new Date(),
        client: { connect: { id: session.clientId } },
      },
    })
  }

  console.log(`Importando ${workoutLogs.length} registros de entrenamiento...`)
  for (const workoutLog of workoutLogs) {
    await prisma.workoutLog.create({
      data: {
        id: workoutLog.id,
        date: toDate(workoutLog.date) || new Date(),
        notes: toNullableString(workoutLog.notes),
        client: { connect: { id: workoutLog.clientId } },
        sets: {
          create: (logSetsByWorkoutLogId[workoutLog.id] || [])
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set) => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: Number(set.weight),
              rpe: toNullableNumber(set.rpe),
              notes: toNullableString(set.notes),
              exercise: { connect: { id: set.exerciseId } },
            })),
        },
      },
    })
  }

  console.log('Migración completada.')
  console.log(
    JSON.stringify(
      {
        users: users.length,
        clients: clients.length,
        exercises: exercises.length,
        templates: programTemplates.length,
        programs: programs.length,
        sessions: sessions.length,
        workoutLogs: workoutLogs.length,
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error('La migración falló.')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
