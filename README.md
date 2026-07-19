# House of EdTech Editor

> A production-grade collaborative document editor featuring real-time CRDT-based editing, offline-first synchronization, role-based access control, audit logging, and AI-powered writing assistance.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/) [![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://prisma.io/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org/) [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/) [![Auth.js](https://img.shields.io/badge/Auth.js-5-black)](https://authjs.dev/) [![Yjs](https://img.shields.io/badge/Yjs-CRDT-6E57FF)](https://yjs.dev/) [![Gemini AI](https://img.shields.io/badge/Gemini_AI-Google-4285F4?logo=google)](https://ai.google.dev/)

A portfolio-grade Next.js App Router project for multi-user rich-text editing, offline-safe metadata changes, sharing, snapshots, audit history, and Gemini-powered writing assistance.

## Highlights

- 🚀 Real-time collaborative editing using CRDTs (Yjs)
- 🌐 WebSocket synchronization
- 📡 Offline-first editing with IndexedDB
- 🔐 Role-based permissions (Owner / Editor / Viewer)
- 🤖 Gemini-powered writing assistant
- 📜 Document snapshots & audit history

## Live Demo

🌐 Live: https://house-of-edtech-editor-sand.vercel.app

📦 GitHub: https://github.com/HardikKapil1/house-of-edtech-editor

## Screenshots

| Dashboard | Collaborative Editor |
|----------|----------------------|
| ![Dashboard](image.png) | ![Editor](image-1.png) |

| Share Dialog | Version History | AI Toolbar |
|--------------|------------------|------------|
| ![Share](image-2.png) | ![History](image-3.png) | ![AI Toolbar](image-4.png) |

## Features

### Collaboration
- ✓ Tiptap rich-text editing
- ✓ Yjs CRDT merging over a dedicated `y-websocket` server
- ✓ Automatic conflict-free merges for concurrent document-body edits

### Offline
- ✓ Dexie / IndexedDB offline queue for durable document metadata
- ✓ Automatic retry sync on reconnect
- ✓ Version-guarded conflict protection for durable updates

### Security
- ✓ Auth.js credentials authentication with bcrypt password hashing
- ✓ Server-enforced Owner, Editor, and Viewer roles
- ✓ Tenant-isolated membership checks on every request

### Collaboration Tools
- ✓ Sharing, snapshots, restore workflow, and activity history

### AI
- ✓ Gemini actions: rewrite, summarize, continue, and fix grammar

## Architecture

```mermaid
flowchart TB
    C[Next.js Client<br/>Tiptap - Yjs - Dexie]
    W[y-websocket service<br/>CRDT synchronization]
    A[Next.js API<br/>auth - validation - permissions]
    P[(PostgreSQL / Prisma)]
    G[Gemini API]

    C <-->|WebSocket| W
    C <-->|HTTPS| A
    A --> P
    A --> G
```

The design separates the concerns that need real-time merging from durable application data. Tiptap renders the editor and Yjs represents and merges body state over the standalone WebSocket service. Next.js Route Handlers persist metadata, memberships, snapshots, and audit records to PostgreSQL through Prisma. Auth.js provides the identity used by every server-side permission check.

```mermaid
sequenceDiagram
  participant A as Collaborator A
  participant B as Collaborator B
  participant W as y-websocket
  participant API as Next.js API
  participant DB as PostgreSQL
  A->>W: Yjs update
  W-->>B: Merged CRDT state
  A->>API: Metadata or snapshot request
  API->>DB: Validate, authorize, persist
  DB-->>API: Result
```

## Technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Framework | Next.js 16, React 19 | App Router and Route Handlers |
| Language | TypeScript 5 | Type-safe application code |
| Editor | Tiptap | Rich-text editing |
| Collaboration | Yjs, `y-websocket` | CRDT merging and WebSocket sync |
| Offline | Dexie / IndexedDB | Unsynced metadata queue |
| Data | PostgreSQL, Prisma | Documents, users, memberships, snapshots, logs |
| Auth | Auth.js (NextAuth v5), bcryptjs | Credentials and password hashing |
| Validation | Zod | Mutation validation |
| UI | Tailwind CSS 4, shadcn/ui, Lucide | Interface |
| AI | Google Gemini / `@google/genai` | Writing assistance |

## Local-first architecture and offline synchronization

The client treats a lost connection as temporary, rather than discarding user work. This local-first flow applies to durable document metadata; Yjs continues to manage collaborative body updates.

1. When a title/content update cannot be sent, the latest state is written to Dexie's IndexedDB-backed `pendingChanges` table.
2. The document ID is the queue key, so repeated offline edits replace the older queued change.
3. On the browser `online` event, the client retries `PUT /api/documents/:id`.
4. A queue entry is deleted only after a successful response. Network errors and `409 Conflict` responses remain for retry or user action.

## Conflict resolution

### Document body: Yjs CRDT

Document body content is synchronized through Yjs over WebSocket. As a CRDT, Yjs automatically merges concurrent text and structure edits at character and document-structure level instead of allowing one writer to overwrite another.

### Durable metadata: Version-guarded optimistic concurrency

Titles and persisted metadata use optimistic concurrency rather than CRDT merging.

1. The API reads the document's current `version`.
2. Updates execute using `WHERE id = ? AND version = ?`.
3. Successful writes atomically increment the version.
4. If another request updates the document first, the update affects zero rows and the API returns **HTTP 409 Conflict** with the latest server state.

This prevents lost updates without relying on client timestamps or clock synchronization.

## Security and data isolation

- **Validated mutations:** Zod validates registration and document-update payloads before persistence.
- **Payload cap:** serialized content must be below 500,000 characters (about 500 KB), reducing processing and storage pressure from oversized requests.
- **Server authorization:** `OWNER`, `EDITOR`, and `VIEWER` are stored in `DocumentMember`; routes enforce view, edit, delete, and share permissions.
- **Tenant isolation:** membership is resolved using document ID and authenticated user ID before document data is read or changed.
- **Credential safety:** bcrypt hashes passwords; Auth.js signs JWT sessions with `AUTH_SECRET`.
- **Auditability:** creation, updates, sharing, snapshot creation, and deletion create actor-linked audit records.

## Version history

`Snapshot` stores immutable title/content checkpoints with a version unique to each document. Editors create snapshots; viewers can inspect the history.

Restore is a durable PostgreSQL transaction: the server first saves the current document as the next snapshot version, then writes the selected title and content. It does not manually merge history into an in-flight Yjs transaction. Clients can reload or resynchronize the persisted state and then continue live editing through Yjs, keeping historical recovery separate from the CRDT model.

## API overview

All document routes require authentication and enforce membership server-side.

| Endpoint | Methods | Description |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | Auth.js handlers | Credentials session handling |
| `/api/register` | `POST` | Register a bcrypt-hashed user |
| `/api/documents` | `POST` | Create document and owner membership |
| `/api/documents/:id` | `GET`, `PUT`, `DELETE` | Fetch, guarded update, or delete |
| `/api/documents/:id/share` | `POST` | Owner shares with Editor or Viewer |
| `/api/documents/:id/snapshots` | `GET`, `POST` | List or create snapshots |
| `/api/documents/:id/snapshots/:snapshotId` | `GET` | Retrieve a snapshot |
| `/api/documents/:id/snapshots/:snapshotId/restore` | `POST` | Back up current state and restore |
| `/api/documents/:id/activity` | `GET` | Get document activity |
| `/api/ai` | `POST` | Run rewrite, summarize, continue, or fix-grammar |

## Folder structure

```text
.
|-- prisma/                 # Schema and migrations
|-- src/
|   |-- app/                # Pages and API routes
|   |-- components/         # Editor, document, layout, and UI components
|   |-- features/           # Feature-level UI
|   |-- lib/                # Auth, Prisma, validation, Yjs, AI, offline helpers
|   `-- generated/prisma/   # Generated client (not committed)
|-- ws-server/server.js     # Deployable WebSocket service
|-- public/                 # Static assets
`-- package.json
```

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL
- npm

### Environment variables

Create `.env` in the repository root:

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection used by Prisma | `postgresql://USER:PASSWORD@localhost:5432/house_of_edtech` |
| `AUTH_SECRET` | Yes | Long random secret for Auth.js JWT sessions | `replace-with-a-long-random-secret` |
| `AUTH_URL` | Recommended | Canonical Auth.js application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | No | Yjs WebSocket URL; defaults to `ws://localhost:1234` | `ws://localhost:1234` |
| `GEMINI_API_KEY` | For AI | API key for Gemini editor actions | `your-gemini-api-key` |

```bash
npm install
npx prisma migrate dev
npx prisma generate
```

Run these in separate terminals:

```bash
npm run start-ws
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy the Next.js application to a Node-compatible host such as Vercel, with managed PostgreSQL available through `DATABASE_URL`. Apply Prisma migrations during deployment and configure `AUTH_SECRET`, `AUTH_URL`, and, when AI is enabled, `GEMINI_API_KEY`.

Deploy the WebSocket service separately because it needs long-lived connections outside the Next.js app process. `ws-server/` binds to `PORT` (default `1234`) and exposes a basic HTTP health response. Deploy it to a WebSocket-capable host such as Railway, install its dependencies, and set `NEXT_PUBLIC_WS_URL` to a secure endpoint such as `wss://your-service.up.railway.app`.

Before release:

```bash
npm run lint
npm run build
```

## Future improvements

- Use CRDT-backed title collaboration for character-level title merges.
- Add Playwright coverage for offline retries, `409` conflicts, and multi-user sessions.
- Add rate limiting and production observability for the WebSocket service.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Author

Created by **Hardik Kapil**.

- GitHub: [HardikKapil1](https://github.com/HardikKapil1)
- LinkedIn: [Hardik Kapil](https://www.linkedin.com/in/hardik-kapil/)