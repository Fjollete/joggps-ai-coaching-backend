# JogGPS AI Coaching Backend

A self-hosted Next.js API backend for the JogGPS Android running tracker app, designed to replace the Vercel-hosted backend with a cost-effective, high-performance Coolify deployment.

## Features

- 🤖 **AI Coaching**: Real-time coaching messages via OpenRouter API (30+ models)
- ⚡ **High Performance**: No cold starts, consistent response times
- 🗄️ **Redis Caching**: Intelligent message caching with context awareness
- 🐳 **Docker Deployment**: Containerized with health monitoring
- 🔒 **Security**: Environment-based secrets, HTTPS support
- 📊 **Monitoring**: Comprehensive health checks and logging
- 💰 **Cost Effective**: Fixed server costs vs usage-based pricing

## Architecture

```
Android App → HTTPS → Coolify → Next.js API → OpenRouter AI
                               ↓
                           Redis Cache
```

### API Endpoints

- `POST /api/coaching` - Generate AI coaching messages
- `GET/POST /api/profile` - Manage user training profiles
- `GET/POST /api/runs` - Log and retrieve run history
- `GET /api/health` - Service health monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenRouter API key
- Coolify server (v4.x)

### Local Development

1. **Clone and setup:**
   ```bash
   cd coolify-backend
   npm install
   cp .env.example .env.local
   ```

2. **Configure environment:**
   ```bash
   # Edit .env.local
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   REDIS_URL=redis://localhost:6379
   ```

3. **Start Redis:**
   ```bash
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Test API:**
   ```bash
   npm run test:api
   # OR
   curl http://localhost:3000/api/health
   ```

### Production Deployment (Coolify)

1. **Prepare deployment:**
   ```bash
   # Set your OpenRouter API key
   export OPENROUTER_API_KEY=your_api_key_here
   
   # Run deployment preparation
   ./scripts/deploy-coolify.sh
   ```

2. **Deploy to Coolify:**
   - Upload `docker-compose.yml` to your Coolify instance
   - Set environment variables from generated `coolify.env`
   - Deploy and configure domain/SSL

3. **Verify deployment:**
   ```bash
   curl https://your-domain.com/api/health
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI models | Yes | - |
| `REDIS_URL` | Redis connection URL | Yes | `redis://localhost:6379` |
| `NODE_ENV` | Node environment | No | `production` |
| `PORT` | Application port | No | `3000` |

### AI Models

Supports 30+ AI models via OpenRouter:

**Reasoning Models** (2500 tokens):
- GPT-5 Mini, GPT-5 Nano
- Qwen3 235B Thinking
- O1, O4 series

**Standard Models** (150 tokens):
- GPT-4.1 Nano, GPT-4o Mini
- Claude 3 Haiku
- Gemini 2.5 Flash
- Llama 3.2, Mistral models

## Docker Deployment

### Build & Run Locally

```bash
# Build image
docker build -t joggps-ai-coaching-backend .

# Run with Redis
docker-compose up -d

# Test deployment
curl http://localhost:3000/api/health
```

### Production Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
```

## API Reference

### Coaching Messages

**POST** `/api/coaching`

Generate AI coaching message based on running context.

```json
{
  "deviceId": "user-device-123",
  "currentSegment": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timestamp": 1642261800000,
    "heartRate": 150,
    "speed": 3.5,
    "accuracy": 5.0
  },
  "runTotals": {
    "distance": 2500,
    "duration": 900000,
    "avgPace": 360,
    "avgHeartRate": 145
  },
  "trainingGoal": {
    "raceType": "10k",
    "targetTime": 2400,
    "raceDate": "2024-06-15"
  },
  "model": "openai/gpt-4.1-nano"
}
```

**Response:**
```json
{
  "message": "Great pace! You're right on track for your 10K goal. Keep that steady rhythm and focus on your breathing."
}
```

### Health Check

**GET** `/api/health`

Returns service health status and performance metrics.

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "redis": {"status": "up", "responseTime": 5},
    "openrouter": {"status": "configured"}
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

## Performance

### Caching Strategy

- **Message Caching**: 1-minute TTL with context awareness
- **Cache Keys**: Based on pace, heart rate, distance, model
- **Cache Invalidation**: On training goal changes
- **Memory Management**: Redis maxmemory policy with LRU

### Response Times

- **Health Check**: ~10ms
- **Cached Coaching**: ~50ms
- **New AI Request**: ~1-3 seconds
- **Profile/Runs**: ~20-100ms

### Resource Usage

- **Memory**: ~128MB base + Redis (256MB)
- **CPU**: <10% during normal operation
- **Storage**: ~100MB application + Redis data
- **Network**: Outbound HTTPS to OpenRouter

## Monitoring

### Health Monitoring

- **Endpoint**: `/api/health`
- **Metrics**: Redis performance, API configuration, uptime
- **Alerts**: 503 status on service failures

### Logging

```bash
# Application logs
docker logs coolify-backend

# Redis logs  
docker logs coolify-redis

# Combined monitoring
docker-compose logs -f
```

### Key Metrics

- API response times
- Redis hit/miss ratios
- OpenRouter API usage
- Error rates and types

## Migration from Vercel

### Benefits

| Aspect | Vercel | Coolify |
|--------|--------|---------|
| **Cost** | Usage-based ($$$) | Fixed server ($$) |
| **Performance** | Cold starts | Always warm |
| **Limits** | Function timeouts | Unlimited duration |
| **Control** | Limited | Full access |
| **Privacy** | Cloud-based | Self-hosted |

### Migration Steps

1. **Deploy Coolify backend** (this repository)
2. **Update Android app** configuration:
   ```properties
   # local.properties
   AI_COACHING_BASE_URL=https://your-coolify-domain.com
   ```
3. **Test thoroughly** with development builds
4. **Deploy production** Android app
5. **Monitor and optimize** performance
6. **Decommission Vercel** when stable

## Development

### Project Structure

```
coolify-backend/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── coaching/  # AI coaching endpoint
│   │   │   ├── profile/   # User profile management
│   │   │   ├── runs/      # Run history logging
│   │   │   └── health/    # Health monitoring
│   │   ├── page.tsx       # Homepage
│   │   └── layout.tsx     # App layout
│   ├── lib/
│   │   ├── redis.ts       # Redis client
│   │   └── openrouter.ts  # AI API client
│   └── types/
│       └── coaching.ts    # Type definitions
├── scripts/
│   ├── deploy-coolify.sh  # Deployment script
│   ├── test-api.sh        # API testing (bash)
│   └── local-test.js      # API testing (Node.js)
├── docker-compose.yml     # Production deployment
├── Dockerfile            # Container definition
└── COOLIFY_DEPLOYMENT.md # Deployment guide
```

### Testing

```bash
# Local API testing
npm run test:api

# Remote API testing
npm run test:api:remote --url=https://your-domain.com

# Docker testing
./scripts/deploy-coolify.sh test

# Manual testing
curl -X POST http://localhost:3000/api/coaching \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test:api` - Test all API endpoints
- `npm run docker:build` - Build Docker image
- `./scripts/deploy-coolify.sh` - Prepare Coolify deployment

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker logs coolify-redis
   
   # Test connection
   redis-cli ping
   ```

2. **OpenRouter API Errors**
   ```bash
   # Verify API key
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer $OPENROUTER_API_KEY"
   ```

3. **High Memory Usage**
   ```bash
   # Check Redis memory
   redis-cli INFO memory
   
   # Monitor application
   docker stats coolify-backend
   ```

### Debug Mode

Enable detailed logging:

```bash
# Set environment variable
DEBUG=true npm run dev

# Check logs
docker-compose logs -f backend
```

## Security

### Best Practices

- ✅ Environment-based secrets (no hardcoded keys)
- ✅ HTTPS-only in production
- ✅ CORS configured for Android app
- ✅ Input validation and sanitization
- ✅ Rate limiting considerations
- ✅ Container security with non-root user

### Recommendations

- Use strong Redis passwords in production
- Configure firewall rules for limited access
- Regularly update Docker images
- Monitor for security updates
- Implement API rate limiting if needed

## Support

### Documentation

- [Coolify Deployment Guide](./COOLIFY_DEPLOYMENT.md)
- [Android Migration Guide](../ANDROID_MIGRATION_GUIDE.md)
- [Main Project Documentation](../CLAUDE.md)

### Getting Help

1. **Check logs** in Coolify dashboard
2. **Test endpoints** with provided scripts
3. **Review configuration** in environment variables
4. **Monitor resources** for performance issues

## License

This project is part of the JogGPS running tracker application. See the main project repository for licensing information.

---

**Built with ❤️ for self-hosted AI coaching**

Migrated from Vercel to Coolify for better performance, lower costs, and enhanced privacy.