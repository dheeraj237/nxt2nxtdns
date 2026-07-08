# NextDNS Multi-Account Manager

Manage multiple NextDNS accounts/profiles from one UI, with a "master
profile" you can mirror onto any selection of other profiles across
any account.

## Why a backend

NextDNS's API only accepts auth via the `X-Api-Key` header, and its
CORS preflight does not whitelist that header for cross-origin
browser requests. A pure client-only app cannot call
`api.nextdns.io` directly. The `backend/` service holds your API
keys (encrypted at rest) and relays NextDNS calls server-side.

## Layout

- `backend/` - Node + Express + SQLite. Owns auth, persistence,
  the NextDNS relay, and the master-profile diff/mirror sync engine.
  Deploy via Docker (see `backend/docker-compose.yml`) on any host
  you control (e.g. CasaOS).
- `frontend/` - React + Vite + TS + Tailwind SPA. Static build,
  deployed to GitHub Pages via `.github/workflows/deploy.yml`. Talks
  only to your backend's own API - never to NextDNS directly.

## Setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run hash-password -- "your-master-password"   # paste into MASTER_PASSWORD_HASH
openssl rand -hex 32                                # paste into JWT_SECRET
openssl rand -hex 32                                # paste into SERVER_SECRET
# set CORS_ORIGIN to your deployed frontend origin, e.g. https://youruser.github.io
npm run dev      # or: docker compose up --build
```

### Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_BASE_URL to your backend's public URL
npm install
npm run dev
```

Open the printed local URL, sign in with your master password, add a
NextDNS account (label + API key from https://my.nextdns.io/account),
then add its profiles by pasting each profile's 6-character ID (from
its dashboard URL, e.g. `my.nextdns.io/abc123/setup`) - the NextDNS
API has no endpoint to list profiles automatically.

### Deploying

- **Backend**: build/run the Docker image on your own host, exposed
  publicly (e.g. via a reverse proxy or tunnel) over HTTPS so the
  GitHub Pages frontend can reach it cross-origin.
- **Frontend**: push to `main`; the GitHub Actions workflow builds
  and publishes `frontend/` to GitHub Pages. Set the repo variable
  `VITE_API_BASE_URL` (Settings -> Secrets and variables -> Actions
  -> Variables) to your backend's public URL first.

## Notes / accepted tradeoffs

- One global master profile; "apply" makes each selected target's
  denylist, allowlist, privacy blocklists/disguisedTrackers, and
  parentalControl services/categories an exact mirror of the master
  (entries only on the target are removed).
- NextDNS's `PATCH` merge-vs-replace semantics for
  `parentalControl`/`privacy` are undocumented; the diff engine
  currently sends the full desired array on any change. Verify
  against a real throwaway profile if you see unexpected results.
- No documented NextDNS rate limits; the sync executor caps
  concurrency at 3 targets in parallel.
