# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Food-waste logging app for Zing. One Vercel project serves both halves from a single origin:

- `backend/` — Express 5 + Mongoose REST API (CommonJS), dependencies declared in the **root** `package.json`
- `frontend/` — Vite + React 19 SPA (ESM), its own `package.json` and `node_modules`
- `api/index.js` — the Vercel serverless entry point that wraps `backend/app.js`

## Commands

```bash
# API (from the repo root — dotenv reads ./.env, so cwd matters)
npm install
npm run dev        # nodemon backend/server.js, port 4000 (PORT overrides)
npm start

# Frontend (from frontend/)
npm install
npm run dev        # Vite dev server; proxies /api -> localhost:4000
npm run build
npm run lint       # eslint .
npm run preview
```

Both halves must be running for local development. The backend has no CORS middleware, so the Vite proxy is load-bearing rather than a convenience: it keeps dev requests same-origin, matching production. There is no test suite or test runner in either project.

`.env` (repo root, gitignored) must define `MONGO_URI`. Credentials in an Atlas SRV URI need reserved characters percent-encoded (`@` → `%40`, `:` → `%3A`); an unencoded `@` makes the driver read the password tail as a hostname and fail with `querySrv EBADNAME`.

## Deployment shape

`vercel.json` builds `frontend/` to `frontend/dist` and rewrites `/api/(.*)` → `/api?__vpath=$1`, with everything else falling through to `index.html` for SPA routing. `api/index.js` reconstructs the original `/api/v1/...` path from `__vpath` before handing the request to Express — the routers are mounted at `/api/v1`, so a collapsed `req.url` 404s exactly like a missing function. `__vpath` is a private contract between those two files; renaming it in one place breaks production while local dev keeps working.

Three constraints follow from the serverless shape, all already handled and easy to break:

- `backend/app.js` only *builds* the app. Connecting and listening belong to the runner: `backend/server.js` locally, `api/index.js` on Vercel. (`server.js`'s header comment still names `api/[...path].js`, a filename that predates the current entry point.)
- `backend/db/connect.js` caches the Mongoose connection on `globalThis` so warm invocations reuse it, and drops a rejected promise so the next request retries. Without the cache, Atlas connection limits are exhausted quickly.
- Inside `api/index.js`, never call `process.exit` (it kills the whole function instance) and never use `res.status()/res.json()` (Vercel helpers that don't exist there) — use the plain Node response API.

## Backend architecture

Route → controller → Mongoose model. The two mount points in `app.js` are asymmetric:

- `itemsRouter` at `/api/v1/items` → `/items`, `/items/search`, `/items/:itemId`
- `entriesRouter` at `/api/v1` (root, **not** `/api/v1/entries`) → `/`, `/search`, `/counts`, `/:entryId`

Because the entries router owns the API root, its literal paths must stay declared **above** `/:entryId` in `routes/entries.js`. Express matches in order, and a new literal route added below it gets captured as an entry id and fails with a cast error instead of returning data.

The database name is pinned in `db/connect.js` as `dbName: 'WasteLog'` rather than in `MONGO_URI`, so every environment lands on the same database. Collection names are pinned in the model calls (`'Items'`, `'Entries'`) instead of relying on Mongoose pluralization.

- `Item` — a product/ingredient (`name`, `quantityType`)
- `LogEntry` — one waste record (`entererName`, `product` as an ObjectId ref to `Item`, `productQuantity`, optional `notes`)

Because `LogEntry.product` is a reference and nothing calls `.populate()`, searching entries by product name is a two-step lookup: resolve matching `Item` documents, then query with `product: {$in: ids}` (see `controllers/entries.js`). Entry responses return raw ObjectIds; the frontend resolves names itself. Adding `.populate()` would change a response shape that both the search path and `EntriesPage` depend on.

`getEntryCounts` (`GET /api/v1/counts`) tallies entries per item with an aggregation rather than returning the documents — the only consumer is the items page, which wants the numbers, and shipping every entry to count them client-side moved ~146KB per search. Prefer the same approach for any new "how many" question.

All user-supplied search strings are regex-escaped before reaching `$regex` (`iname`, `enterer`, `productName`). Preserve that when adding search paths.

### Error handling is not implemented

Controllers carry commented-out `require('../errors')` imports and commented-out `NotFoundError`/`BadRequestError` throws; the `errors/` module does not exist. There is no `express-async-errors`, no error middleware, and no 404 handler, so a rejected async controller fails the request without JSON. `getEntries` is the only controller with a try/catch, and it responds with a bare JSON string rather than an object — `frontend/src/api/client.js` special-cases that, so fixing the controller to return `{error}` means updating the client's unwrapping too. When touching controllers, either build the intended `errors/` module plus middleware or match the existing inline `res.status(400).json({error})` style; don't add bare `throw`s that nothing catches.

Missing documents are also unchecked: `updateItem`/`deleteItem`/`updateEntry`/`deleteEntry` return success even when the id matches nothing. The two delete handlers disagree on shape — `deleteItem` sends 204 with a body Node strips, `deleteEntry` sends 200 with one it keeps. There is no unique index on `Item.name`; duplicate prevention lives only in `ItemsPage`, so it does not apply to writes from anywhere else.

### The REST surface is ahead of the UI

Six of the eleven endpoints have no caller: `GET /items/search`, `PATCH`/`DELETE` on both routers, and `GET /api/v1/` (whose `getEntries` wrapper is exported from `client.js` but imported nowhere). Treat them as unfinished rather than dead — but know that editing them changes nothing a user can currently reach.

## Frontend architecture

`main.jsx` mounts `BrowserRouter` + `<Toaster />`; `App.jsx` nests all routes under `MainLayout` (`Header` + `<Outlet />`): `/` (LandingPage), `/entries`, `/items`.

- Router is **react-router v7** — import from `react-router`, never `react-router-dom`.
- All network access goes through `src/api/client.js`. It hardcodes `BASE = '/api/v1'`, unwraps the backend's `{items}`/`{entries}`/`{item}`/`{entry}` envelopes, and rejects HTML responses explicitly (a deploy without the `/api` rewrite serves `index.html` with a 200, which would otherwise surface as `Unexpected token '<!doctype'`). Add endpoints here rather than calling `fetch` from components.
- Date filters: `searchEntries` pins `startDate`/`endDate` to the start and end of the local day before sending them, because a bare `YYYY-MM-DD` end bound excludes everything logged that day. `EntriesPage` groups results by the *local* calendar day for the same reason — a UTC key would group results into days outside the range that was asked for. Its group key also lowercases the enterer name, because the backend matches enterers case-insensitively and "andrew" must not split from "Andrew".
- Forms use `react-hook-form` with validation rules that deliberately mirror the Mongoose schema rules (min length 2, quantity min 0.001, notes max 500). Keep both sides in sync when a schema rule changes.
- The landing page *stages* rows in local state; `Submit` fires one POST per row via `Promise.allSettled` (there is no bulk-create endpoint) and keeps failures staged.
- `ItemCombobox` replaces a 200-item `<select>` and is the only component shared across pages. Two modes: by default the value is an item `_id` and typed text is never committed, so the form always holds a real reference; with `freeText`, the typed string *is* the value, for the entries filter where the backend matches partial names server-side.
- Bootstrap 5 is themed by SCSS variable overrides in `src/custom.scss`, which `@use`s Bootstrap from `node_modules` and generates custom responsive utilities (`.w-{bp}-{size}`, `.fs-{bp}-{n}`, `.display-{bp}-{n}`, `.text-{bp}-wrap`). Change theme colors there, not with inline styles. Bootstrap's JS bundle is imported in `main.jsx` for the `data-bs-toggle` navbar collapse; components use plain Bootstrap classes — `react-bootstrap` is a dependency but unused.

### Mobile conventions

The app is used on phones, and several non-obvious workarounds exist because of it. Follow them rather than reverting to the simpler-looking code:

- Anything that focuses an input or selects its text is gated on `window.matchMedia('(hover: hover)')`. On iOS those actions pop the keyboard or the copy/paste callout over the thing the user was about to tap. The same guard wraps the `.btn:hover` rule in `custom.scss`, so a tapped button doesn't stay maize.
- Don't use `crypto.randomUUID` for client-side keys. It exists only in a secure context, so it is `undefined` when the app is opened over a plain-HTTP LAN address for phone testing — it threw inside `handleSubmit`, which swallowed the error and made the Add button look dead. `AddItem` uses a counter ref instead.
- Heights that must survive the on-screen keyboard use `dvh`, not `vh` (`.min-h-dvh`, the combobox's `max-height`).
- Collapsible UI is driven by React state, not Bootstrap's `data-bs-toggle="collapse"`. Bootstrap mutates `.show` on the DOM directly, so a row reused across searches keeps an open state React never resets.
- `custom.scss` repaints every `.btn` yellow on hover, so clickable list rows are built from `list-group-item-action` with `bg-transparent`. Reaching for `.btn` there turns the whole row maize.
