# Deployment Guide

This guide covers deploying the Member Engagement App to a production environment using the following stack:

- **Ubuntu Server (Droplet)**
- **Traefik** (reverse proxy with automatic TLS)
- **Portainer** (container management UI)
- **Docker Compose** (service orchestration)
- **Watchtower** (automatic container updates)
- **GitHub Actions** (CI/CD)
- **GitHub Container Registry** (image storage)

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
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Test application endpoints
curl -k https://signin.thecuriousforge.org/api/health
curl -k https://signin.thecuriousforge.org

# Check Traefik API
curl -k https://traefik.thecuriousforge.org:8080/api/overview
```

## 11. Security Considerations

1. **Firewall**: Configure UFW to only allow necessary ports (80, 443, 22)
2. **SSH**: Disable password authentication, use key-based authentication only
3. **Updates**: Keep server packages updated
4. **Secrets**: Never commit `.env` files or secrets to version control
5. **Access**: Limit SSH access to specific IP addresses if possible
6. **Monitoring**: Set up log monitoring and alerting

## 12. Scaling and Performance

### Horizontal scaling

To run multiple instances of the application:

```yaml
# In docker-compose.prod.yml, add replica configuration
backend:
  # ... existing config
  deploy:
    replicas: 2

frontend:
  # ... existing config
  deploy:
    replicas: 2
```

### Resource limits

Add resource constraints to prevent containers from consuming all server resources:

```yaml
backend:
  # ... existing config
  deploy:
    resources:
      limits:
        memory: 512M
        cpus: "0.5"
```

## Support

For deployment issues:

1. Check container logs first
2. Verify all prerequisites are met
3. Review this documentation
4. Create an issue in the GitHub repository with logs and error details
