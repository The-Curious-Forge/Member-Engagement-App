# Deployment Guide

## Overview

We use Docker to containerize both the **frontend (SvelteKit)** and the **backend (Node + Socket.IO)**. Airtable remains a cloud service; no container needed.

## Prerequisites

- Docker & Docker Compose installed.
- Access to environment variables (Airtable keys, etc.).

## Environment Variables

Create a `.env` or pass them directly:

AIRTABLE_API_KEY=... AIRTABLE_BASE_ID=... NODE_ENV=production WEBSOCKET_PORT=3001 FRONTEND_PORT=4173


## Docker Compose

An example `docker-compose.yml`:

```yaml
version: '3'
services:
  backend:
    build: ./packages/backend
    ports:
      - "3000:3000"
    environment:
      - AIRTABLE_API_KEY
      - AIRTABLE_BASE_ID
    depends_on:
      - "frontend"

  frontend:
    build: ./packages/frontend
    ports:
      - "4173:4173"