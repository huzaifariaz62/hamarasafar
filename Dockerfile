# -------------------------------------------------------------------
# Hamara Safar - Multi-Stage Container Dockerfile
# Stage 1: Build the Vite static assets
# Stage 2: Minimal Node.js production runtime with Express backend
# -------------------------------------------------------------------

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy project source files
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# -------------------------------------------------------------------
# Stage 2: Runner (Production & Local Isolated Testing)
# -------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend files and compiled frontend from builder
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY user.json ./
COPY newlogo.svg ./
COPY index.html ./

# Create non-root user for security
USER node

# Expose backend & frontend unified port
EXPOSE 3000

# Healthcheck to ensure container is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the unified Hamara Safar server
CMD ["node", "server.js"]
