# ==========================================
# Build Stage: Build Frontend with Vite
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies based on lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and config files
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# Build production frontend bundle into dist/
RUN npm run build

# ==========================================
# Production Stage: Lightweight Node.js Server
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server and static files
COPY server.js ./
COPY public ./public
COPY --from=builder /app/dist ./dist

# Copy default initial data store
COPY data ./data

# Ensure data directory exists and has appropriate permissions
RUN mkdir -p /app/data

# Persistent volume for library, schedules, and custom settings
VOLUME ["/app/data"]

# Expose server port (default 3000)
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Start the application server
CMD ["node", "server.js"]
