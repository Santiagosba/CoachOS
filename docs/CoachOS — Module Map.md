# CoachOS — Module Map
#architecture #modules

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│                    EXPO APP                          │
│                                                      │
│  auth-store (Zustand) ←→ session-storage            │
│         │                                            │
│    api.ts (Axios) → Bearer JWT                       │
│         │                                            │
│  ┌──────┴──────┐         ┌────────────┐             │
│  │  TRAINER    │         │   CLIENT   │             │
│  │  Dashboard  │         │  Today     │             │
│  │  Clients    │         │  Log       │             │
│  │  Programs   │         │  Progress  │             │
│  │  Calendar   │         │  Sessions  │             │
│  └─────────────┘         └────────────┘             │
└─────────────────────────────────────────────────────┘
                    │ HTTP REST
┌─────────────────────────────────────────────────────┐
│                  EXPRESS API                         │
│                                                      │
│  /auth  /clients  /programs  /exercises              │
│  /sessions  /client (self-service)                   │
│                                                      │
│         Prisma ORM                                   │
│              │                                       │
│         SQLite (dev) / PostgreSQL (prod)             │
└─────────────────────────────────────────────────────┘
```

## Key Data Relations
- `User` (TRAINER) → `Client[]` via `trainerId`
- `User` (CLIENT) → `Client` (1:1) via `userId`
- `Client` → `Program[]` → `Week[]` → `Day[]` → `DayExercise[]` → `Exercise`
- `Client` → `WorkoutLog[]` → `LogSet[]` → `Exercise`
- `Client` → `Session[]`

## Authentication Flow
```
1. POST /auth/login → { user, token }
2. Token stored in session-storage
3. Axios interceptor adds Bearer header on every request
4. requireAuth middleware validates JWT, attaches req.user
5. requireTrainer checks role === 'TRAINER'
```

## Program Builder Flow (Trainer)
```
Client detail
  → "+" new program
  → programs/new.tsx (name, weeks count, day selection, labels)
  → POST /programs (creates full structure in one call)
  → programs/[id]/index.tsx (weeks accordion)
  → tap day → programs/[id]/day/[dayId].tsx
  → FAB "+" → ExercisePicker modal
  → POST /programs/:id/days/:dayId/exercises
```

## Workout Logging Flow (Client)
```
GET /client/today → shows today's exercises
  → tap "Registrar entrenamiento"
  → log.tsx: per-exercise accordion, set inputs (weight/reps/RPE)
  → tap "Guardar" → POST /client/workouts
  → redirect to Today with "logged" banner
```

## Session Flow
```
Trainer: POST /sessions (CONFIRMED)
Client: GET /client/sessions → view upcoming/past
Client: POST /client/sessions → request (PENDING)
Trainer: PATCH /sessions/:id/status → CONFIRMED / COMPLETED
Client: PATCH /client/sessions/:id/status → CANCELLED only
```

## Related Notes
- [[CoachOS — API Structure]]
- [[CoachOS — App Structure]]
- [[CoachOS — Database Schema]]
