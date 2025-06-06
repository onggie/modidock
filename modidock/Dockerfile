# --- Frontend Build Stage ---
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Backend Build/Runtime Stage ---
FROM node:18-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --production
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build ./backend/public
EXPOSE 7000
ENV NODE_ENV=production
CMD ["node", "backend/server.js"]
