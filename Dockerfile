# Multi-stage build for Super MapScraper
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Production stage
FROM caddy:2.7.4-alpine

# Install Node.js for backend
RUN apk add --no-cache nodejs npm

# Create app directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist /srv/www

# Copy public assets
COPY public/ /srv/www/

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Create necessary directories
RUN mkdir -p /var/log/caddy /app/logs

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set ownership
RUN chown -R appuser:appgroup /app /srv/www /var/log/caddy

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 80 443 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start both Caddy and Node.js backend
CMD ["sh", "-c", "node server.js & caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]