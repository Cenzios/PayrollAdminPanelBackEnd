# -----------------------
# 1. Build stage
# -----------------------

FROM node:18-bullseye AS builder

WORKDIR /app

COPY package*.json ./

# --include=dev ensures typescript (tsc) is available during build
RUN npm install --include=dev

COPY . .

RUN npx prisma generate

RUN npm run build

# -----------------------
# 2. Runtime stage
# -----------------------

FROM node:18-bullseye

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 6090
EXPOSE 6092

# Apply pending database migrations, then start. prisma migrate deploy only runs
# migrations not yet recorded in _prisma_migrations, and holds a lock so
# concurrent starts are safe. A failed migration stops the container from starting.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]