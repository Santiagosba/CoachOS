# CoachOS

CoachOS es una app para entrenadores personales y sus clientes.

El producto tiene dos caras:

- PT: gestion de clientes, programas, calendario y operativa diaria.
- Cliente: entrenamiento del dia, registro de series y progreso.

## Stack actual

- App movil: React Native + Expo Router
- API: Node.js + Express + TypeScript
- ORM: Prisma
- Base de datos actual: PostgreSQL para produccion, con script de migracion desde SQLite local

Nota: el proyecto ya esta preparado para desplegar la API con PostgreSQL y mover los datos desde la SQLite local del prototipo.

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

## Despliegue rapido de API

Para desplegar en Render:

1. Crea una base PostgreSQL y copia su `DATABASE_URL`
2. Configura el servicio usando [`render.yaml`](/Users/santiago/santi/CoachOS/render.yaml)
3. Define variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGINS`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_NAME`

Comandos utiles en [`api`](/Users/santiago/santi/CoachOS/api):

- `npm run db:push`: crea o sincroniza el esquema en PostgreSQL
- `npm run db:seed-admin`: crea o actualiza el admin
- `npm run db:setup-production`: prepara esquema + admin
- `npm run db:migrate-sqlite`: mueve los datos desde `prisma/dev.db` a PostgreSQL

## Conexion app + API en produccion

Para que la web publicada funcione con la API desplegada:

1. En la API define `CORS_ORIGINS` con la URL exacta del frontend, por ejemplo:
   - `https://coachos.netlify.app`
2. En la app define `EXPO_PUBLIC_API_URL` apuntando a tu API publica, por ejemplo:
   - `https://coachos-api.onrender.com`
3. La web de Netlify debe reconstruirse con esa variable disponible en build.

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
