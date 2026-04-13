FROM node:20-slim

WORKDIR /app/api

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY api/package*.json ./
RUN npm install

COPY api ./

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && npm run start"]
