#!/bin/bash
set -e

echo "=== Fixing WebSocket Connection for HTTPS ==="

# Rebuild the frontend with the updated WebSocket URL
echo "Rebuilding frontend..."
docker compose down
docker compose up -d --build

# Update Nginx configuration to properly handle WebSocket connections
echo "Updating Nginx configuration..."
cat > /etc/nginx/sites-available/signin.thecuriousforge.org << 'EOL'
server {
    listen 80;
    server_name signin.thecuriousforge.org;
    
    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name signin.thecuriousforge.org;

    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/signin.thecuriousforge.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/signin.thecuriousforge.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend application
    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket connection
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
EOL

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

echo "=== WebSocket fix complete! ==="
echo "Your application should now work correctly with secure WebSocket connections."
echo "Visit https://signin.thecuriousforge.org to test."