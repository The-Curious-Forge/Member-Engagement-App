# The Curious Forge Kiosk Development Guidelines

## Overview

These guidelines ensure consistent coding, maintainability, and smooth collaboration among team members.

## Tech Stack

- **Front-end**: [SvelteKit](https://kit.svelte.dev/) + [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (using Dexie or LocalForage).
- **Back-end**: Node.js (Express or Fastify) + Socket.IO for real-time updates.
- **Database**: Airtable for the source of truth; local IndexedDB for offline caching.

## Project Structure

A recommended monorepo layout:

/kiosk-app /packages /frontend (SvelteKit code) /backend (Node + Express + Socket.IO) /docs (Markdown documentation) docker-compose.yml ...

## Branching Strategy

- **`main`** branch is always stable.
- **Feature branches** (e.g., `feature/sign-out-flow`) are merged via pull requests to `main` after code review.
- **Hotfix branches** (e.g., `hotfix/kudos-bug`) for urgent fixes.

## Coding Conventions

1. **SvelteKit**  
   - Use a consistent naming scheme for components (`MemberDashboard.svelte`, `SignOutModal.svelte`, etc.).  
   - Keep component files relatively small.  
   - Use [Svelte stores](https://svelte.dev/docs#run-time-svelte-store) for shared global state (e.g., `$signedInMembers`).  
2. **Node.js**  
   - Organize routes in Express/Socket.IO with separate files for each major feature: `kudos.js`, `signIn.js`, etc.  
   - Use environment variables for sensitive keys (`AIRTABLE_API_KEY`, etc.).  
   - Return consistent JSON responses with proper status codes.
3. **Offline-First Approach**  
   - Use an `outbox` store in IndexedDB for pending writes when offline.  
   - Attempt to sync automatically on reconnect or app load.  
4. **Error Handling**  
   - Front-end: display user-friendly messages for errors (e.g., “We’re offline, but your action is queued”).  
   - Back-end: log errors to console or a monitoring tool, return structured error payloads to the client.

## Testing

- **Unit tests**:  
  - For Svelte components, consider testing with [Vitest](https://vitest.dev/).  
  - For Node routes, use Jest or Mocha + Chai.  
- **Integration tests**:  
  - Spin up Docker containers for front-end and back-end, mock Airtable or use a test base.
- **User acceptance tests**:  
  - Use a staging kiosk or environment to ensure sign-in/out flows, kudos, and offline usage work as expected.

## Deployment / DevOps

- **Docker**:  
  - Each package has a Dockerfile.  
  - `docker-compose up` for local dev with two services: `frontend`, `backend`.  
- **DigitalOcean** (or other):  
  - Deploy via Docker images or a managed platform.  
  - Use environment variables for all secrets.  

## Contributing

1. Fork or create a branch from `main`.
2. Make changes, ensure tests pass.
3. Open a Pull Request for code review.
4. Once approved, merge back into `main`.

## License / Ownership

The code is proprietary to The Curious Forge. Contact project maintainers for detail