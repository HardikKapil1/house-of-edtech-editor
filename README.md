# House of EdTech Editor

## Overview

House of EdTech Editor is a local-first collaborative document editor built with Next.js, TypeScript, Prisma, PostgreSQL, Tiptap, and Yjs. It supports real-time multi-user document editing, offline title updates, document sharing with role-based permissions, snapshots, audit history, and server-side conflict protection.

The design separates the concerns that need real-time merging from those that need durable application data. Document bodies are collaboratively edited through Yjs, while document metadata, access control, snapshots, and audit records are persisted through Next.js API routes and PostgreSQL.

## Architecture

```text
                         ┌────────────────────────────┐
                         │      Next.js client         │
                         │ Tiptap + Yjs + Dexie        │
                         └─────────────┬──────────────┘
                                       │
            real-time document updates │ WebSocket
                                       ▼
                         ┌────────────────────────────┐
                         │ y-websocket server          │
                         │ Railway in production       │
                         └────────────────────────────┘

                         ┌────────────────────────────┐
                         │      Next.js client         │
                         └─────────────┬──────────────┘
                                       │ HTTP
                                       ▼
                         ┌────────────────────────────┐
                         │ Next.js App Router API      │
                         │ Auth, validation, versions  │
                         └─────────────┬──────────────┘
                                       │ Prisma
                                       ▼
                         ┌────────────────────────────┐
                         │ PostgreSQL                  │
                         │ Documents, users, snapshots │
                         │ memberships, audit logs     │
                         └────────────────────────────┘
```

- **Client:** Tiptap provides the editor UI; Yjs represents and merges collaborative body state; Dexie stores pending offline changes in IndexedDB.
- **Real-time collaboration:** the browser connects to a separate `y-websocket` server. Local development uses the included WebSocket command; production points `NEXT_PUBLIC_WS_URL` at the Railway deployment.
- **Application persistence:** the client calls Next.js route handlers for document metadata, permissions, snapshots, and audit history. Prisma persists this durable state in PostgreSQL.
- **Authentication:** NextAuth credentials authentication establishes the application user identity used by server-side permission checks.

## Local-first and offline sync

The client treats an unavailable network as a temporary state rather than a reason to discard user work.

1. When a title change occurs while the browser is offline, the client writes the latest change to Dexie's `pendingChanges` table instead of attempting a network request.
2. The document ID is the queued row's key, so repeated offline edits replace the older queued value: only the newest local state is retried.
3. The editor listens for the browser's `online` event. On reconnection, it flushes the queued change to `PUT /api/documents/[id]`.
4. A queue entry is deleted only after a successful server response. Network errors and conflicts remain visible for a later retry or user action.

This provides a practical local-first flow for document metadata while Yjs continues to manage collaborative body updates.

## Conflict resolution

### Document body: Yjs CRDT

Document body content is handled by Yjs through the WebSocket collaboration channel. Yjs is a CRDT, so concurrent text edits are merged automatically at character and structure level instead of asking one writer to overwrite another. This is the appropriate model for the document body because multiple people can edit the same text at the same time.

### Document title: timestamp and version-based Last-Write-Wins

Titles are not collaboratively edited character-by-character. A title is short metadata with a single input field, so the application uses a simpler durable-write policy:

1. The client sends `clientUpdatedAt` with each title update.
2. The API reads the document's current `updatedAt` and `version`.
3. If the client timestamp is older than the server timestamp, the API returns **HTTP 409 Conflict** with the server's current title and content rather than overwriting newer data.
4. For an eligible update, the API increments `version` and performs the write using the previously read version as a guard. If another update wins in between, this request also becomes a 409 response.

This is deterministic Last-Write-Wins for metadata, not a CRDT. It prevents silent data loss while keeping title updates simple, and the client prompts the user to reload when the server has newer changes.

## Security and data isolation

- **Request validation:** mutation payloads are validated with Zod before authentication or database operations proceed.
- **Payload cap:** document update content is serialized and limited to fewer than 500,000 characters (about 500KB). Rejecting oversized content before it reaches Prisma and persistence prevents maliciously large update payloads from driving expensive processing and memory exhaustion.
- **Server-side authorization:** `Owner`, `Editor`, and `Viewer` roles are represented by `DocumentMember`. Route handlers check permissions on the server; client-side UI state is not treated as authorization.
- **Tenant isolation:** document access is scoped through membership lookups using both document ID and current user ID. Prisma queries and mutations operate only after the appropriate membership and capability (`canView`, `canEdit`, or `canDelete`) are confirmed.
- **Auditability:** document updates, snapshots, restores, sharing, and deletes create audit-log records for traceability.

## Version history

The `Snapshot` model stores immutable title/content checkpoints per document, with a unique version number for each document. Users can create snapshots, inspect history, and restore a selected snapshot through permission-checked API routes.

A restore is a durable PostgreSQL operation: it creates the next snapshot version and writes the selected title/content back to the document inside the server-side restore flow. It does not attempt to manually merge a historical snapshot into an in-flight Yjs transaction. Clients can reload or resynchronize the persisted state, after which live editing continues through Yjs; this keeps historical restoration separate from the CRDT's live collaborative state and avoids corrupting the collaboration model.

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL
- npm

### Environment variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection used by Prisma
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/house_of_edtech"

# NextAuth signing secret
AUTH_SECRET="replace-with-a-long-random-secret"

# y-websocket endpoint. Defaults to ws://localhost:1234 if omitted.
NEXT_PUBLIC_WS_URL="ws://localhost:1234"

# Optional: required only for the Gemini-powered AI feature
GEMINI_API_KEY="your-gemini-api-key"
```

### Install and migrate

```bash
npm install
npx prisma migrate dev
npx prisma generate
```

### Run the WebSocket server separately

Start the Yjs WebSocket server in one terminal:

```bash
npm run start-ws
```

For production, deploy the WebSocket service separately (for example, on Railway) and set `NEXT_PUBLIC_WS_URL` to its secure WebSocket URL, such as `wss://your-service.up.railway.app`.

### Run Next.js

In another terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What I would do with more time

- Use CRDT-based title collaboration as well, so title edits can merge character-by-character instead of using Last-Write-Wins metadata updates.
- Add automated end-to-end coverage with Playwright for offline edits, reconnect flushing, HTTP 409 conflicts, snapshot restore, and multi-user collaboration.
- Expand presence and awareness indicators so collaborators can clearly see who is online, editing, and where their cursor is located.
- Add rate limiting and request throttling to synchronization and mutation endpoints to further protect shared documents from abuse.