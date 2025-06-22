# Stage 1: build both frontend and backend
FROM node:18-alpine AS builder
WORKDIR /app

# Install root deps for frontend
COPY package.json package-lock.json* ./
RUN npm install

# Install backend deps
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install

# Copy all sources
COPY . .
# Generate runtime config
RUN cp config.js.template config.js

# Build frontend (Vite)
RUN npm run build

# Build backend (TypeScript)
RUN cd backend && npm run build

# Stage 2: production runtime
FROM node:18-alpine
WORKDIR /app

# Copy built backend and frontend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/dist ./dist
# Copy generated config for frontend
COPY --from=builder /app/config.js ./dist/config.js

# Copy environment example
COPY --from=builder /app/backend/.env.example .env

# Expose API port
EXPOSE 3000

# Start the server (serves API and static files)
CMD ["node", "backend/dist/app.js"]