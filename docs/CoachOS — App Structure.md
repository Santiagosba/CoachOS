# CoachOS — App Structure
#expo #react-native #expo-router

## File-Based Routing (`src/app/`)

```
src/app/
├── _layout.tsx              ← Root: session load + role redirect
├── (auth)/
│   └── login.tsx            ← Login + Register trainer
├── (trainer)/
│   ├── _layout.tsx          ← Tab bar (Inicio, Clientes, Calendario)
│   ├── index.tsx            ← Dashboard: stats + upcoming sessions
│   ├── clients/
│   │   ├── index.tsx        ← Client list + create client form
│   │   └── [id].tsx         ← Client detail + programs + sessions
│   ├── programs/
│   │   ├── new.tsx          ← Program builder (name, weeks, days)
│   │   └── [id]/
│   │       ├── index.tsx    ← Program weeks/days accordion
│   │       └── day/
│   │           └── [dayId].tsx  ← Day exercise editor
│   └── calendar/
│       └── index.tsx        ← Session calendar
└── (client)/
    ├── _layout.tsx          ← Tab bar (Hoy, Progreso, Sesiones)
    ├── index.tsx            ← Today's program
    ├── log.tsx              ← Live workout logger (hidden tab)
    ├── progress.tsx         ← Workout history
    └── sessions.tsx         ← Book/manage sessions
```

## Navigation Flow

### Trainer
```
Login → Dashboard
  → Clientes → [id] → Program [id] → Day [dayId]
                    → new program → Day [dayId]
  → Calendario
```

### Client
```
Login → Today → Log workout
              → Progress
              → Sessions
```

## Key Libraries
| Library | Purpose |
|---------|---------|
| expo-router | File-based navigation |
| zustand | Auth state |
| axios | HTTP client |
| @expo/vector-icons | Ionicons |
| expo-secure-store | Token storage (native) |
| session-storage (custom) | Cross-platform token storage |

## Path Alias
`@/` → `src/`
Configured via `babel-plugin-module-resolver` in `babel.config.js`

## Environment Variables
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Key Screens Detail

### `(trainer)/clients/[id].tsx`
Full client profile: metrics (weight, height, goal, notes), inline edit, session creation form, programs list with delete, useFocusEffect to reload on return.

### `(trainer)/programs/[id]/day/[dayId].tsx`
Day exercise editor: inline edit (sets/reps/RPE/notes), FAB → ExercisePicker modal, delete with confirmation.

### `(client)/log.tsx`
Live workout logger: progress bar, accordion by exercise, per-set weight/reps/RPE inputs, last-used weight suggestion, checkmarks on completed sets.

## Related Notes
- [[CoachOS — UI Design System]]
- [[CoachOS — Module Map]]
- [[CoachOS — Dev Setup]]
