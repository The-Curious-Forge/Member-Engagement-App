#!/bin/bash
set -e

echo "=== Restarting Member Engagement App ==="

# Stop and remove existing containers
echo "Stopping existing containers..."
docker compose down

# Rebuild and start the containers
echo "Rebuilding and starting containers..."
docker compose up -d --build

echo "=== Restart complete! ==="
echo "Your application should be available at http://$(hostname -I | awk '{print $1}'):5174"
echo "To view logs, run: docker compose logs -f"