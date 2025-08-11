# Member Engagement App (The Curious Forge)

This repository contains the source code for the Member Engagement Kiosk used by The Curious Forge. It provides a touchscreen kiosk UI for sign-in/out, kudos, messages, and realtime sync across devices.

Quick links

- Docs: [`docs/README.md`](docs/README.md)
- Airtable schema: [`docs/AIRTABLE_SCHEMA.md`](docs/AIRTABLE_SCHEMA.md)
- Backend entry: [`packages/backend/index.js`](packages/backend/index.js)
- Frontend offline layer: [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts)
- Service worker: [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js)

## Table of contents

- [Quickstart](#quickstart)
- [Environment variables](#environment-variables)
- [Architecture overview](#architecture-overview)
- [Key concepts](#key-concepts)
- [Developer workflow](#developer-workflow)
- [File layout](#file-layout)
- [API reference](#api-reference)
- [Airtable integration](#airtable-integration)
- [Troubleshooting and tips](#troubleshooting-and-tips)

## Quickstart

Development (recommended using Docker Compose)

1. Copy `.env.example` to `.env` and fill in keys.
2. Start dev containers:

```bash
docker-compose -f docker-compose.dev.yml up
```

- Frontend: http://localhost:5174
- Backend API: http://localhost:3000

Production (build and serve)

```bash
docker-compose up --build
```

Running without Docker (local Node/Svelte)

- Backend:

```bash
cd packages/backend
npm install
npm run dev
```

- Frontend:

```bash
cd packages/frontend
npm install
npm run dev
```

## Environment variables

Create a `.env` in repo root (example in [`.env.example`](.env.example)):

Required variables:

- AIRTABLE_API_KEY
- AIRTABLE_BASE_ID
- GOOGLE_API_KEY
- GOOGLE_CALENDAR_ID

See [`packages/backend/services/airtableClient.js`](packages/backend/services/airtableClient.js) for table names used by the backend.

## Architecture overview

The project uses a simple three-tier architecture:

- Frontend: SvelteKit application providing the kiosk UI. Key client features:
  - Offline-first data using IndexedDB via [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts)
  - Background sync and caching via a service worker: [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js)
  - Centralized client stores in [`packages/frontend/src/stores/appStore.ts`](packages/frontend/src/stores/appStore.ts)
- Backend: Node.js + Express server that proxies and consolidates Airtable access, exposes REST endpoints, and emits realtime events via Socket.IO. Entry point: [`packages/backend/index.js`](packages/backend/index.js)
- Airtable: Source of truth hosting tables for members, signed-in records, kudos, messages, activities, and more. Schema documented at [`docs/AIRTABLE_SCHEMA.md`](docs/AIRTABLE_SCHEMA.md)

## Key concepts

- Offline-first
  - The frontend caches entities in IndexedDB (see [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts)).
  - User actions performed while offline (sign-outs, kudos, messages) are queued as "pending actions" and synchronized by the service worker when connectivity is restored.
- Real-time updates
  - Backend emits events (e.g., signInUpdate, signOutUpdate) via Socket.IO.
  - Client socket handlers wired in [`packages/frontend/src/services/memberAuthService.ts`](packages/frontend/src/services/memberAuthService.ts) update stores immediately on events.
- Airtable abstraction
  - Backend uses [`packages/backend/services/airtableClient.js`](packages/backend/services/airtableClient.js) to centralize table names and create an Airtable base instance.

## Backend: routes and services

- Routes are under `packages/backend/routes/*`. The server exposes endpoints for:
  - POST /api/signIn — sign a member in (see [`packages/backend/routes/signIn.js`](packages/backend/routes/signIn.js))
  - POST /api/signOut — sign a member out and record use-log
  - /api/members/\* — members, signed-in members, monthly recognition, etc.
  - /api/kudos — create and list kudos
  - /api/messages — create and list messages
  - /api/alerts — combined system + Airtable alerts

Services under `packages/backend/services/*` encapsulate Airtable logic (e.g., [`packages/backend/services/membersService.js`](packages/backend/services/membersService.js), [`packages/backend/services/kudosService.js`](packages/backend/services/kudosService.js), [`packages/backend/services/messagesService.js`](packages/backend/services/messagesService.js)).

## Frontend: stores, offline, and sync

- Central stores live in [`packages/frontend/src/stores/appStore.ts`](packages/frontend/src/stores/appStore.ts). They:
  - provide fetch functions that use the network when online and fallback to IndexedDB when offline
  - publish derived values such as activeMembers and connectionStatus
- Offline utilities are implemented in [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts) and manage:
  - IndexedDB schema and operations
  - Pending action queue and ServiceWorker registration
- Service worker implements:
  - network-first caching for API endpoints and background sync for pending actions (see [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js))
- Socket handling and member auth are in [`packages/frontend/src/services/memberAuthService.ts`](packages/frontend/src/services/memberAuthService.ts)

## Development workflow

- Use Docker Compose for fast local setup. The development compose mounts source into containers for live reload.
- Backend: use `npm run dev` (nodemon) to restart on changes.
- Frontend: use `npm run dev` to start Svelte dev server.
- When working with Airtable data, use a separate test base or a branch table to avoid polluting production data.

## Troubleshooting and tips

- Backend logs: check container logs or run `node index.js` locally; errors are logged and returned as JSON.
- Frontend: open browser console and watch service worker & IndexedDB operations (see `console.log` statements in [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts) and [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js)).
- Socket.IO: connection state is exposed in [`packages/frontend/src/stores/connectionStore.ts`](packages/frontend/src/stores/connectionStore.ts)
