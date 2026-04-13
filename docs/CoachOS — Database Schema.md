# CoachOS — Database Schema
#database #prisma #sqlite

## Provider
Currently: **SQLite** (`file:./dev.db`)
Production target: **PostgreSQL**

> ⚠️ Enums were removed for SQLite compatibility. Role, SessionStatus, SessionType stored as String.

## Models

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| email | String | unique |
| password | String | bcrypt hashed |
| name | String | |
| role | String | "TRAINER" or "CLIENT" |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Relations: `clients []` (as trainer), `clientProfile?` (as client)

### Client
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| userId | String | FK → User (unique) |
| trainerId | String | FK → User |
| height | Float? | cm |
| weight | Float? | kg |
| goal | String? | |
| notes | String? | |
| birthDate | DateTime? | |

Relations: `programs[]`, `sessions[]`, `workoutLogs[]`

### Program → Week → Day → DayExercise
```
Program (clientId)
  └─ Week (weekNumber)
       └─ Day (dayOfWeek 0=Mon..6=Sun, label?)
            └─ DayExercise (exerciseId, order, sets, reps, rpe?, notes?)
```

### Exercise
| Field | Type |
|-------|------|
| id | String (uuid) |
| name | String (unique) |
| muscleGroup | String? |
| category | String? |
| equipment | String? |
| description | String? |
| videoUrl | String? |

### WorkoutLog → LogSet
```
WorkoutLog (clientId, date, notes?)
  └─ LogSet (exerciseId, setNumber, reps, weight, rpe?, notes?)
```

### Session
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| date | DateTime | |
| duration | Int | minutes |
| type | String | "PRESENCIAL" or "ONLINE" |
| status | String | "PENDING" / "CONFIRMED" / "CANCELLED" / "COMPLETED" |
| clientId | String | FK → Client |

## Seed Data
- 55 exercises across: Pecho, Espalda, Hombros, Bíceps, Tríceps, Piernas, Core
- Run: `npm run db:seed`

## Commands
```bash
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:studio    # prisma studio (GUI)
npm run db:seed      # seed exercises
```

## Related Notes
- [[CoachOS — API Structure]]
- [[CoachOS — Project Overview]]
