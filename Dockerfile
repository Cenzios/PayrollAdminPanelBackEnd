# -----------------------
# Dual Deployment Dockerfile
# QA (dev)   : docker build --build-arg ENV=qa -t myapp-qa .
# Production : docker build --build-arg ENV=production -t myapp-prod .
# -----------------------

ARG ENV=production

# -----------------------
# 1. Build stage
# -----------------------

FROM node:18-bullseye AS builder

ARG ENV
ENV NODE_ENV=${ENV}

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

# -----------------------
# 2. Runtime stage
# -----------------------

FROM node:18-bullseye

ARG ENV=production
ENV NODE_ENV=${ENV}

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Write an entrypoint script that injects the correct PORT
# before node starts — satisfying server.ts PORT validation
RUN if [ "$ENV" = "qa" ]; then \
      printf '#!/bin/sh\nexport PORT=6092\nexec node dist/server.js\n' > /app/entrypoint.sh; \
    else \
      printf '#!/bin/sh\nexport PORT=6090\nexec node dist/server.js\n' > /app/entrypoint.sh; \
    fi && chmod +x /app/entrypoint.sh

# Expose both; only the mapped one is active per container
EXPOSE 6090
EXPOSE 6092

CMD ["/app/entrypoint.sh"]