# NextDNS Multi-Account Manager

Manage multiple NextDNS accounts/profiles from one UI. Open any
account's profile, edit it with a NextDNS-dashboard-style tabbed
editor, then optionally "Save to..." any selection of other accounts
to mirror those settings onto their default profile.

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
- `src/lib/sync` - diff engine + sync executor (the profile open in the editor -> selected target accounts)
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

Open `http://localhost:3000`, sign in with `MASTER_PASSWORD`, and add
a NextDNS account (label + API key from
https://my.nextdns.io/account). The app fetches that key's profiles
from NextDNS automatically - pick one as the account's default. An
account can never be reduced to zero profiles, and its default
profile can't be deleted until you set a different one.

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

- "Save to..." makes each selected target account's default
  profile's denylist, allowlist, privacy blocklists/disguisedTrackers,
  and parentalControl services/categories an exact mirror of the
  profile you were editing (entries only on the target are removed).
- Denylist/allowlist entries have an active/inactive switch (matching
  NextDNS's own semantics) that applies immediately, independent of
  the page's Save button. Privacy and Parental Control edits are
  staged locally and only sent to NextDNS when you click Save.
- Security, Logs, Analytics, and Settings tabs are placeholders - no
  backend integration yet.
- NextDNS's `PATCH` merge-vs-replace semantics for
  `parentalControl`/`privacy` are undocumented; the diff engine
  currently sends the full desired array on any change. Verify
  against a real throwaway profile if you see unexpected results.
- No documented NextDNS rate limits; the sync executor caps
  concurrency at 3 targets in parallel.
