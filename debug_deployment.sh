#!/bin/bash
# Debug deployment script

echo "=== CONTAINER STATUS ==="
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "=== FRONTEND HEALTH CHECK ==="
docker exec member-engagement-frontend wget -qO- http://localhost:3000 || echo "Health check failed"

echo ""
echo "=== NETWORK INSPECTION ==="
docker network ls | grep member-engagement

echo ""
echo "=== TRAEFIK CONTAINER INSPECTION ==="
docker exec traefik wget -qO- http://localhost:8080/api/http/routers || echo "Traefik API failed"

echo ""
echo "=== FRONTEND CONTAINER LOGS ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend

echo ""
echo "=== TRAEFIK LOGS ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 traefik

echo ""
echo "=== CONNECTIVITY TEST ==="
docker exec traefik wget -qO- http://member-engagement-frontend:3000 || echo "Internal connectivity failed"