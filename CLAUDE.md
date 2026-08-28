# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Food-waste logging app for Zing. Two independent Node projects in one repo — there is no root `package.json` or workspace tooling, so npm commands must be run from `backend/` or `frontend/`.

- `backend/` — Express 5 + Mongoose REST API (CommonJS)
- `frontend/` — Vite + React 19 SPA (ESM), deployed to Vercel

## Commands

```bash
# backend (from backend/)
npm install
npm start          # nodemon app.js — requires backend/.env with MONGO_URI; PORT defaults to 4000

# frontend (from frontend/)
npm install
npm run dev        # Vite dev server
npm run build
npm run lint       # eslint .
npm run preview
```

There is no test suite and no test runner configured in either project.

`backend/.env` is gitignored and not present in a fresh clone; the server will fail to connect without it.

## Backend architecture

Standard route → controller → Mongoose model layering. `app.js` wires two routers, and the mount points are asymmetric:

- `itemsRouter` at `/api/v1/items` → `/api/v1/items`, `/api/v1/items/search`, `/api/v1/items/:itemId`
- `entriesRouter` at `/api/v1` (root, **not** `/api/v1/entries`) → `/api/v1/`, `/api/v1/search`, `/api/v1/:entryId`

The database name is pinned in `db/connect.js` as `dbName: 'WasteLog'` rather than in the `MONGO_URI` path, so every environment lands on the same database regardless of what each developer's `.env` looks like. Note that credentials in an Atlas SRV URI must have reserved characters percent-encoded (`@` → `%40`, `:` → `%3A`); an unencoded `@` in the password makes the driver parse the password tail as the hostname and fail with `querySrv EBADNAME`.

Two collections, with explicit collection names pinned in the model calls (`'Items'`, `'Entries'`) rather than Mongoose's pluralization:

- `Item` — a product/ingredient (`name`, `quantityType`)
- `LogEntry` — one waste record (`entererName`, `product` as an ObjectId ref to `Item`, `productQuantity`)

Because `LogEntry.product` is a reference, searching entries by product name is a two-step lookup: resolve matching `Item` documents first, then query `LogEntry` with `product: {$in: ids}` (see `backend/controllers/entries.js`). Entry responses currently return raw ObjectIds — nothing calls `.populate()` yet.

All user-supplied search strings are regex-escaped before being passed to `$regex` (`iname`, `enterer`, `productName`). Preserve that when adding search paths.

### Error handling is not implemented

Controllers have commented-out `require('../errors')` imports and commented-out `NotFoundError`/`BadRequestError` throws; the `errors/` module does not exist. There is also no `express-async-errors`, no error-handling middleware, and no 404 handler, so a rejected async controller currently crashes the request rather than returning JSON. `getEntries` is the only controller with a try/catch. When touching controllers, either build out the intended `errors/` module + middleware or match the existing inline `res.status(400).json({error})` style — don't add bare `throw`s that nothing catches.

Missing documents are also not checked: `updateItem`/`deleteItem`/`updateEntry`/`deleteEntry` return 200/204 with `null` or `{deleted: true}` even when the id matches nothing.

## Frontend architecture

`main.jsx` mounts `BrowserRouter` + `<Toaster />` (react-hot-toast); `App.jsx` holds all routes nested under `MainLayout` (which renders `Header` + `<Outlet />`). Routes: `/` (LandingPage), `/entries`, `/items`.

- Router is **react-router v7** — import from `react-router`, never `react-router-dom`.
- Bootstrap 5 is themed by SCSS variable overrides in `src/custom.scss`, which `@use`s Bootstrap directly from `node_modules` and adds custom responsive utility generators (`.w-{bp}-{size}`, `.fs-{bp}-{n}`, `.display-{bp}-{n}`). Change theme colors there, not with inline styles. Bootstrap's JS bundle is imported in `main.jsx` for the `data-bs-toggle` navbar collapse, and components use plain Bootstrap classes — `react-bootstrap` is a dependency but currently unused.
- `vercel.json` rewrites all paths to `index.html` for SPA routing.

### Frontend/backend are not yet connected

There are no `fetch` calls, no API base URL, and no dev-server proxy in `vite.config.js`. `EntriesPage`, `ItemsPage`, `PendingItems`, and much of `AddItem` are placeholder stubs — `AddItem` still contains pasted Bootstrap example markup using `class`/`for` instead of `className`/`htmlFor`. Expect to add the API layer and proxy config when wiring these up.
