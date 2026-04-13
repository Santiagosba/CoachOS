# CoachOS — API Request Examples
#api #requests

## Register Trainer
```json
POST /auth/register
{
  "email": "trainer@gym.com",
  "password": "Trainer123",
  "name": "Carlos López",
  "role": "TRAINER"
}
```

## Login
```json
POST /auth/login
{
  "email": "trainer@gym.com",
  "password": "Trainer123"
}
// Returns: { user: { id, name, email, role }, token }
```

## Create Client (by trainer)
```json
POST /clients
Authorization: Bearer <trainer_token>
{
  "name": "María García",
  "email": "maria@email.com",
  "password": "Inicial123",
  "goal": "Pérdida de peso",
  "weight": 70,
  "height": 165
}
```

## Create Program (full structure in one call)
```json
POST /programs
{
  "clientId": "uuid-here",
  "name": "Fuerza 4 días",
  "weeks": [
    {
      "weekNumber": 1,
      "days": [
        {
          "dayOfWeek": 0,
          "label": "Push",
          "exercises": [
            { "exerciseId": "uuid", "order": 1, "sets": 4, "reps": "8-10", "rpe": 8 }
          ]
        }
      ]
    }
  ]
}
```

## Add Exercise to Day
```json
POST /programs/:id/days/:dayId/exercises
{
  "exerciseId": "uuid",
  "sets": 3,
  "reps": "8-10",
  "rpe": 8,
  "notes": "Bajar lento 3s"
}
```

## Log Workout
```json
POST /client/workouts
{
  "sets": [
    { "exerciseId": "uuid", "setNumber": 1, "reps": 10, "weight": 80, "rpe": 8 },
    { "exerciseId": "uuid", "setNumber": 2, "reps": 9, "weight": 80, "rpe": 9 }
  ]
}
```

## Create Session (trainer)
```json
POST /sessions
{
  "clientId": "uuid",
  "date": "2026-04-10T10:00:00.000Z",
  "duration": 60,
  "type": "PRESENCIAL",
  "notes": "Primera sesión de evaluación"
}
```

## Update Session Status
```json
PATCH /sessions/:id/status
{
  "status": "CONFIRMED"  // or COMPLETED, CANCELLED
}
```

## Related Notes
- [[CoachOS — API Structure]]
