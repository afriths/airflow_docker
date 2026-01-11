#!/bin/sh
set -e

# Airflow UI Dashboard - Docker Entrypoint Script
echo "Starting Airflow UI Dashboard..."

# Environment validation
echo "Validating environment configuration..."

# Check required environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "ERROR: Required environment variable $1 is not set"
        exit 1
    fi
    echo "✓ $1 is set"
}

# Validate critical environment variables
AIRFLOW_API_URL=${AIRFLOW_API_URL:-"http://airflow-apiserver:8080"}
API_TIMEOUT=${API_TIMEOUT:-"30000"}
POLLING_INTERVAL=${POLLING_INTERVAL:-"30000"}
MAX_RETRIES=${MAX_RETRIES:-"3"}
LOG_LEVEL=${LOG_LEVEL:-"warn"}
APP_TITLE=${APP_TITLE:-"Airflow Dashboard"}

echo "✓ AIRFLOW_API_URL: $AIRFLOW_API_URL"
echo "✓ API_TIMEOUT: $API_TIMEOUT"
echo "✓ POLLING_INTERVAL: $POLLING_INTERVAL"
echo "✓ MAX_RETRIES: $MAX_RETRIES"
echo "✓ LOG_LEVEL: $LOG_LEVEL"
echo "✓ APP_TITLE: $APP_TITLE"

# Validate API URL format
if ! echo "$AIRFLOW_API_URL" | grep -E '^https?://' > /dev/null; then
    echo "ERROR: AIRFLOW_API_URL must be a valid HTTP/HTTPS URL"
    exit 1
fi

# Validate numeric values
if ! echo "$API_TIMEOUT" | grep -E '^[0-9]+$' > /dev/null || [ "$API_TIMEOUT" -lt 1000 ]; then
    echo "ERROR: API_TIMEOUT must be a number >= 1000"
    exit 1
fi

if ! echo "$POLLING_INTERVAL" | grep -E '^[0-9]+$' > /dev/null || [ "$POLLING_INTERVAL" -lt 5000 ]; then
    echo "ERROR: POLLING_INTERVAL must be a number >= 5000"
    exit 1
fi

if ! echo "$MAX_RETRIES" | grep -E '^[0-9]+$' > /dev/null || [ "$MAX_RETRIES" -lt 1 ] || [ "$MAX_RETRIES" -gt 10 ]; then
    echo "ERROR: MAX_RETRIES must be a number between 1 and 10"
    exit 1
fi

# Validate log level
case "$LOG_LEVEL" in
    debug|info|warn|error)
        echo "✓ Valid log level: $LOG_LEVEL"
        ;;
    *)
        echo "ERROR: LOG_LEVEL must be one of: debug, info, warn, error"
        exit 1
        ;;
esac

# Function to replace environment variables in built files
replace_env_vars() {
    echo "Replacing environment variables in built files..."
    
    # Find and replace in JavaScript files
    find /usr/share/nginx/html -name "*.js" -exec sed -i \
        -e "s|VITE_AIRFLOW_API_URL_PLACEHOLDER|${AIRFLOW_API_URL}|g" \
        -e "s|VITE_API_TIMEOUT_PLACEHOLDER|${API_TIMEOUT}|g" \
        -e "s|VITE_POLLING_INTERVAL_PLACEHOLDER|${POLLING_INTERVAL}|g" \
        -e "s|VITE_MAX_RETRIES_PLACEHOLDER|${MAX_RETRIES}|g" \
        -e "s|VITE_APP_TITLE_PLACEHOLDER|${APP_TITLE}|g" \
        -e "s|VITE_LOG_LEVEL_PLACEHOLDER|${LOG_LEVEL}|g" \
        {} \;
    
    echo "Environment variables replaced successfully"
}

# Create runtime configuration file
echo "Creating runtime configuration..."
cat > /usr/share/nginx/html/config.js << EOF
window.__APP_CONFIG__ = {
  AIRFLOW_API_URL: '$AIRFLOW_API_URL',
  API_TIMEOUT: $API_TIMEOUT,
  POLLING_INTERVAL: $POLLING_INTERVAL,
  MAX_RETRIES: $MAX_RETRIES,
  LOG_LEVEL: '$LOG_LEVEL',
  APP_TITLE: '$APP_TITLE',
  VERSION: '${APP_VERSION:-1.0.0}',
  BUILD_TIME: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
  ENVIRONMENT: '${NODE_ENV:-production}'
};
EOF

# Replace environment variables if in production
if [ "${NODE_ENV}" = "production" ]; then
    replace_env_vars
fi

# Wait for Airflow API to be available (optional)
if [ "${WAIT_FOR_AIRFLOW:-false}" = "true" ]; then
    echo "Waiting for Airflow API to be available..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f -s "$AIRFLOW_API_URL/health" > /dev/null 2>&1; then
            echo "✓ Airflow API is available"
            break
        fi
        echo "Waiting for Airflow API... ($timeout seconds remaining)"
        sleep 5
        timeout=$((timeout - 5))
    done
    
    if [ $timeout -le 0 ]; then
        echo "WARNING: Airflow API is not available, but continuing startup"
    fi
fi

# Set proper permissions
echo "Setting file permissions..."
chown -R nginx:nginx /usr/share/nginx/html
chmod -R 755 /usr/share/nginx/html

# Create nginx directories if they don't exist
mkdir -p /var/cache/nginx/client_temp
mkdir -p /var/log/nginx
chown -R nginx:nginx /var/cache/nginx
chown -R nginx:nginx /var/log/nginx

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

echo "Environment validation completed successfully!"
echo "Starting nginx..."

# Start nginx in foreground
exec nginx -g "daemon off;"