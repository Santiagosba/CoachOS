# CoachOS

CoachOS es una app para entrenadores personales y sus clientes.

El producto tiene dos caras:

- PT: gestion de clientes, programas, calendario y operativa diaria.
- Cliente: entrenamiento del dia, registro de series y progreso.

## Stack actual

- App movil: React Native + Expo Router
- API: Node.js + Express + TypeScript
- ORM: Prisma
- Base de datos actual: SQLite

Nota: la idea original menciona PostgreSQL. El prototipo actual usa SQLite y puede migrarse mas adelante a PostgreSQL sin cambiar la estructura general del producto.

## Lo que ya existe en el proyecto

### App cliente

- Login
- Pantalla "hoy" con el entrenamiento del dia
- Registro de entrenamiento por series, reps, peso y RPE
- Historial de entrenamientos
- Pantalla de sesiones

### App trainer

- Dashboard inicial
- Lista de clientes
- Detalle de cliente
- Creacion y gestion de programas
- Calendario de sesiones

### API disponible

- `POST /auth/*`
- `GET /clients`
- `GET /clients/:id`
- `PATCH /clients/:id`
- `GET /programs`
- `POST /programs`
- `GET /programs/:id`
- `DELETE /programs/:id`
- `POST /programs/:id/weeks`
- `POST /programs/:id/weeks/:weekId/days`
- `GET /sessions`
- `POST /sessions`
- `PATCH /sessions/:id/status`
- `DELETE /sessions/:id`
- `GET /client/today`
- `GET /client/workouts`
- `POST /client/workouts`
- `GET /client/workouts/:id`
- `GET /client/progress/:exerciseId`

## Modelo de dominio actual

Las entidades principales ya definidas son:

- `User`
- `Client`
- `Program`
- `Week`
- `Day`
- `Exercise`
- `DayExercise`
- `WorkoutLog`
- `LogSet`
- `Session`

Esto cubre bien el nucleo del producto: clientes, programacion del entrenamiento, registro y agenda.

## Lo que falta para el MVP completo

- Cobros y facturacion con Stripe
- Reserva/cancelacion de sesiones por parte del cliente
- Graficas de progreso reales
- Chat entre PT y cliente
- Notificaciones push
- Migracion a PostgreSQL para entorno productivo

## Prioridad recomendada

1. Consolidar auth, roles y flujos actuales
2. Mejorar programas y registro de entrenamiento
3. Completar sesiones y reservas para cliente
4. Añadir pagos con Stripe
5. Añadir progreso visual y analytics
6. Añadir chat y notificaciones

## Estructura del repo

- [`app`](/Users/santiago/santi/CoachOS/app): app Expo para trainer y cliente
- [`api`](/Users/santiago/santi/CoachOS/api): API Express con Prisma
- [`api/prisma/schema.prisma`](/Users/santiago/santi/CoachOS/api/prisma/schema.prisma): modelo de datos actual
- [`docs/roadmap.md`](/Users/santiago/santi/CoachOS/docs/roadmap.md): roadmap propuesto del producto

## Siguiente paso sugerido

El siguiente salto mas util es cerrar un MVP real con alcance pequeno:

- PT crea cliente
- PT asigna programa
- Cliente ve el entreno del dia
- Cliente registra pesos y reps
- PT agenda sesiones
- Cliente reserva o cancela
- Cliente paga su plan

Con eso ya tienes una version que se puede enseñar, probar y empezar a validar con usuarios reales.
