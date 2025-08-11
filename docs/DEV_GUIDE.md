# Developer Guide

This guide explains the repository layout, local development workflow, debugging tips, and deployment guidance for the Member Engagement App (The Curious Forge).

Table of contents

- [Quickstart (Docker)](#quickstart-docker)
- [Quickstart (Local)](#quickstart-local)
- [Environment variables](#environment-variables)
- [Project layout](#project-layout)
- [Backend: overview & routes](#backend-overview--routes)
- [Frontend: stores, offline & sync](#frontend-stores-offline--sync)
- [Offline-first flow (how it works)](#offline-first-flow-how-it-works)
- [Service worker & background sync](#service-worker--background-sync)
- [Realtime (Socket.IO) events](#realtime-socketio-events)
- [Debugging & troubleshooting](#debugging--troubleshooting)
- [Testing checklist](#testing-checklist)
- [Deployment notes](#deployment-notes)
- [Contributing & next steps](#contributing--next-steps)
- [References](#references)

Quickstart (Docker)

1. Copy the example env:

   - cp .env.example .env
   - Edit `.env` with your Airtable / Google keys (use a test Airtable base for development).

2. Start development services:

   - docker-compose -f docker-compose.dev.yml up

3. Open apps:
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3000

Quickstart (Local)

- Backend

  - cd packages/backend
  - npm install
  - npm run dev
  - Entry point: [`packages/backend/index.js`](packages/backend/index.js)

- Frontend
  - cd packages/frontend
  - npm install
  - npm run dev
  - Svelte dev server: http://localhost:5174

Environment variables

Create `.env` at repo root (see [`.env.example`](.env.example)). Minimum required variables:

- AIRTABLE_API_KEY
- AIRTABLE_BASE_ID
- GOOGLE_API_KEY (optional for calendar)
- GOOGLE_CALENDAR_ID (optional for calendar)

Project layout (high level)

- packages/backend

  - [`packages/backend/index.js`](packages/backend/index.js) — server bootstrap, Socket.IO init, route wiring
  - [`packages/backend/routes/`] — Express routes (signIn, signOut, members, etc.)
  - [`packages/backend/services/`] — Airtable and domain logic (membersService, kudosService, messagesService, etc.)
  - [`packages/backend/services/airtableClient.js`](packages/backend/services/airtableClient.js) — Airtable base + table constants

- packages/frontend
  - [`packages/frontend/src/stores/appStore.ts`](packages/frontend/src/stores/appStore.ts) — primary stores and sync functions
  - [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts) — IndexedDB helpers and pending actions queue
  - [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js) — caching + background sync
  - [`packages/frontend/src/services/memberAuthService.ts`](packages/frontend/src/services/memberAuthService.ts) — auth calls + socket handlers
  - UI under `packages/frontend/src/components/`

Backend — overview & routes

- Responsibilities

  - Proxy Airtable access (protect keys)
  - Provide aggregated endpoints for the frontend
  - Emit realtime events via Socket.IO for UI updates

- Common routes (see `packages/backend/routes/`):

  - POST `/api/signIn` — create a Signed In record (see [`packages/backend/routes/signIn.js`](packages/backend/routes/signIn.js))
  - POST `/api/signOut` — create a Use Log and remove Signed In record
  - GET `/api/members/allData` — aggregated member data (members + messages + kudos + signed-in state)
  - GET `/api/members/signedInMembers` — list currently signed-in members
  - GET/POST `/api/kudos` — list & create kudos
  - GET/POST `/api/messages` — list & create messages
  - GET `/api/activities`, `/api/alerts`, `/api/mentors`, `/api/calendar/events`, etc.

- Helpful backend files:
  - [`packages/backend/services/membersService.js`](packages/backend/services/membersService.js)
  - [`packages/backend/services/kudosService.js`](packages/backend/services/kudosService.js)
  - [`packages/backend/services/messagesService.js`](packages/backend/services/messagesService.js)

Frontend — stores, offline & sync

- Centralized stores:

  - [`packages/frontend/src/stores/appStore.ts`](packages/frontend/src/stores/appStore.ts)
  - Exposes fetchers (fetchAllMembers, fetchKudos, fetchMessages, etc.), actions (memberActions, kudosActions, messageActions), and syncStores()

- Offline utilities:

  - [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts)
  - Manages IndexedDB stores: members, kudos, messages, pendingActions, metadata, etc.
  - Exposes `offlineStorage` (store/get/getAll/delete/clear) and `pendingActions` (add/getAll/remove)

- Connection and sync state:
  - [`packages/frontend/src/stores/connectionStore.ts`](packages/frontend/src/stores/connectionStore.ts)
  - Tracks isOnline, isSyncing, pendingActionsCount and exposes a `connectionStatus` derived store

Offline-first flow (how it works)

1. Data fetching

   - Each fetch function checks:
     - If offline OR cached data is fresh (metadata/staleness), return cached data
     - Otherwise, fetch from API, store results in IndexedDB and update metadata
   - Cache TTL is implemented in [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts)

2. Pending actions (user writes while offline)
   - Actions (signOut, kudos, message) are saved in `pendingActions` with a client-generated id and timestamp
   - The UI is updated optimistically
   - The service worker or background sync processes pending actions when connectivity is restored
   - Actions map to API endpoints:
     - signIn -> POST `/api/signIn`
     - signOut -> POST `/api/signOut`
     - kudos -> POST `/api/kudos`
     - message -> POST `/api/messages`

Service worker & background sync

- File: [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js)
- Strategy:
  - Network-first for `/api/` requests (fall back to cache on failure)
  - Cache-first for static assets
  - Background sync:
    - Uses `sync` event with tag `sync-pending-actions` when available
    - Fallback: listens for client `message` events with type `SYNC_PENDING_ACTIONS`
  - Sync procedure:
    - Open IndexedDB (pendingActions)
    - Iterate pending actions, POST to corresponding endpoints, remove successful actions

Realtime (Socket.IO) events

- Socket initialized at server entry: [`packages/backend/index.js`](packages/backend/index.js)
- Routes can emit events via `req.io`
- Frontend subscribes in [`packages/frontend/src/services/memberAuthService.ts`](packages/frontend/src/services/memberAuthService.ts)

Notable events:

- `signInUpdate` — payload: updated member object (includes `signInRecordId`, `signInTime`, `currentMemberType`, etc.)
- `signOutUpdate` — payload: { signInRecordId, memberId }
- Additional events may be emitted for kudos/messages/alerts where appropriate (check route implementations)

Debugging & troubleshooting

- Backend

  - Run: cd packages/backend && npm run dev
  - Logs are printed to console; global error middleware returns JSON for errors
  - Helpful places to add logs: route handlers and service functions in `packages/backend/services/`

- Frontend

  - Run: cd packages/frontend && npm run dev
  - Use browser DevTools:
    - Console: `console.log` traces in `appStore`, `offline.ts`, and the service worker
    - Application -> IndexedDB: inspect stores and pending actions
    - Service Worker panel: check registration, lifecycle, and messages
  - Reproduce offline:
    - DevTools -> Network -> Offline
    - Trigger a signOut to create a pending action and verify it's in IndexedDB

- Socket.IO diagnostics
  - Watch connection state in [`packages/frontend/src/stores/connectionStore.ts`](packages/frontend/src/stores/connectionStore.ts)
  - Server logs "New client connected" when sockets connect

Testing checklist

- Sign-in flow

  - Sign in a member, ensure `/api/signIn` returns success and server emits `signInUpdate`
  - Verify Signed In record in Airtable

- Sign-out flow

  - Sign out with activity details; verify Use Log created and Signed In record removed; server emits `signOutUpdate`

- Offline flow

  - Go offline and perform sign-out or kudos
  - Confirm a `pendingActions` entry is created in IndexedDB
  - Return online / simulate sync; ensure pending action is processed and removed

- Kudos & messages
  - Create kudos/messages and verify they appear in UI and Airtable

Deployment notes

- Docker Compose:

  - Production build: docker-compose up --build
  - Ensure environment variables are provided securely in production (CI secrets, vault)

- Recommendations:
  - Use separate Airtable bases for staging/production
  - Consider idempotency/dedup keys for server processing of pending actions
  - Monitor Socket.IO throughput and health for multi-kiosk deployments

Contributing & next steps

- Add `CONTRIBUTING.md` if you want a formal contribution process
- Add tests (unit + e2e) for core flows
- Expand API docs in [`docs/API.md`](docs/API.md) with more sample requests/responses
- Complete the Airtable schema doc: [`docs/AIRTABLE_SCHEMA.md`](docs/AIRTABLE_SCHEMA.md)

References

- Project docs: [`docs/README.md`](docs/README.md)
- Airtable schema: [`docs/AIRTABLE_SCHEMA.md`](docs/AIRTABLE_SCHEMA.md)
- Backend entry: [`packages/backend/index.js`](packages/backend/index.js)
- Frontend offline utilities: [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts)
