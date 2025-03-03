# Setting Up Domain Name for Member Engagement App

This guide will walk you through setting up your application to be accessible at `signin.thecuriousforge.org` with HTTPS.

## 1. Configure DNS Settings

First, you need to add a DNS record to point your domain to your Digital Ocean droplet:

1. Log in to your DNS provider's management console
2. Add an A record with:
   - Host/Name: `signin` (or `signin.thecuriousforge.org` depending on your DNS provider's format)
   - Value/Points to: `64.23.142.177` (your Digital Ocean droplet IP)
   - TTL: 3600 (or default)

DNS changes can take up to 24-48 hours to propagate, but often happen within minutes to a few hours.

## 2. Install Nginx and Certbot

SSH into your Digital Ocean droplet and install Nginx and Certbot:

```bash
ssh root@64.23.142.177

# Update package lists
apt update

# Install Nginx
apt install -y nginx

# Install Certbot and Nginx plugin
apt install -y certbot python3-certbot-nginx
```

## 3. Configure Nginx as a Reverse Proxy

Create an Nginx configuration file for your domain:

```bash
nano /etc/nginx/sites-available/signin.thecuriousforge.org
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name signin.thecuriousforge.org;

    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site by creating a symbolic link:

```bash
ln -s /etc/nginx/sites-available/signin.thecuriousforge.org /etc/nginx/sites-enabled/
```

Test the Nginx configuration:

```bash
nginx -t
```

If the test is successful, restart Nginx:

```bash
systemctl restart nginx
```

## 4. Set Up SSL/TLS Certificate with Let's Encrypt

Run Certbot to obtain and install an SSL certificate:

```bash
certbot --nginx -d signin.thecuriousforge.org
```

Follow the prompts to complete the certificate setup. Certbot will automatically update your Nginx configuration to use HTTPS.

## 5. Update Application Configuration

Now you need to update your application to work with the new domain. Create a new file called `update-domain.sh`:

```bash
nano update-domain.sh
```

Add the following content:

```bash
#!/bin/bash
set -e

echo "=== Updating Member Engagement App for Domain Name ==="

# Update CORS settings in docker-compose.yml
sed -i 's|CORS_ORIGIN=http://localhost:5174,http://64.23.142.177:5174|CORS_ORIGIN=https://signin.thecuriousforge.org|g' docker-compose.yml

# Update WebSocket URL in frontend code
cd packages/frontend/src/routes
sed -i "s|const socketUrl = window.location.hostname === 'localhost'\n            ? 'ws://localhost:3000'\n            : \`ws://\${window.location.hostname}:3000\`;|const socketUrl = window.location.hostname === 'localhost' ? 'ws://localhost:3000' : 'wss://signin.thecuriousforge.org';|g" +layout.svelte

# Rebuild and restart the containers
cd ../../../..
docker compose down
docker compose up -d --build

echo "=== Update complete! ==="
echo "Your application should now be accessible at https://signin.thecuriousforge.org"
```

Make the script executable:

```bash
chmod +x update-domain.sh
```

Run the script:

```bash
./update-domain.sh
```

## 6. Configure Firewall (Optional but Recommended)

If you're using UFW (Uncomplicated Firewall), allow HTTP, HTTPS, and SSH:

```bash
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

## 7. Test Your Setup

After completing all the steps and waiting for DNS propagation, visit:

```
https://signin.thecuriousforge.org
```

Your Member Engagement App should now be accessible via this domain with HTTPS!

## Troubleshooting

If you encounter issues:

1. **DNS Issues**: Use `dig signin.thecuriousforge.org` to check if DNS is resolving to your server IP
2. **Nginx Issues**: Check Nginx logs with `tail -f /var/log/nginx/error.log`
3. **Certificate Issues**: Run `certbot certificates` to check certificate status
4. **Application Issues**: Check Docker logs with `docker compose logs -f`

## Automatic Certificate Renewal

Let's Encrypt certificates expire after 90 days. Certbot installs a cron job that automatically renews certificates before they expire. You can test the renewal process with:

```bash
certbot renew --dry-run
```
