# Multi-stage Dockerfile for Airflow UI Dashboard
# Stage 1: Build the React application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit

# Copy source code
COPY . .

# Generate build information
RUN node scripts/build-info.js

# Validate environment configuration
RUN node scripts/validate-env.js

# Build the application
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN npm run build:${NODE_ENV}

# Stage 2: Production server with Nginx
FROM nginx:alpine AS production

# Install curl and other utilities for health checks
RUN apk add --no-cache curl jq

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy and make entrypoint script executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create nginx cache directory and set permissions
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# Create health check script
RUN echo '#!/bin/sh' > /usr/local/bin/health-check.sh && \
    echo 'set -e' >> /usr/local/bin/health-check.sh && \
    echo '# Basic HTTP health check' >> /usr/local/bin/health-check.sh && \
    echo 'curl -f http://localhost/health > /dev/null 2>&1 || exit 1' >> /usr/local/bin/health-check.sh && \
    echo '# Check if nginx is running' >> /usr/local/bin/health-check.sh && \
    echo 'pgrep nginx > /dev/null || exit 1' >> /usr/local/bin/health-check.sh && \
    echo '# Check if static files are accessible' >> /usr/local/bin/health-check.sh && \
    echo 'test -f /usr/share/nginx/html/index.html || exit 1' >> /usr/local/bin/health-check.sh && \
    echo 'echo "Health check passed"' >> /usr/local/bin/health-check.sh && \
    chmod +x /usr/local/bin/health-check.sh

# Expose port 80
EXPOSE 80

# Add comprehensive health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/health-check.sh

# Set build-time labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="airflow-ui-dashboard" \
      org.label-schema.description="Web-based UI for monitoring and controlling Apache Airflow" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/your-org/airflow-dashboard" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]