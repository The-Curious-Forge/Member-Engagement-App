# Deployment Guide

This guide covers deploying the Member Engagement App to a production environment using the following stack:

- **Ubuntu Server (Droplet)**
- **SvelteKit Node.js Server** (optimized production frontend)
- **Traefik** (reverse proxy with automatic TLS)
- **Portainer** (container management UI)
- **Docker Compose** (service orchestration)
- **Watchtower** (automatic container updates)
- **GitHub Actions** (CI/CD)
- **GitHub Container Registry** (image storage)

> **Note**: This deployment now uses SvelteKit's Node.js adapter instead of Vite preview for better production performance. See [Production Deployment Strategy](PRODUCTION_DEPLOYMENT_STRATEGY.md) for detailed changes.

## Prerequisites

1. Ubuntu server (20.04+ recommended)
2. Domain with DNS access (Cloudflare recommended)
3. GitHub repository with Actions enabled
4. Required API keys (Airtable, Google Calendar)

## 1. Server Setup

### Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group changes
exit
```

### Create deployment directory

```bash
# Create application directory
sudo mkdir -p /opt/member-engagement-app
sudo chown $USER:$USER /opt/member-engagement-app
cd /opt/member-engagement-app

# Clone repository (or upload files)
git clone https://github.com/YOUR_USERNAME/Member-Engagement-App.git .
```

## 2. DNS Configuration

Configure the following DNS records in Cloudflare (or your DNS provider):

| Type | Name                          | Target         | TTL  |
| ---- | ----------------------------- | -------------- | ---- |
| A    | signin.thecuriousforge.org    | YOUR_SERVER_IP | Auto |
| A    | portainer.thecuriousforge.org | YOUR_SERVER_IP | Auto |
| A    | traefik.thecuriousforge.org   | YOUR_SERVER_IP | Auto |

## 3. Environment Configuration

### Create production environment file

```bash
cd /opt/member-engagement-app
cp .env.example .env
```

Edit `.env` with your production values:

```bash
# Airtable Configuration
AIRTABLE_API_KEY=your_production_airtable_api_key
AIRTABLE_BASE_ID=your_production_airtable_base_id

# Google API Configuration
GOOGLE_API_KEY=your_production_google_api_key
GOOGLE_CALENDAR_ID=your_production_google_calendar_id

# Node Environment
NODE_ENV=production
```

**Security Note:** Never commit the `.env` file to version control. Keep it secure on the server only.

## 4. GitHub Setup

### Configure Repository Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

| Secret Name           | Description           | Example                                  |
| --------------------- | --------------------- | ---------------------------------------- |
| `PRODUCTION_HOST`     | Server IP or hostname | `123.456.789.123`                        |
| `PRODUCTION_USERNAME` | SSH username          | `ubuntu`                                 |
| `PRODUCTION_SSH_KEY`  | Private SSH key       | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### Generate SSH Key for Deployment

On your local machine:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "deployment@member-engagement-app"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@YOUR_SERVER_IP

# Copy private key content for GitHub secret
cat ~/.ssh/id_rsa
```

### Enable GitHub Container Registry

The workflow automatically publishes to GitHub Container Registry (GHCR). Ensure your repository has the following permissions:

1. Go to repository Settings → Actions → General
2. Set "Workflow permissions" to "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"

## 5. Initial Deployment

### Manual first deployment

```bash
cd /opt/member-engagement-app

# Pull the latest images (after pushing to 'live' branch)
docker-compose -f docker-compose.prod.yml pull

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Verify deployment

1. **Traefik Dashboard**: https://traefik.thecuriousforge.org:8080
2. **Portainer**: https://portainer.thecuriousforge.org
3. **Application**: https://signin.thecuriousforge.org

### Health Checks

The new deployment includes automatic health monitoring:

```bash
# Check container health status
docker-compose -f docker-compose.prod.yml ps

# Monitor health checks in real-time
docker events --filter container=member-engagement-frontend --filter event=health_status

# Manual health check
curl -f https://signin.thecuriousforge.org || echo "Health check failed"
```

## 6. Monitoring and Maintenance

### Check container logs

```bash
# View all container logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs traefik

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

### Watchtower automatic updates

Watchtower is configured to:

- Check for image updates every 5 minutes
- Automatically pull and restart containers with new images
- Clean up old images after updates
- Only update containers: `member-engagement-backend` and `member-engagement-frontend`

### Manual container management

```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build backend

# View container status
docker ps

# Clean up unused images/containers
docker system prune -f
```

## 7. SSL Certificates

Traefik automatically manages SSL certificates via Let's Encrypt:

- Certificates are stored in the `traefik-acme` volume
- Automatic renewal before expiration
- HTTP traffic automatically redirects to HTTPS

## 8. Backup Strategy

### Important data to backup

1. **Environment variables**: `/opt/member-engagement-app/.env`
2. **Traefik certificates**: `traefik-acme` Docker volume
3. **Portainer data**: `portainer-data` Docker volume

### Backup commands

```bash
# Backup environment file
cp /opt/member-engagement-app/.env ~/backups/env-$(date +%Y%m%d).backup

# Backup Docker volumes
docker run --rm -v traefik-acme:/data -v ~/backups:/backup alpine tar czf /backup/traefik-acme-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v portainer-data:/data -v ~/backups:/backup alpine tar czf /backup/portainer-data-$(date +%Y%m%d).tar.gz -C /data .
```

## 9. Deployment Workflow

### Automatic deployment (recommended)

1. Make changes to your code
2. Commit and push to `main` branch (builds images)
3. When ready to deploy, push to `live` branch
4. GitHub Actions automatically:
   - Builds Docker images
   - Pushes to GitHub Container Registry
   - Deploys to production server
   - Watchtower detects updates and restarts containers

### Manual deployment

```bash
# On your server
cd /opt/member-engagement-app
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 10. Troubleshooting

### Common issues

**Services not accessible:**

- Check DNS records are correct
- Verify Traefik labels in docker-compose.prod.yml
- Check container logs: `docker-compose logs traefik`

**SSL certificate issues:**

- Ensure domain points to correct IP
- Check Traefik logs for ACME errors
- Verify email in Traefik configuration

**Container startup failures:**

- Check environment variables in `.env`
- Verify image availability: `docker-compose pull`
- Check resource usage: `docker stats`

**Watchtower not updating:**

- Check Watchtower logs: `docker logs watchtower`
- Verify image tags are `latest`
- Ensure containers are named correctly

### Health checks

```bash
# Check all services and their health status
docker-compose -f docker-compose.prod.yml ps

# Test application endpoints
curl -f https://signin.thecuriousforge.org/api/health
curl -f https://signin.thecuriousforge.org

# Check Traefik API
curl -k https://traefik.thecuriousforge.org:8080/api/overview

# Monitor container resource usage
docker stats member-engagement-frontend member-engagement-backend

# Check specific container health
docker inspect member-engagement-frontend | grep -A 10 Health
```

## 11. Security Considerations

1. **Firewall**: Configure UFW to only allow necessary ports (80, 443, 22)
2. **SSH**: Disable password authentication, use key-based authentication only
3. **Updates**: Keep server packages updated
4. **Secrets**: Never commit `.env` files or secrets to version control
5. **Access**: Limit SSH access to specific IP addresses if possible
6. **Monitoring**: Set up log monitoring and alerting

## 12. Performance and Resource Management

### Current Resource Limits

The deployment now includes optimized resource management:

**Frontend (SvelteKit Node.js)**:

- Memory limit: 512MB
- Memory reservation: 256MB
- CPU limit: 0.5 cores
- CPU reservation: 0.25 cores

**Backend**:

- No limits set (adjust as needed)

### Build Performance

**Optimized Docker Build**:

- Multi-stage build reduces image size from ~800MB to ~200MB
- Build time reduced from 8+ minutes to 2-3 minutes
- Layer caching for faster rebuilds

### Horizontal Scaling

To scale horizontally (multiple instances):

```yaml
frontend:
  # ... existing config
  deploy:
    replicas: 2
    resources:
      limits:
        memory: 512M
        cpus: "0.5"
```

### Performance Monitoring

```bash
# Monitor real-time resource usage
docker stats

# Check container performance
docker exec member-engagement-frontend top

# View detailed container info
docker inspect member-engagement-frontend | grep -A 20 Resources
```

## 13. Migration from Vite Preview

If upgrading from the previous Vite preview setup:

### Before Migration

```bash
# Backup current environment
cp .env ~/backups/env-$(date +%Y%m%d).backup

# Stop current containers
docker-compose -f docker-compose.prod.yml down
```

### Migration Steps

```bash
# Pull latest code with Node.js adapter
git pull origin live

# Install new dependencies
cd packages/frontend
npm install

# Rebuild containers with new configuration
cd ../../
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d

# Verify migration
docker-compose -f docker-compose.prod.yml ps
curl -f https://signin.thecuriousforge.org
```

### Key Changes

- Frontend now runs on port 3000 (was 4173)
- Uses Node.js server instead of Vite preview
- Includes health checks and resource limits
- Optimized build process with multi-stage Docker

## Support

For deployment issues:

1. **Check container logs first**: `docker-compose logs frontend`
2. **Verify health status**: `docker-compose ps`
3. **Test endpoints**: `curl -f https://signin.thecuriousforge.org`
4. **Review documentation**: [Production Deployment Strategy](PRODUCTION_DEPLOYMENT_STRATEGY.md)
5. **Create GitHub issue** with logs and error details

### Common Migration Issues

**Port conflicts**: Ensure no other services use port 3000
**Memory issues**: Monitor with `docker stats` - containers now have limits
**Build failures**: Clear Docker cache with `docker builder prune`
**Health check failures**: Check application startup in logs
