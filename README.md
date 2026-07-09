# NextDNS Multi-Account Manager

Manage multiple NextDNS accounts/profiles from one UI, with a "master
profile" you can mirror onto any selection of other profiles across
any account.

## Why a backend

NextDNS's API only accepts auth via the `X-Api-Key` header, and its
CORS preflight does not whitelist that header for cross-origin
browser requests. A pure client-only app cannot call
`api.nextdns.io` directly. This app's server side holds your API keys
and relays NextDNS calls server-side.

API keys are stored in plaintext in the SQLite database - this is a
self-hosted, single-user tool, and there's no `SERVER_SECRET` /
at-rest encryption. Secure the host and the `data/` volume yourself.

## Architecture

Single Next.js 15 app (App Router) - not a separate backend/frontend.

- `src/app` - pages and API routes (login, main UI)
- `src/components` - React UI
- `src/hooks` - React Query hooks for accounts/profiles/sync
- `src/lib/db` - SQLite (`better-sqlite3`) schema + repository
- `src/lib/nextdns` - NextDNS API client
- `src/lib/sync` - diff engine + sync executor (master -> targets)
- `src/lib/auth`, `env` - session/JWT auth, env loading

## Getting Started

### Local dev

```bash
pnpm install
cp .env.example .env
# set MASTER_PASSWORD to your login password
# set JWT_SECRET: openssl rand -hex 32
pnpm dev
```

Open `http://localhost:3000`, sign in with `MASTER_PASSWORD`, add a
NextDNS account (label + API key from https://my.nextdns.io/account),
then add its profiles by pasting each profile's 6-character ID (from
its dashboard URL, e.g. `my.nextdns.io/abc123/setup`) - the NextDNS
API has no endpoint to list profiles automatically.

### Testing

```bash
pnpm test   # vitest run
```

### Deploying (self-hosted, Docker)

```bash
export MASTER_PASSWORD=...
export JWT_SECRET=$(openssl rand -hex 32)
docker compose up --build -d
```

- Exposes port `3000` on the host; put it behind your own reverse
  proxy or tunnel for HTTPS (e.g. Caddy, Nginx, Tailscale) - the
  container itself serves plain HTTP.
- The SQLite database lives in the `nxtdns-data` Docker volume, so
  data survives container rebuilds.

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
