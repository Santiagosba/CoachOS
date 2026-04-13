# CoachOS — API Structure
#api #express #nodejs

## Base URL
Development: `http://localhost:3000`

## Authentication
All routes except `/auth/*` require:
```
Authorization: Bearer <JWT>
```
JWT contains: `{ id: string, role: string }`

## Endpoints

### Auth (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | ❌ | Register TRAINER or CLIENT |
| POST | /auth/login | ❌ | Login, returns JWT |

Password rules: 8+ chars, uppercase, lowercase, number

### Clients (`/clients`) — TRAINER only
| Method | Path | Description |
|--------|------|-------------|
| GET | /clients | List trainer's clients |
| POST | /clients | Create client (user + profile) |
| GET | /clients/:id | Client detail + programs + sessions |
| PATCH | /clients/:id | Update metrics, name, notes |

### Programs (`/programs`) — TRAINER only
| Method | Path | Description |
|--------|------|-------------|
| GET | /programs?clientId= | All programs for a client |
| GET | /programs/:id | Full program detail |
| POST | /programs | Create complete program |
| DELETE | /programs/:id | Cascade delete |
| POST | /programs/:id/weeks | Add week |
| DELETE | /programs/:id/weeks/:weekId | Delete week |
| POST | /programs/:id/weeks/:weekId/days | Add day |
| DELETE | /programs/:id/weeks/:weekId/days/:dayId | Delete day |
| POST | /programs/:id/days/:dayId/exercises | Add exercise |
| PATCH | /programs/:id/days/:dayId/exercises/:exId | Edit sets/reps/rpe |
| DELETE | /programs/:id/days/:dayId/exercises/:exId | Remove exercise |

### Exercises (`/exercises`) — Any auth
| Method | Path | Description |
|--------|------|-------------|
| GET | /exercises?q=&category= | Search exercises |
| GET | /exercises/:id | Single exercise |
| POST | /exercises | Create custom exercise |

### Sessions (`/sessions`) — TRAINER only
| Method | Path | Description |
|--------|------|-------------|
| GET | /sessions?clientId=&from=&to= | List sessions |
| POST | /sessions | Create session |
| PATCH | /sessions/:id/status | Update status |
| DELETE | /sessions/:id | Delete session |

### Client Self (`/client`) — CLIENT only
| Method | Path | Description |
|--------|------|-------------|
| GET | /client/today | Today's program day + existing log |
| GET | /client/workouts | Last 30 workout logs |
| POST | /client/workouts | Save workout |
| GET | /client/workouts/:id | Single workout detail |
| GET | /client/progress/:exerciseId | Weight progression |
| GET | /client/sessions | Client's sessions |
| POST | /client/sessions | Request session (→PENDING) |
| PATCH | /client/sessions/:id/status | Cancel session only |

## Key Files
```
api/
├── src/
│   ├── index.ts              ← Entry point, Express app + routes
│   ├── middleware/auth.ts    ← requireAuth, requireTrainer
│   ├── lib/prisma.ts         ← Prisma singleton
│   └── routes/
│       ├── auth.ts
│       ├── clients.ts
│       ├── programs.ts
│       ├── sessions.ts
│       ├── exercises.ts
│       └── client.ts
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## Related Notes
- [[CoachOS — Database Schema]]
- [[CoachOS — Dev Setup]]
- [[CoachOS — Module Map]]
