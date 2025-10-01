# Multi-stage Dockerfile for PoPC Verification API
# Handles monorepo structure with file: dependencies

FROM node:20-slim AS builder

WORKDIR /app

# Copy entire monorepo for file: protocol dependencies
COPY . .

# Install and build c2pa package first (required dependency)
RUN cd packages/c2pa && \
    npm ci && \
    npm run build

# Install and build API
RUN cd apps/api && \
    npm ci && \
    npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/public ./apps/api/public

# Copy c2pa package (runtime dependency)
COPY --from=builder /app/packages/c2pa/dist ./packages/c2pa/dist
COPY --from=builder /app/packages/c2pa/package.json ./packages/c2pa/package.json
COPY --from=builder /app/packages/c2pa/node_modules ./packages/c2pa/node_modules

# Copy database migrations (needed for runtime)
COPY --from=builder /app/apps/api/db ./apps/api/db

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "apps/api/dist/index.js"]
