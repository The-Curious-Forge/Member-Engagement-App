├── docs/
│   ├── README.md
│   ├── AIRTABLE_SCHEMA.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT_GUIDELINES.md
│   └── USER_FLOWS.md
│
├── packages/
│   ├── frontend/
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── tsconfig.json             # (optional, if using TypeScript)
│   │   ├── vite.config.js            # or Vite config for SvelteKit
│   │   ├── Dockerfile                # Docker build for frontend
│   │   └── src/
│   │       ├── app.d.ts             # (if using TypeScript, SvelteKit types)
│   │       ├── lib/
│   │       │   ├── db/
│   │       │   │   └── index.ts      # Dexie / LocalForage setup for IndexedDB
│   │       │   ├── services/
│   │       │   │   ├── socketService.ts  # Manages WebSocket client connection
│   │       │   │   └── apiService.ts     # Wraps fetch calls or REST requests
│   │       │   ├── stores/
│   │       │   │   ├── signedInStore.ts  # Svelte writable store for signed-in members
│   │       │   │   └── kudosStore.ts     # Another store, e.g. for kudos data
│   │       │   └── components/
│   │       │       ├── HomeScreen.svelte
│   │       │       ├── DashboardModal.svelte
│   │       │       ├── SignOutFlow.svelte
│   │       │       └── ActivitySliders.svelte
│   │       ├── routes/
│   │       │   ├── +layout.svelte      # SvelteKit root layout
│   │       │   ├── +page.svelte        # Home screen route
│   │       │   └── sign-in/            # Example sub-route(s), if needed
│   │       └── index.css               # Global CSS or SCSS
│   │
│   └── backend/
│       ├── README.md
│       ├── package.json
│       ├── tsconfig.json            # (optional, if using TypeScript)
│       ├── Dockerfile               # Docker build for backend
│       └── src/
│           ├── server.ts            # Main entry point (Express + Socket.IO)
│           ├── config/
│           │   └── env.ts           # Reads .env variables, sets up config
│           ├── routes/
│           │   ├── signIn.ts
│           │   ├── signOut.ts
│           │   ├── kudos.ts
│           │   └── messages.ts
│           ├── services/
│           │   ├── airtableService.ts  # All Airtable interactions
│           │   └── socketService.ts    # Set up Socket.IO server logic
│           ├── socket/
│           │   └── events.ts           # Defines event handlers for signIn, signOut, etc.
│           └── types/
│               └── index.d.ts          # Shared type definitions
│
├── .env.example           # Example environment variables
├── .gitignore
├── docker-compose.yml     # Defines multi-service (frontend + backend) containers
└── package.json           # (Optional root-level package.json if you manage scripts from root)