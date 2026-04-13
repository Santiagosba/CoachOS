#!/bin/sh
set -e

echo "▶ Applying database migrations..."
npx prisma migrate deploy

echo "▶ Seeding admin user..."
npx ts-node --transpile-only prisma/seed-admin.ts

echo "▶ Seeding exercises..."
npx ts-node --transpile-only prisma/seed.ts

echo "▶ Seeding trainer user..."
npx ts-node --transpile-only prisma/seed-santiago.ts

echo "▶ Starting server..."
node dist/index.js
