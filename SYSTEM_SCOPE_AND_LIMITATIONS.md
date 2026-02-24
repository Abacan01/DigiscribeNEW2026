# DigiScribe System Scope and Limitations

Last verified: 2026-02-24
Repository: Digiscribe-LATEST (main)

## 1) Executive Summary

This system is a React + Vite frontend with an Express backend that provides:
- Authenticated upload workflows (chunked file upload and URL ingestion)
- File/folder management with role-based access
- Transcription delivery workflows (text and file-based)
- Admin user/role management
- Quote/contact intake
- FTP-backed binary storage with Firestore metadata indexing

Core architecture evidence:
- Frontend route map: [src/App.jsx](src/App.jsx#L133-L164)
- Backend app + endpoints: [server/server.js](server/server.js#L1-L867)
- FTP storage service: [server/services/ftp.js](server/services/ftp.js#L1-L256)
- Firebase Admin initialization: [server/firebaseAdmin.js](server/firebaseAdmin.js#L1-L37)
- Vercel serverless adapter: [api/index.js](api/index.js#L1-L3)

---

## 2) Implemented Scope (What the System Actually Does)

### 2.1 Frontend Application Scope

#### Routes and access control
- Public routes: home, about, projects, services, quote, login, service category/subpage
- Authenticated user routes: upload, dashboard, user transcription view
- Admin-only routes: admin dashboard, admin transcriptions list/detail

Evidence:
- [src/App.jsx](src/App.jsx#L133-L164)
- [src/components/auth/ProtectedRoute.jsx](src/components/auth/ProtectedRoute.jsx#L8-L28)
- [src/components/auth/HomeRoute.jsx](src/components/auth/HomeRoute.jsx#L4-L23)

#### Authentication and role model (frontend)
- Uses Firebase Auth session observer (`onAuthStateChanged`)
- Resolves role from token custom claims
- Normalizes legacy roles (`superAdmin`, `lguAdmin`) to `admin`
- Supports session persistence choice (remember-me local vs session)

Evidence:
- [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx#L1-L68)
- [src/pages/LoginPage.jsx](src/pages/LoginPage.jsx#L11-L67)

#### Upload UX scope
- Two methods: file upload and URL upload
- Client validation for MIME categories and max selected files
- Chunked upload orchestration with retries and progress/ETA
- Optional custom display name, description, and service category tagging

Evidence:
- [src/pages/UploadPage.jsx](src/pages/UploadPage.jsx#L13-L20)
- [src/pages/UploadPage.jsx](src/pages/UploadPage.jsx#L367-L689)

#### Dashboard UX scope (user + admin)
- File/folder browsing with nested folders
- Search, status/service filters, sorting, pagination
- Bulk operations (download/delete/move/status, role-dependent)
- File preview/properties modals and context menu actions

Evidence:
- User dashboard: [src/pages/DashboardPage.jsx](src/pages/DashboardPage.jsx#L34-L572)
- Admin dashboard: [src/pages/AdminDashboardPage.jsx](src/pages/AdminDashboardPage.jsx#L23-L711)

#### Firestore live data consumption
- Files and folders are consumed via Firestore `onSnapshot`
- Role-scoped queries in client (admin sees all, user sees own)
- LocalStorage cache used for faster initial render/hydration

Evidence:
- [src/hooks/useFirestoreFiles.js](src/hooks/useFirestoreFiles.js#L1-L110)
- [src/hooks/useFolders.js](src/hooks/useFolders.js#L1-L111)

---

### 2.2 Backend API Scope

#### Core server and mounts
- Express app with mounted route modules:
  - `/api/admin`
  - `/api/files`
  - `/api/pipeline`
  - `/api/transcriptions`
  - `/api/folders`

Evidence:
- [server/server.js](server/server.js#L143-L147)

#### Upload, assembly, metadata persistence
- `/api/upload/chunk` accepts one chunk at a time (auth required)
- `/api/upload/complete` verifies chunks, assembles/moves final file, writes Firestore metadata
- Supports both Vercel serverless temp mode (`/tmp`) and non-Vercel local chunk assembly

Evidence:
- [server/server.js](server/server.js#L150-L345)

#### URL ingestion and media extraction
- `/api/upload/url` supports direct URL fetch
- For known video/audio platforms, uses yt-dlp extraction
- If yt-dlp fails on platform URLs, stores an embed-only metadata record instead of binary upload

Evidence:
- [server/server.js](server/server.js#L347-L483)
- [server/services/ytdlp.js](server/services/ytdlp.js#L1-L177)

#### File delivery and streaming
- `/api/files/*path` proxies bytes from FTP storage
- Supports `Range` requests, `inline`/`attachment` disposition switch via query
- Path traversal protections and extension-based MIME mapping included

Evidence:
- [server/server.js](server/server.js#L773-L841)

#### Metadata/folder/transcription/admin APIs
- File metadata CRUD + status/folder/rename operations
- Folder CRUD + move with circular reference guard
- Transcription CRUD + file-delivery upload path
- Admin user CRUD + role changes via Firebase custom claims

Evidence:
- Files: [server/routes/files.js](server/routes/files.js#L9-L186)
- Folders: [server/routes/folders.js](server/routes/folders.js#L8-L191)
- Transcriptions: [server/routes/transcriptions.js](server/routes/transcriptions.js#L37-L268)
- Users/admin: [server/routes/users.js](server/routes/users.js#L10-L97)

#### Pipeline integration scope
- `/api/pipeline/status` and `/api/pipeline/webhook`
- Access allowed by matching `x-pipeline-key` against env key OR admin token fallback

Evidence:
- [server/routes/pipeline.js](server/routes/pipeline.js#L8-L74)

---

### 2.3 Storage and Data Scope

- Metadata collections used: `files`, `folders`, `transcriptions`, `quotes`, `settings`
- Binary storage is FTP/FTPS (not Firebase Storage)
- Frontend references metadata via Firestore listeners and backend APIs

Evidence:
- [server/server.js](server/server.js#L280-L319)
- [server/routes/folders.js](server/routes/folders.js#L32-L40)
- [server/routes/transcriptions.js](server/routes/transcriptions.js#L56-L74)
- [server/server.js](server/server.js#L694-L744)
- [server/services/ftp.js](server/services/ftp.js#L1-L256)

---

## 3) Endpoint Matrix (Method + Access)

### Public
- `POST /api/quote` — submit quote/contact form
- `GET /api/files/*path` — stream/download files via FTP proxy

Evidence:
- [server/server.js](server/server.js#L681-L749)
- [server/server.js](server/server.js#L773-L841)

### Authenticated (any signed-in user)
- `POST /api/upload/chunk`
- `POST /api/upload/complete`
- `POST /api/upload/url`
- `POST /api/files/bulk-download`
- `POST /api/files/bulk-move`
- `POST /api/files/download-folder/:folderId`
- `POST /api/files/metadata`
- `GET /api/files/metadata`
- `PUT /api/files/metadata/:fileId/folder`
- `POST /api/folders`
- `GET /api/folders`
- `PUT /api/folders/:id`
- `PUT /api/folders/:id/move`
- `DELETE /api/folders/:id`
- `GET /api/transcriptions`
- `GET /api/transcriptions/:id`

Evidence:
- [server/server.js](server/server.js#L150-L601)
- [server/routes/files.js](server/routes/files.js#L9-L134)
- [server/routes/folders.js](server/routes/folders.js#L8-L191)
- [server/routes/transcriptions.js](server/routes/transcriptions.js#L141-L214)

### Admin only
- `GET /api/admin/users`
- `POST /api/admin/users`
- `DELETE /api/admin/users/:uid`
- `PUT /api/admin/users/:uid/role`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `POST /api/files/bulk-delete`
- `POST /api/files/bulk-status`
- `PUT /api/files/metadata/:fileId/status`
- `PUT /api/files/metadata/:fileId/rename`
- `DELETE /api/files/metadata/:fileId`
- `POST /api/transcriptions`
- `POST /api/transcriptions/upload`
- `PUT /api/transcriptions/:id`
- `DELETE /api/transcriptions/:id`

Evidence:
- [server/routes/users.js](server/routes/users.js#L10-L97)
- [server/server.js](server/server.js#L542-L770)
- [server/routes/files.js](server/routes/files.js#L73-L186)
- [server/routes/transcriptions.js](server/routes/transcriptions.js#L37-L268)

### Pipeline key (or admin token fallback)
- `POST /api/pipeline/status`
- `POST /api/pipeline/webhook`

Evidence:
- [server/routes/pipeline.js](server/routes/pipeline.js#L8-L74)

---

## 4) Limitations and Constraints (Exact, Code-Backed)

### Upload and file constraints
- Max files per upload action: **10**
- Chunk size: **4 MB**
- Parallel chunks: **3 in dev**, forced to **1 in production build**
- Chunk retry attempts: **2**
- Complete retry attempts: **4**

Evidence:
- [src/pages/UploadPage.jsx](src/pages/UploadPage.jsx#L13-L20)

### MIME / file-type constraints
- User role accepts only `image/*`, `audio/*`, `video/*`
- Admin role additionally accepts specific doc types
- Backend admin doc list includes ppt/pptx; frontend admin accept list does not include ppt/pptx (capability mismatch)

Evidence:
- Frontend: [src/pages/UploadPage.jsx](src/pages/UploadPage.jsx#L10-L11), [src/pages/UploadPage.jsx](src/pages/UploadPage.jsx#L63-L75)
- Backend: [server/server.js](server/server.js#L67-L81)

### Workflow/state constraints
- File lifecycle statuses are limited to exactly:
  - `pending`
  - `in-progress`
  - `transcribed`
- This set is enforced in multiple endpoints and UI controls

Evidence:
- [server/routes/files.js](server/routes/files.js#L75-L78)
- [server/routes/pipeline.js](server/routes/pipeline.js#L30-L37)
- [server/server.js](server/server.js#L605-L610)
- [src/pages/AdminDashboardPage.jsx](src/pages/AdminDashboardPage.jsx#L28-L28)

### Access-control constraints
- Regular users are restricted to their own resources for file/folder/transcription access in server-side checks
- Admin is the only role allowed for user management, bulk delete/status, transcription create/update/delete

Evidence:
- [server/routes/files.js](server/routes/files.js#L49-L52), [server/routes/files.js](server/routes/files.js#L114-L117)
- [server/routes/folders.js](server/routes/folders.js#L49-L51)
- [server/routes/transcriptions.js](server/routes/transcriptions.js#L148-L151), [server/routes/transcriptions.js](server/routes/transcriptions.js#L216-L267)
- [server/routes/users.js](server/routes/users.js#L10-L97)

### Pagination and UI behavior constraints
- User dashboard page size fixed at **12** items
- Admin dashboard page size fixed at **15** items

Evidence:
- [src/pages/DashboardPage.jsx](src/pages/DashboardPage.jsx#L35-L35)
- [src/pages/AdminDashboardPage.jsx](src/pages/AdminDashboardPage.jsx#L72-L72)

### Deployment/runtime constraints
- Vercel mode stores temp chunks under `/tmp` only
- Vercel function config sets `maxDuration: 300` and `memory: 1024`
- CORS allows localhost defaults + `FRONTEND_URL` comma-separated list

Evidence:
- [server/server.js](server/server.js#L44-L46)
- [vercel.json](vercel.json#L11-L13)
- [server/server.js](server/server.js#L51-L58)

### Stream and download behavior constraints
- FTP range handling in file proxy streams to EOF for reliability, even when an explicit end range is requested

Evidence:
- [server/server.js](server/server.js#L804-L821)

### Fallback behavior constraints
- Direct URL fetch rejects HTML content-type responses
- yt-dlp failures on platform URLs create metadata-only embedded entries (no uploaded binary)

Evidence:
- [server/server.js](server/server.js#L460-L463)
- [server/server.js](server/server.js#L365-L401)

---

## 5) Required Environment and Configuration

### Frontend env variables
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- Optional: `VITE_API_BASE` (rewrites `/api/*` fetches to another origin)

Evidence:
- [src/firebase.js](src/firebase.js#L6-L11)
- [src/main.jsx](src/main.jsx#L9-L16)
- [src/lib/fileUrl.js](src/lib/fileUrl.js#L5-L11)

### Backend env variables
- Firebase Admin service account vars (`FIREBASE_*`)
- FTP config (`FTP_HOST`, `FTP_USER`, `FTP_PASS`, optional `FTP_BASE_PATH`)
- CORS frontend origin list (`FRONTEND_URL`)
- SMTP + quote notification (`SMTP_*`, optional `QUOTE_EMAIL`)
- Pipeline API key (`PIPELINE_API_KEY`)
- yt-dlp options (`YTDLP_COOKIES_FILE`, `YTDLP_BIN`)
- Runtime flags (`PORT`, `VERCEL`)

Evidence:
- [server/firebaseAdmin.js](server/firebaseAdmin.js#L8-L21)
- [server/services/ftp.js](server/services/ftp.js#L5-L15)
- [server/server.js](server/server.js#L23-L58)
- [server/server.js](server/server.js#L705-L755)
- [server/routes/pipeline.js](server/routes/pipeline.js#L8-L10)
- [server/services/ytdlp.js](server/services/ytdlp.js#L50-L99)

---

## 6) Verified Gaps / Risks (Presently Missing or Mismatched)

1. No automated test suite present in repository.
- No `*.test.*` or `*.spec.*` files detected
- No test script in package scripts

Evidence:
- [package.json](package.json#L6-L13)

2. Security packages present but not wired in server bootstrap.
- `helmet` and `express-rate-limit` are dependencies but not applied in server middleware chain

Evidence:
- [package.json](package.json#L26-L29)
- [server/server.js](server/server.js#L1-L20)

3. Vite dev proxy includes `/api/lgus`, but backend route mounts do not include an LGU route module.

Evidence:
- [vite.config.js](vite.config.js#L139-L140)
- [server/server.js](server/server.js#L143-L147)

4. README env guidance drift.
- README references `VITE_UPLOAD_API_BASE` and `VITE_UPLOAD_CHUNK_SIZE_MB`
- Current source uses fixed upload constants and `VITE_API_BASE` for API base rewrite

Evidence:
- [README.md](README.md#L23-L30)
- [src/pages/UploadPage.jsx](src/pages/UploadPage.jsx#L13-L20)
- [src/main.jsx](src/main.jsx#L9-L16)

5. FTP TLS cert validation is disabled (`rejectUnauthorized: false`), which is operationally permissive.

Evidence:
- [server/services/ftp.js](server/services/ftp.js#L16-L19)

---

## 7) Non-Goals / Not Implemented (as of this code scan)

- No billing/payments module
- No internal transcription automation engine in this repo (only status hooks/webhook endpoints)
- No explicit API versioning scheme (`/v1`, `/v2`, etc.)
- No active background queue worker/service in this codebase
- No fully wired security middleware stack (rate-limit/helmet not applied)

Evidence:
- Routes + app mount surface: [server/server.js](server/server.js#L143-L147)
- Pipeline interface only: [server/routes/pipeline.js](server/routes/pipeline.js#L28-L74)
- No test/worker files in repo root structure and server modules scanned

---

## 8) Deployment and Runtime Scope

- Local/dev runtime:
  - Frontend via Vite
  - Backend via Node (`server/server.js`)
  - Dev proxy from Vite to backend for API paths

- Production runtime options in code:
  - Vercel serverless function through [api/index.js](api/index.js#L1-L3) and [vercel.json](vercel.json#L1-L15)
  - Non-Vercel Node host mode serving `dist` and API from same process
  - cPanel Passenger entrypoint via [app.js](app.js#L1-L7)

Evidence:
- [package.json](package.json#L6-L13)
- [server/server.js](server/server.js#L844-L867)
- [vite.config.js](vite.config.js#L127-L141)

---

## 9) Documentation Confidence Statement

This document is based on direct inspection of current repository code and config files. Claims are constrained to verifiable implementation behavior and access controls present at scan time.
