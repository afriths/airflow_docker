#!/bin/sh
set -e

# Function to replace environment variables in built files
replace_env_vars() {
    echo "Replacing environment variables in built files..."
    
    # Default values
    AIRFLOW_API_URL=${AIRFLOW_API_URL:-http://localhost:8080}
    API_TIMEOUT=${API_TIMEOUT:-30000}
    POLLING_INTERVAL=${POLLING_INTERVAL:-30000}
    MAX_RETRIES=${MAX_RETRIES:-3}
    APP_TITLE=${APP_TITLE:-Airflow Dashboard}
    LOG_LEVEL=${LOG_LEVEL:-info}
    
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

# Replace environment variables if in production
if [ "${NODE_ENV}" = "production" ]; then
    replace_env_vars
fi

# Start nginx
echo "Starting Nginx..."
exec nginx -g "daemon off;"