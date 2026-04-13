# CoachOS — Project Overview
#project #gym #react-native #expo #nodejs

## Status: 🟡 In Development (MVP Phase)

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo SDK 51 |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| HTTP Client | Axios |
| Backend | Node.js + Express |
| ORM | Prisma |
| DB (dev) | SQLite |
| DB (prod) | PostgreSQL (planned) |
| Auth | JWT (30d expiry) |
| Validation | Zod |

## Repository Structure
```
/Users/santiago/santi/CoachOS/
├── api/          ← Node.js + Prisma backend
└── app/          ← Expo + React Native frontend
```

## Roles
- **TRAINER** — the personal trainer (app owner for now, single PT MVP)
- **CLIENT** — the trainer's clients

## MVP Scope
- [x] Auth (login + register trainer)
- [x] Trainer: manage clients
- [x] Trainer: create training programs
- [x] Client: view today's program
- [x] Client: log sets/weights
- [x] Client: view workout history
- [x] Client: book/cancel sessions
- [x] Trainer: calendar/session management
- [ ] Charts/progress graphs
- [ ] Push notifications
- [ ] Stripe billing
- [ ] Chat
- [ ] Multi-PT platform

## Related Notes
- [[CoachOS — API Structure]]
- [[CoachOS — App Structure]]
- [[CoachOS — Database Schema]]
- [[CoachOS — UI Design System]]
- [[CoachOS — Dev Setup]]
- [[CoachOS — Pending Tasks]]
- [[CoachOS — Module Map]]
