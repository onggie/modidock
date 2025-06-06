# ─── Build Stage for Frontend ────────────────────────────────────────────────
FROM node:18-alpine AS frontend-build
WORKDIR /usr/src/app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
RUN npm run build
# Output → /usr/src/app/frontend/build

# ─── Final Stage: Backend + Serve Frontend ───────────────────────────────────
FROM node:18-alpine
WORKDIR /usr/src/app

# 1. Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# 2. Copy backend source
COPY backend/ ./backend

# 3. Copy built frontend from stage 1
COPY --from=frontend-build /usr/src/app/frontend/build ./backend/public

# 4. Create config directory (populated via Docker Compose)
RUN mkdir -p /app/config

EXPOSE 8080
ENV VOLUME_ROOT=/volumes
CMD ["node", "backend/server.js"]
