# JogGPS AI Coaching Backend - Coolify Deployment Guide

## Overview
This is the self-hosted version of the JogGPS AI Coaching Backend, designed to run on Coolify as an alternative to Vercel.

## Coolify Server Details
- **Server Address**: `192.168.0.224:8000`
- **SSH Access**: Available for manual configuration if needed

## Deployment Steps

### 1. Create Redis Database
1. Log into your Coolify instance at `http://192.168.0.224:8000`
2. Navigate to **Databases** section
3. Click **Create Database** → **Redis**
4. Configure Redis database:
   - **Name**: `joggps-redis`
   - **Description**: `Redis cache for JogGPS AI coaching messages`
   - **Image**: `redis:7-alpine`
   - **Memory Limit**: `256MB`
   - **Password**: Generate a secure password
   - **Persistent Storage**: Enable with 1GB storage

### 2. Deploy Next.js Application
1. Navigate to **Applications** section
2. Click **Create Application** → **Docker Compose**
3. Configure application:
   - **Name**: `joggps-ai-coaching-backend`
   - **Description**: `AI coaching backend for JogGPS app`
   - **Repository**: Upload the Docker Compose configuration
   - **Build Pack**: `Docker Compose`

### 3. Environment Variables
Set the following environment variables in Coolify:

```env
# Required - OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Redis Configuration (auto-configured by Coolify)
REDIS_URL=redis://joggps-redis:6379
REDIS_HOST=joggps-redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Application Settings
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# Optional - Domain configuration
BASE_URL=https://your-domain.com
```

### 4. Domain & SSL Setup
1. In Coolify, go to your application settings
2. Add your domain (e.g., `ai-coaching.yourdomain.com`)
3. Enable **SSL Certificate** (Let's Encrypt)
4. Configure **HTTP to HTTPS redirect**

### 5. Networking Configuration
- **Application Port**: `3000`
- **Redis Port**: `6379` (internal only)
- **Health Check Endpoint**: `/api/health`
- **Network**: Create isolated network for security

## API Endpoints

Once deployed, the following endpoints will be available:

- `POST /api/coaching` - Generate AI coaching messages
- `GET/POST /api/profile` - Manage user training profiles  
- `GET/POST /api/runs` - Log and retrieve run history
- `GET /api/health` - Service health check

## Health Monitoring

The application includes comprehensive health checks:

- **Redis Connection**: Tests database connectivity and response time
- **OpenRouter Configuration**: Verifies API key is configured
- **Service Status**: Overall application health
- **Uptime Tracking**: Service availability metrics

Access health status at: `https://your-domain.com/api/health`

## Resource Requirements

### Minimum Requirements:
- **CPU**: 1 vCPU
- **Memory**: 512MB RAM
- **Storage**: 2GB (1GB for Redis data, 1GB for application)
- **Network**: Outbound HTTPS access for OpenRouter API

### Recommended Requirements:
- **CPU**: 2 vCPUs
- **Memory**: 1GB RAM
- **Storage**: 5GB (2GB for Redis data, 3GB for logs/application)
- **Network**: Dedicated network with firewall rules

## Performance Tuning

### Redis Configuration:
```
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
```

### Next.js Optimizations:
- **Production Build**: Optimized bundles and server-side rendering
- **Response Compression**: Gzip enabled
- **Static Asset Caching**: Browser caching headers
- **API Response Caching**: Redis-based message caching (1-minute TTL)

## Security Considerations

1. **Environment Variables**: Store API keys in Coolify's encrypted environment variables
2. **Network Isolation**: Use Coolify's internal networking for Redis communication
3. **SSL/TLS**: Enable HTTPS with Let's Encrypt certificates
4. **CORS Configuration**: Configure appropriate CORS headers for your Android app
5. **Rate Limiting**: Consider implementing rate limiting for API endpoints

## Monitoring & Logging

### Application Logs:
- **Coaching Requests**: Detailed logging of AI model requests and responses
- **Cache Performance**: Redis hit/miss ratios and response times
- **Error Tracking**: API errors and OpenRouter failures
- **Health Metrics**: Continuous health check results

### Log Locations (via Coolify):
- Application logs available in Coolify dashboard
- Redis logs accessible through container logs
- System logs available via SSH if needed

## Backup & Recovery

### Redis Data Backup:
- Redis persistence enabled with AOF (Append-Only File)
- Daily snapshots recommended
- Backup commands:
  ```bash
  redis-cli BGSAVE
  docker cp container_name:/data/dump.rdb ./backup/
  ```

### Application Backup:
- Environment variables exported from Coolify
- Docker Compose configuration stored in Git
- Application code in version control

## Troubleshooting

### Common Issues:

1. **Redis Connection Failures**:
   - Check Redis container status in Coolify
   - Verify network connectivity between services
   - Check Redis password configuration

2. **OpenRouter API Errors**:
   - Verify API key is correctly set in environment variables
   - Check OpenRouter account limits and billing
   - Monitor API response times and error rates

3. **High Memory Usage**:
   - Check Redis memory usage with `redis-cli INFO memory`
   - Adjust Redis maxmemory settings if needed
   - Monitor application memory usage in Coolify

4. **SSL Certificate Issues**:
   - Verify domain DNS settings
   - Check Let's Encrypt certificate renewal
   - Ensure port 443 is accessible

## Migration from Vercel

To migrate from your existing Vercel deployment:

1. Deploy this backend to Coolify using the steps above
2. Test all endpoints with your Android app
3. Update the Android app's `AI_COACHING_BASE_URL` configuration
4. Deploy the updated Android app
5. Monitor for any issues and keep Vercel as fallback initially
6. Once stable, decommission the Vercel deployment

## Support

For deployment issues:
- Check Coolify logs in the dashboard
- Review application health checks
- Verify environment variable configuration
- Test API endpoints manually with curl or Postman

## Cost Benefits

Migrating from Vercel to self-hosted Coolify provides:
- **No usage-based charges** for API requests
- **No function timeout limits** for long-running requests  
- **Full control** over resources and configuration
- **Enhanced privacy** with all data on your infrastructure
- **No vendor lock-in** with portable Docker containers