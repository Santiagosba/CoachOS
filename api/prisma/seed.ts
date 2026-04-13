import prisma from '../src/lib/prisma'

const exercises = [
  // Pecho
  { name: 'Press banca plano', muscleGroup: 'Pecho' },
  { name: 'Press banca inclinado', muscleGroup: 'Pecho' },
  { name: 'Press banca declinado', muscleGroup: 'Pecho' },
  { name: 'Aperturas con mancuernas', muscleGroup: 'Pecho' },
  { name: 'Fondos en paralelas', muscleGroup: 'Pecho' },
  { name: 'Crossover en polea', muscleGroup: 'Pecho' },
  { name: 'Press con mancuernas plano', muscleGroup: 'Pecho' },

  // Espalda
  { name: 'Dominadas', muscleGroup: 'Espalda' },
  { name: 'Remo con barra', muscleGroup: 'Espalda' },
  { name: 'Remo con mancuerna', muscleGroup: 'Espalda' },
  { name: 'Jalón al pecho', muscleGroup: 'Espalda' },
  { name: 'Jalón trasnuca', muscleGroup: 'Espalda' },
  { name: 'Peso muerto', muscleGroup: 'Espalda' },
  { name: 'Peso muerto rumano', muscleGroup: 'Espalda' },
  { name: 'Remo en máquina', muscleGroup: 'Espalda' },
  { name: 'Pull-over con polea', muscleGroup: 'Espalda' },

  // Hombros
  { name: 'Press militar con barra', muscleGroup: 'Hombros' },
  { name: 'Press con mancuernas sentado', muscleGroup: 'Hombros' },
  { name: 'Elevaciones laterales', muscleGroup: 'Hombros' },
  { name: 'Elevaciones frontales', muscleGroup: 'Hombros' },
  { name: 'Pájaro (elevaciones posteriores)', muscleGroup: 'Hombros' },
  { name: 'Face pull', muscleGroup: 'Hombros' },

  // Bíceps
  { name: 'Curl con barra', muscleGroup: 'Bíceps' },
  { name: 'Curl con mancuernas', muscleGroup: 'Bíceps' },
  { name: 'Curl martillo', muscleGroup: 'Bíceps' },
  { name: 'Curl en banco Scott', muscleGroup: 'Bíceps' },
  { name: 'Curl en polea baja', muscleGroup: 'Bíceps' },

  // Tríceps
  { name: 'Press francés', muscleGroup: 'Tríceps' },
  { name: 'Fondos en banco', muscleGroup: 'Tríceps' },
  { name: 'Extensión en polea alta', muscleGroup: 'Tríceps' },
  { name: 'Press cerrado', muscleGroup: 'Tríceps' },
  { name: 'Patada de tríceps', muscleGroup: 'Tríceps' },

  // Piernas
  { name: 'Sentadilla con barra', muscleGroup: 'Piernas' },
  { name: 'Sentadilla goblet', muscleGroup: 'Piernas' },
  { name: 'Prensa de piernas', muscleGroup: 'Piernas' },
  { name: 'Extensión de cuádriceps', muscleGroup: 'Piernas' },
  { name: 'Curl femoral tumbado', muscleGroup: 'Piernas' },
  { name: 'Curl femoral sentado', muscleGroup: 'Piernas' },
  { name: 'Hip thrust', muscleGroup: 'Piernas' },
  { name: 'Zancadas', muscleGroup: 'Piernas' },
  { name: 'Zancadas búlgaras', muscleGroup: 'Piernas' },
  { name: 'Elevación de talones de pie', muscleGroup: 'Piernas' },
  { name: 'Elevación de talones sentado', muscleGroup: 'Piernas' },
  { name: 'Abductor en máquina', muscleGroup: 'Piernas' },
  { name: 'Aductor en máquina', muscleGroup: 'Piernas' },

  // Core
  { name: 'Plancha', muscleGroup: 'Core' },
  { name: 'Crunch abdominal', muscleGroup: 'Core' },
  { name: 'Rueda abdominal', muscleGroup: 'Core' },
  { name: 'Elevación de piernas colgado', muscleGroup: 'Core' },
  { name: 'Russian twist', muscleGroup: 'Core' },
  { name: 'Dead bug', muscleGroup: 'Core' },
]

async function main() {
  console.log('Seeding exercises...')
  let created = 0

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: ex,
    })
    created++
  }

  console.log(`Done: ${created} exercises upserted`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
