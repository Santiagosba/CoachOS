# CoachOS — Dev Setup
#setup #development

## Prerequisites
- Node.js (at `/usr/local/bin/node`, v24.14.1)
- SQLite (no setup needed — file-based)

## Start API
```bash
cd /Users/santiago/santi/CoachOS/api
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET, PORT
npm install
npm run db:migrate
npm run db:seed        # loads 55 exercises
npm run dev            # ts-node-dev on port 3000
```

## Start App
```bash
cd /Users/santiago/santi/CoachOS/app
npm install
npx expo start         # QR code for Expo Go
npx expo start --ios
npx expo start --android
```

## Environment Files

### API `.env`
```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-here"
PORT=3000
```

### App `.env`
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Dev Server Configs
Saved in `.claude/launch.json` (CoachOS root):
- **API**: `npm run dev` in `api/` — port 3000
- **App**: `npx expo start` in `app/` — port 8081

## PATH issue (macOS zsh)
If `npm` is not found in shell PATH, prefix commands with:
```bash
PATH="/usr/local/bin:$PATH" npm run dev
PATH="/usr/local/bin:$PATH" npx expo start
```

## Known Issues

### ⚠️ Web Preview (BROKEN — Expo SDK 51 + RN 0.74)
React Native 0.74 removed platform-agnostic files (`Image.js`, `Platform.js`, etc.).
`@expo/metro-config` still injects `Libraries/Core/InitializeCore` on web builds, cascading into missing module errors.

**Workaround**: Use Expo Go on phone instead of web preview.

`metro.config.js` has partial fixes (resolveRequest aliases, browser field) — not fully resolved.

## Related Notes
- [[CoachOS — Project Overview]]
- [[CoachOS — Pending Tasks]]
