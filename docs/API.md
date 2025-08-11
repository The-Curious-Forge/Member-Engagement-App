# API Reference

This file documents the main HTTP endpoints and Socket.IO events exposed by the backend, plus example request/response payloads to help developers integrate with the server.

Backend entry: [`packages/backend/index.js`](packages/backend/index.js) — all routes are mounted under `/api`.

Important files

- Routes: [`packages/backend/routes/`](packages/backend/routes/)
- Members service: [`packages/backend/services/membersService.js`](packages/backend/services/membersService.js)
- Kudos service: [`packages/backend/services/kudosService.js`](packages/backend/services/kudosService.js)
- Messages service: [`packages/backend/services/messagesService.js`](packages/backend/services/messagesService.js)
- Airtable table constants: [`packages/backend/services/airtableClient.js`](packages/backend/services/airtableClient.js)

Base URL

- Local development (docker/dev): http://localhost:3000/api

Common response envelope

- Many endpoints return JSON objects. Successful operations commonly return:
  - { success: true, ... }
  - Or the requested resource directly (arrays/objects) depending on the route.

## HTTP Endpoints (examples)

1. POST /api/signIn

- Purpose: Create a "Signed In" record for a member. Backend emits a real-time `signInUpdate` event with the updated member payload.
- Request body:
  - { memberId: string, memberTypeId: string }
- Example:
  - POST /api/signIn
  - Body:

```json
{
  "memberId": "rec123...",
  "memberTypeId": "rectype456..."
}
```

- Response:
  - { success: true, signInRecordId: "<airtable-record-id>" }
- Notes:
  - After the record is created the server fetches signed-in members and emits `signInUpdate` with the member object.

2. POST /api/signOut

- Purpose: Remove a Signed In record and create a Use Log entry in Airtable. Accepts activity details for calculating totals.
- Request body (from client patterns):

```json
{
  "signInRecordId": "string",
  "memberId": "string",
  "activities": [{ "id": "string", "hours": 2, "time": 120000, "points": 0 }],
  "totalHours": 2,
  "totalPoints": 0,
  "timestamp": "2025-08-11T15:00:00.000Z"
}
```

- Response:
  - { success: true, useLogRecordId: "<airtable-record-id>" } (implementation-specific; backend returns created use-log id)
- Notes:
  - Client may call signOut while offline — the frontend queues the action and the service worker syncs it later.
  - Server will typically emit a `signOutUpdate` Socket.IO event with { signInRecordId, memberId } to notify clients.

3. GET /api/members/allData

- Purpose: Return consolidated member data with messages, kudos, activity counts, signed-in status, and member types.
- Response: Array of Member objects.

Example response:

```json
[
  {
    "id": "rec123...",
    "name": "First Last",
    "memberTypes": [],
    "totalHours": 120,
    "totalPoints": 50,
    "weeklyStreak": 3,
    "forgeLevel": "Apprentice",
    "memberBio": "Short bio",
    "headshot": "https://.../image.jpg",
    "topActivities": ["Woodworking", "3D Printing"],
    "messages": [],
    "kudosGiven": [],
    "kudosReceived": [],
    "isSignedIn": false
  }
]
```

- Notes:
  - Implemented by `membersService.getAllMemberData()` which aggregates messages, kudos, signed-in members and types.

4. GET /api/members/signedInMembers

- Purpose: List currently signed-in members (no SignOutTime).
- Response:
  - { signedInMembers: [ { id, name, signInRecordId, signInTime, signedInType, currentMemberType, currentArea } ] }

5. GET /api/members/monthlyRecognition/:month

- Purpose: Return monthly recognition record for a YYYY-MM month.
- Example:
  - GET /api/members/monthlyRecognition/2025-08
- Response:
  - Array of recognition objects (may be empty). Each contains memberOfTheMonth info and project details.

6. /api/kudos

- GET /api/kudos
  - Purpose: Retrieve list of kudos entries (most recent first).
  - Response:
    { kudos: [ { id, from: [{id,name}], to: [{id,name}], message, date }, ... ] }
- POST /api/kudos
  - Purpose: Create kudos (from, to, message)
  - Request body:
    { from?: string, to: string[], message: string }
    - `from` may be omitted for anonymous kudos
  - Response:
    { id: string, from: [...], to: [...], message: string, date: string }

7. /api/messages

- GET /api/messages
  - Purpose: Return app messages (Airtable consolidated).
  - Response:
    { messages: [ { id, content, messageDate, readDate, important, appNotification, member, read, attachment, qrLink }, ... ] }
- POST /api/messages
  - Purpose: Create a message (sent to staff or directed at member)
  - Request body:
    { message: string, memberId?: string, isImportant?: boolean }
  - Response: { id: "<airtable-id>" }

8. GET /api/activities

- Purpose: Return the activities or activity list used for sign-out sliders.
- Response: { activities: [ { id, activity }, ... ] }

9. GET /api/alerts

- Purpose: Return a combined list of alerts (system + Airtable notifications)
- Response:
  - { alerts: [ { id, type, content, messageDate, expirationDate, source: 'airtable'|'system', attachment?, qrLink? }, ... ] }

10. GET /api/calendar/events

- Purpose: Return calendar events fetched from Google Calendar (backend may proxy googleapis)
- Response:
  - { events: [ { id, summary, description, start, end }, ... ] }

11. GET /api/mentors

- Purpose: Return mentors list (used in the frontend mentors module)
- Response: Array of mentor objects (fields based on `mentorsStore` typing)

Notes about endpoints

- Many GET endpoints return cached/aggregated Airtable data prepared by backend services for efficiency.
- Backend protects Airtable API keys — client should never call Airtable directly.
- Error handling: server has global error middleware that returns 500 JSON with either a friendly message (production) or error.message (non-production). See [`packages/backend/index.js`](packages/backend/index.js).

## Socket.IO events (real-time)

- Server initializes Socket.IO in [`packages/backend/index.js`](packages/backend/index.js) and passes the `io` object to routes via middleware so route handlers can emit events to connected clients.

Notable events used by frontend:

1. signInUpdate

- Emitted after a successful sign-in record creation.
- Payload: the updated member object (see `getSignedInMembers()` / member mapping).

Example payload:

```json
{
  "id": "rec123...",
  "name": "First Last",
  "signInRecordId": "recSignedIn...",
  "signInTime": "2025-08-11T15:00:00.000Z",
  "signedInType": "recTypeId...",
  "currentMemberType": {
    "id": "type1",
    "group": "Woodshop",
    "sortingOrder": 1
  },
  "currentArea": null
}
```

2. signOutUpdate

- Emitted after a sign-out (or sign-out-all) occurs.
- Payload example: { signInRecordId: "recSignedIn...", memberId: "rec123..." }
- Frontend uses this to mark members inactive and update UI.

Other events

- The backend may emit additional events for kudos, messages, or system alerts when routes create new resources; consult route implementations for further events. The frontend subscribes to specific events in [`packages/frontend/src/services/memberAuthService.ts`](packages/frontend/src/services/memberAuthService.ts).

Client behavior & offline queue

- When offline, the frontend stores pending actions in IndexedDB under `pendingActions`.
- The service worker (`packages/frontend/static/service-worker.js`](packages/frontend/static/service-worker.js)) will attempt background sync using the SyncManager tag `sync-pending-actions` or process actions upon being messaged by the client.
- Pending action processing maps action types to endpoints:
  - signIn -> POST /api/signIn
  - signOut -> POST /api/signOut
  - kudos -> POST /api/kudos
  - message -> POST /api/messages

Idempotency and deduplication

- Because actions may be retried by the service worker, prefer making server-side actions idempotent where possible (for example, deduplicate on a client-generated id or check for existing identical records).
- Current implementation uses generated IDs in the client for optimistic UI and pending action tracking; the server creates actual Airtable records and returns the Airtable id.

How to inspect runtime data

- Check backend logs (console) or container logs to see emitted events and route behavior.
- Frontend logs: `appStore`, `offline.ts`, and service-worker include helpful console logging.
- Inspect IndexedDB in browser DevTools (Application -> IndexedDB) to view `pendingActions` and cached stores.
