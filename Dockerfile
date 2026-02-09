# Build stage
FROM node:18-alpine AS builder


RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies like prisma and tsc)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Runner stage
FROM node:18-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=6092

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --omit=dev

# Copy the generated Prisma client from builder stage
# Prisma generates by default into node_modules/.prisma and node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy the compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 6092

# Health check to ensure the container is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:6092/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || \
  node -e "require('http').get('http://localhost:6092/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]
