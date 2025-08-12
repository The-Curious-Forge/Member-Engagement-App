# Production Deployment Strategy

## Overview

This document outlines the optimized production deployment strategy for the Member Engagement App, moving from Vite preview to SvelteKit Node.js server for better performance, reliability, and scalability.

## Key Changes

### 1. SvelteKit Adapter Migration

- **Before**: [`@sveltejs/adapter-auto`](packages/frontend/svelte.config.js) with static output
- **After**: [`@sveltejs/adapter-node`](packages/frontend/svelte.config.js) with Node.js server

### 2. Docker Optimization

- **Multi-stage build** for smaller production images
- **Layer caching** for faster rebuilds
- **Security improvements** with non-root user
- **Health checks** for container monitoring
- **Resource limits** to prevent resource exhaustion

### 3. Performance Improvements

- **Precompressed assets** (gzip/brotli)
- **Optimized Node.js server** instead of Vite preview
- **Production-only dependencies** in final image
- **Build time reduction** from 8+ minutes to ~2-3 minutes

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│    Traefik      │────│   SvelteKit      │────│    Backend     │
│  (Port 80/443)  │    │  Node.js Server  │    │  (Port 3000)   │
│                 │    │   (Port 3000)    │    │                │
└─────────────────┘    └──────────────────┘    └────────────────┘
```

## Build Process

### Development

```bash
npm run dev          # Vite dev server (port 5174)
```

### Production Build

```bash
npm run build        # SvelteKit build → /build directory
npm start           # Node.js server from /build
```

### Docker Build Stages

1. **Dependencies Stage**: Install production dependencies
2. **Build Stage**: Install all dependencies and build application
3. **Production Stage**: Copy built app and production dependencies only

## Deployment Flow

### Automatic (Recommended)

1. Push code to `main` branch → builds images
2. Push to `live` branch → deploys to production
3. GitHub Actions builds and pushes to GHCR
4. Watchtower detects new images and restarts containers

### Manual

```bash
cd /opt/member-engagement-app
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Configuration Changes

### Package.json Updates

- Added [`@sveltejs/adapter-node`](packages/frontend/package.json) dependency
- Added `start` script for production server
- Removed `@sveltejs/adapter-auto` dependency

### SvelteKit Config

- Configured Node.js adapter with optimization options
- Enabled precompressed assets
- Set output directory to `build`

### Docker Updates

- Multi-stage build for optimization
- Health checks for monitoring
- Security hardening with non-root user
- Resource limits and reservations

### Docker Compose Updates

- Changed port from 4173 → 3000
- Added health checks
- Added resource constraints
- Improved environment configuration

## Performance Benefits

### Build Time

- **Before**: 8+ minutes (single-stage build)
- **After**: 2-3 minutes (cached multi-stage build)

### Runtime Performance

- **Before**: Vite preview server (development tool)
- **After**: Optimized Node.js production server

### Image Size

- **Before**: ~800MB (includes dev dependencies)
- **After**: ~200MB (production-only)

### Memory Usage

- **Before**: Unlimited (potential OOM)
- **After**: 512MB limit with 256MB reservation

## Security Improvements

1. **Non-root user**: Container runs as `sveltekit` user
2. **Minimal dependencies**: Production image contains only necessary packages
3. **Health checks**: Automatic container health monitoring
4. **Resource limits**: Prevents resource exhaustion attacks

## Monitoring & Health Checks

### Container Health

```bash
docker ps                    # Check container status
docker-compose logs frontend # View application logs
```

### Application Health

```bash
curl https://signin.thecuriousforge.org     # Frontend health
curl https://signin.thecuriousforge.org/api # Backend health
```

### Traefik Dashboard

- URL: https://traefik.thecuriousforge.org:8080
- Monitor routing and SSL certificate status

## Troubleshooting

### Build Issues

```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker-compose build --no-cache frontend
```

### Runtime Issues

```bash
# Check container logs
docker-compose logs -f frontend

# Restart specific service
docker-compose restart frontend

# Check health status
docker inspect member-engagement-frontend | grep -A 10 Health
```

### Performance Issues

```bash
# Monitor resource usage
docker stats

# Check container limits
docker inspect member-engagement-frontend | grep -A 20 Resources
```

## Migration Steps

### For New Deployments

1. Use the updated configuration files
2. Run `npm install` to get new adapter
3. Build and deploy normally

### For Existing Deployments

1. **Backup current setup**:

   ```bash
   cp .env ~/backups/env-$(date +%Y%m%d).backup
   ```

2. **Update code**:

   ```bash
   git pull origin live
   ```

3. **Rebuild containers**:

   ```bash
   docker-compose -f docker-compose.prod.yml build --no-cache
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify deployment**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   curl https://signin.thecuriousforge.org
   ```

## Rollback Plan

If issues occur:

1. **Immediate rollback**:

   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Restore previous version**:
   ```bash
   git checkout <previous-commit>
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Next Steps

1. **Test deployment** in staging environment
2. **Monitor performance** metrics post-deployment
3. **Set up alerts** for health check failures
4. **Document any environment-specific configurations**

## Support

For deployment issues:

1. Check container logs: `docker-compose logs frontend`
2. Verify health checks: `docker ps`
3. Test application endpoints
4. Review this documentation
5. Create GitHub issue with logs and error details
