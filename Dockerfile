# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
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

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --omit=dev

# Copy the compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
