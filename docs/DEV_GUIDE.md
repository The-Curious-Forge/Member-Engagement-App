# Developer Guide

This document helps new contributors understand the codebase, local development workflow, debugging tips, and deployment steps for the Member Engagement App (The Curious Forge).

Summary

- Frontend: SvelteKit application with an offline-first architecture, IndexedDB caching and a service worker.
- Backend: Node.js + Express server that proxies and consolidates Airtable access and emits realtime events via Socket.IO.
- Airtable: Source of truth for members, sign-ins, kudos, messages, activities, and related tables.

Key repo references

- Top-level docs: [`docs/README.md`](docs/README.md:1)
- Backend entry: [`packages/backend/index.js`](packages/backend/index.js:1)
- Backend services: [`packages/backend/services/`](packages/backend/services/:1)
- Frontend stores & sync: [`packages/frontend/src/stores/appStore.ts`](packages/frontend/src/stores/appStore.ts:1)
- Frontend offline layer: [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts:1)
- Service worker: [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js:1)
- Airtable schema: [`docs/AIRTABLE_SCHEMA.md`](docs/AIRTABLE_SCHEMA.md:1)

Prerequisites (local)

- Node.js (recommended LTS)
- npm (or yarn/pnpm)
- Docker & Docker Compose (recommended for development)
- An Airtable base and API key for integration testing (use a test base if possible)

Environment variables
Create a `.env` in the project root (see `.env.example`). Important variables:

- AIRTABLE_API_KEY — Airtable API key used by backend
- AIRTABLE_BASE_ID — Airtable base id
- GOOGLE_API_KEY — for calendar features (optional)
- GOOGLE_CALENDAR_ID — for calendar features (optional)

Project layout (high level)

- packages/backend — Express server, routes, and Airtable service layer
  - [`packages/backend/index.js`](packages/backend/index.js:1) — server bootstrap and route wiring
  - [`packages/backend/routes/`] — Express route handlers (e.g., signIn, signOut, members)
  - [`packages/backend/services/`] — Airtable logic (membersService, kudosService, messagesService, etc.)
  - [`packages/backend/services/airtableClient.js`](packages/backend/services/airtableClient.js:1) — Airtable base and table constants
- packages/frontend — SvelteKit app and client-side logic
  - [`packages/frontend/src/stores/appStore.ts`](packages/frontend/src/stores/appStore.ts:1) — central stores and sync functions
  - [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts:1) — IndexedDB helpers and pending-actions queue
  - [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js:1) — service worker implementing caching and background sync
  - [`packages/frontend/src/services/memberAuthService.ts`](packages/frontend/src/services/memberAuthService.ts:1) — sign-in/out API calls and socket handlers
  - UI components under [`packages/frontend/src/components/`]

Running locally (recommended: Docker Compose)

1. Copy environment file:
   - cp .env.example .env
   - Edit `.env` and set Airtable / Google keys (or use test keys)
2. Start development containers:
   - docker-compose -f docker-compose.dev.yml up
   - This mounts source into containers for live reloading.

Run without Docker

- Backend:
  - cd packages/backend
  - npm install
  - npm run dev
  - Server listens on port 3000 by default (see configuration)
- Frontend:
  - cd packages/frontend
  - npm install
  - npm run dev
  - Development server runs on port 5174 by default

Backend details

- The backend centralizes calls to Airtable and protects API keys.
- Route examples:
  - POST /api/signIn — creates a Signed In record in Airtable (see [`packages/backend/routes/signIn.js`](packages/backend/routes/signIn.js:1))
  - POST /api/signOut — creates a Use Log record, removes Signed In record, and may accept activities payload
  - GET /api/members/allData — returns joined member data, kudos, messages, and active sign-ins (see [`packages/backend/services/membersService.js`](packages/backend/services/membersService.js:1))
- Airtable helpers and table names are defined in [`packages/backend/services/airtableClient.js`](packages/backend/services/airtableClient.js:1).
- Realtime: Socket.IO is initialized in the server entry and passed to routes via middleware so routes can emit events (e.g., signInUpdate, signOutUpdate).

Frontend details

- Central store: [`packages/frontend/src/stores/appStore.ts`](packages/frontend/src/stores/appStore.ts:1)
  - Responsible for fetching data from the backend, caching into IndexedDB, and exposing actions (memberActions, kudosActions, messageActions).
  - Each fetch function implements cache-first or network-first logic with staleness checks using metadata in IndexedDB.
- Offline layer: [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts:1)
  - Manages IndexedDB stores (members, kudos, messages, pendingActions, etc.)
  - Exposes pendingActions.add/getAll/remove and offlineStorage.store/getAll/get
  - Registers service worker and attempts background sync using SyncManager when adding pending actions.
- Service Worker: [`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js:1)
  - Caches static assets and API responses using a network-first strategy for APIs.
  - Implements background sync handler `sync` event and a fallback message-based synchronization.
  - When pending actions are synced successfully, it removes them from IndexedDB.
- Socket handling: [`packages/frontend/src/services/memberAuthService.ts`](packages/frontend/src/services/memberAuthService.ts:1) subscribes to the socket and updates stores on signInUpdate and signOutUpdate events.

Offline-first architecture (how it works)

- When data is fetched, the frontend:
  - Checks IndexedDB metadata for staleness (5 minute TTL by default).
  - If cache is fresh and offline, it returns cached data.
  - If online, it fetches from the server, stores the result in IndexedDB and updates metadata.
- User actions while offline:
  - Actions like signOut, message send, or kudos are queued as "pendingActions" in IndexedDB via [`packages/frontend/src/lib/offline.ts`](packages/frontend/src/lib/offline.ts:1).
  - The service worker will attempt to sync queued actions when connectivity is restored (via background sync or when the client posts a message).
  - UI is updated optimistically and rolled back if the sync ultimately fails.
- Important stores: members, kudos, messages, pendingActions, systemAlerts, airtableAlerts.

Airtable integration & safety

- Airtable is the source of truth — schema is in [`docs/AIRTABLE_SCHEMA.md`](docs/AIRTABLE_SCHEMA.md:1).
- Best practices:
  - Use a non-production/test base for development and experimentation.
  - Do not commit live API keys. Keep them in `.env` or secret manager.
  - Understand that destructive operations (deletes) on Airtable will reflect in the live base.

Debugging tips

- Backend:
  - Run local server (`npm run dev`) and use nodemon for autoreload.
  - Add console logs in route handlers and service functions; errors are returned as JSON via global error middleware.
- Frontend:
  - Open the browser DevTools to inspect console logs from `appStore`, `offline.ts`, and the service worker.
  - Check the Service Worker panel for registration status and background sync attempts.
  - Inspect IndexedDB (Application -> IndexedDB) for stored data and pendingActions.
  - Socket.IO diagnostics: watch connection state via [`packages/frontend/src/stores/connectionStore.ts`](packages/frontend/src/stores/connectionStore.ts:1).
- Reproducing offline behavior:
  - In DevTools: Network -> Offline mode or toggle "Offline" in connection settings.
  - Create a signOut action while offline and inspect pendingActions store.

Testing

- There are no automated unit/integration tests currently included.
- Manual testing checklist:
  - Sign-in flow: sign in a member, confirm `Signed In` row is created in Airtable and socket events are emitted.
  - Sign-out flow: sign out with activities, confirm `Use Log` creation and `Signed In` record removal.
  - Offline flow: perform sign-out while offline, confirm a pending action is created and eventually synced.
  - Kudos and messages: create entries and confirm they appear in Airtable and in UI feeds.
- If adding tests, prefer small units for services and a few end-to-end tests for the main happy paths.

Code style & conventions

- Backend: CommonJS modules are used (require/module.exports). Keep consistent style when editing backend files.
- Frontend: TypeScript with SvelteKit; use strict typing where appropriate.
- Keep console.log statements helpful; many logs are intentionally present to aid debugging in kiosk deployments.

Deployment

- Docker Compose (production):
  - docker-compose up --build
- Recommended production considerations:
  - Serve frontend as static files or behind a CDN.
  - Secure environment variables via a vault or CI secrets.
  - Use separate Airtable bases for staging and production.
  - Health checks and monitoring for Socket.IO and background sync.

Where to go from here

- For architecture and user flows: see [`docs/README.md`](docs/README.md:1)
- For Airtable schema: see [`docs/AIRTABLE_SCHEMA.md`](docs/AIRTABLE_SCHEMA.md:1)
- For API reference (planned): see [`docs/API.md`](docs/API.md:1) — will contain routes and payload examples.
