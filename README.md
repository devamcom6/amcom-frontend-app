# amcom-frontend-app

Web frontend for **Amcom** — buyback land investments, fixed-return capital investment and property management.
Vue 3 + TypeScript + Vite, talking to a versioned Laravel API (`/api/v1`).

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 — runs against the built-in mock API
```

Mock-mode logins (password `Password123!`, all OTP codes `123456`): `user@amcom.test`, `new@amcom.test`, `admin@amcom.test`, `superadmin@amcom.test`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (mock API per `.env.development`) |
| `npm run type-check` | Strict `vue-tsc` type check |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run media:mock` | Regenerate optimised images from `docs/images` (Python 3 + Pillow) |

## Connecting to the Laravel API

Create `.env.local`:

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

No secrets belong in `VITE_*` variables — Paystack, Cloudinary, ZeptoMail and Persona credentials live only in Laravel.

## Documentation

- [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) — structure, routing, auth, RBAC, state, API layer, media, payments, errors, env
- [docs/BACKEND_API_CONTRACT.md](docs/BACKEND_API_CONTRACT.md) — every endpoint with payloads, validation and errors
- [docs/FRONTEND_BACKEND_HANDOFF.md](docs/FRONTEND_BACKEND_HANDOFF.md) — what's done, integration requirements, open assumptions
- `docs/amcom-ui/` — design source of truth

## Deployment

Static SPA: serve `dist/` with a fallback rewrite of all routes to `index.html`, and the security headers listed in the architecture doc (§14).
