# --- Stage 1: Build the Frontend ---
# This stage builds the React app into static files.
FROM node:18-alpine AS frontend-build
WORKDIR /usr/src/app

# A .dockerignore file is crucial to prevent copying local node_modules.
# Copy only the package files first to leverage Docker's layer caching.
COPY frontend/package.json ./frontend/
COPY frontend/package-lock.json ./frontend/

# Set the WORKDIR for the frontend to run npm install
WORKDIR /usr/src/app/frontend

# Install all dependencies (including devDependencies needed for the build)
RUN npm install

# Copy the rest of the frontend source code
COPY frontend/ .

# Build the application, creating a /build directory with static files
RUN npm run build


# --- Stage 2: Build the Backend and Create the Final Image ---
# This stage creates the lean, final production image.
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy backend package files first for caching
COPY backend/package.json ./backend/
COPY backend/package-lock.json ./backend/

# Set WORKDIR for the backend and install ONLY production dependencies
WORKDIR /usr/src/app/backend
RUN npm install --production

# Copy the rest of the backend source code
COPY backend/ .

# Reset WORKDIR to the root to make the next copy path clearer
WORKDIR /usr/src/app

# Copy the built frontend static files from the 'frontend-build' stage
# This places the React app's static files into the backend's 'public' folder.
# Your Express server should be configured to serve static files from this 'public' directory.
COPY --from=frontend-build /usr/src/app/frontend/build ./backend/public

# Set the final working directory
WORKDIR /usr/src/app/backend

# Expose the port the application will run on
EXPOSE 5000

# The command to start the server
CMD ["node", "server.js"]
