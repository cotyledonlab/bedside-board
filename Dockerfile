# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY . .

# Build frontend
RUN npm run build

# Build server
RUN npm run build:server

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/bedside.db

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist-server/index.js"]
