# The Curious Forge Kiosk Application

This repository contains the source code for **The Curious Forge** Kiosk Application, designed to increase member engagement at the makerspace. It is built with:

- **SvelteKit** as the front-end framework (with IndexedDB for offline caching)
- **Node.js** as the back-end (with WebSockets for real-time updates)
- **Airtable** as the primary data store and source of truth.

The app is designed to run on a 24" touchscreen kiosk, allowing members to sign in/out, send kudos, view messages, and more.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features and User Flows](#features-and-user-flows)
4. [Airtable Schema](#airtable-schema)
5. [Development Guidelines](#development-guidelines)
6. [Deployment](#deployment)
7. [License](#license)

## Overview

This kiosk application has the following core goals:

- **Improve member engagement** by providing a quick, easy way to sign in/out, share kudos, read notifications, and track stats.
- **Perform well offline** by caching data in IndexedDB and syncing with Airtable whenever online.
- **Ensure real-time updates** across multiple kiosks or staff computers using WebSockets.

## Architecture

- **Front-end (SvelteKit)**:
  - Uses component-based architecture.
  - Stores data in IndexedDB for offline access.
  - Provides a user-friendly interface with searching, modals, and dynamic dashboards.
  - Utilizes a centralized airtableStore for managing all data, including notifications.
- **Back-end (Node.js + Express)**:
  - Acts as a single conduit to Airtable (hides Airtable API keys).
  - Provides REST endpoints for CRUD operations (sign-in, kudos, messaging, etc.).
  - Implements WebSockets (e.g., with Socket.IO) for instant data updates between kiosks.
- **Airtable**:
  - Serves as the source of truth.
  - Contains tables for Members, Signed In, Kudos, Activities, Use Logs, Mentorship, and more.

## Features and User Flows

- **Sign In**:
  - Search name → select role → record sign-in → update the UI in real-time.
- **Sign Out**:
  - Display time spent + activity sliders → update Use Log + Activity Log + remove from Signed In table.
- **Give Kudos**:
  - Send kudos from any user (signed in or not) to one or multiple members → updates Kudos feed.
- **Send Messages**:
  - Any user can send a message to the office → stored in "Received Sign In App Messages".
- **Notifications / Alerts**:
  - Handled through the centralized airtableStore.
  - App-wide notifications are filtered from all messages based on the `appNotification` flag.
  - Real-time updates are managed through WebSocket connections.

See [USER_FLOWS.md](./USER_FLOWS.md) for a more detailed breakdown.

## Airtable Schema

A detailed schema is in [AIRTABLE_SCHEMA.md](./AIRTABLE_SCHEMA.md). All tables and fields are subject to change as needed.

## Development Guidelines

For code structure, best practices, and branching strategy, see [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md).

## Deployment

We use Docker Compose or separate containers for:

- **frontend** (SvelteKit, served as static files or via Node),
- **backend** (Node.js + Socket.IO + Airtable calls).

For instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

TBD or private.
