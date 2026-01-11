# Docker Setup for Airflow UI Dashboard

This document describes how to build and run the Airflow UI Dashboard using Docker.

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and start all services including the dashboard:**
   ```bash
   docker-compose up --build
   ```

2. **Start only the dashboard service:**
   ```bash
   docker-compose up airflow-dashboard
   ```

3. **Access the dashboard:**
   - Open your browser and navigate to `http://localhost:3000`

### Using Docker Compose with Override

For production-like setup with additional configurations:

```bash
docker-compose -f docker-compose.yaml -f docker-compose.dashboard.yml up --build
```

## Environment Variables

The dashboard supports the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `AIRFLOW_API_URL` | `http://localhost:8080` | Airflow API server URL |
| `API_TIMEOUT` | `30000` | API request timeout in milliseconds |
| `POLLING_INTERVAL` | `30000` | Data refresh interval in milliseconds |
| `MAX_RETRIES` | `3` | Maximum number of API retry attempts |
| `APP_TITLE` | `Airflow Dashboard` | Application title |
| `LOG_LEVEL` | `info` | Logging level |

## Building the Docker Image

### Build the image manually:

```bash
cd dashboard
docker build -t airflow-dashboard .
```

### Run the container:

```bash
docker run -d \
  --name airflow-dashboard \
  -p 3000:80 \
  -e AIRFLOW_API_URL=http://host.docker.internal:8080 \
  airflow-dashboard
```

## Development vs Production

### Development Mode

For development, use the Vite dev server:

```bash
cd dashboard
npm install
npm run dev
```

### Production Mode

The Docker container runs in production mode with:
- Optimized build with code splitting
- Nginx serving static files
- API proxying to Airflow
- Health checks
- Security headers

## Health Checks

The container includes health checks:
- **Endpoint:** `http://localhost:3000/health`
- **Interval:** 30 seconds
- **Timeout:** 3 seconds
- **Retries:** 3

## Nginx Configuration

The Nginx configuration includes:
- Static file serving with caching
- API proxying to Airflow
- CORS headers for API requests
- Security headers
- Gzip compression
- Rate limiting for API endpoints

## Troubleshooting

### Container won't start
1. Check if port 3000 is available
2. Verify Airflow API server is running
3. Check container logs: `docker logs airflow-dashboard`

### API requests failing
1. Verify `AIRFLOW_API_URL` environment variable
2. Check network connectivity between containers
3. Ensure Airflow API server is accessible

### Build failures
1. Ensure Node.js dependencies are properly installed
2. Check for TypeScript compilation errors
3. Verify all required files are present

## Security Considerations

- The container runs as non-root user
- Security headers are configured in Nginx
- API requests are proxied to prevent CORS issues
- Rate limiting is applied to API endpoints
- No sensitive data is stored in the container

## Monitoring

Monitor the dashboard using:
- Health check endpoint: `/health`
- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`
- Container metrics via Docker stats