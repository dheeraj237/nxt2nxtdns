## Context

NextDNS's Linked IP feature allows DNS resolvers at `45.90.28.224` / `45.90.30.224` to map incoming queries by source IP to a specific profile's configuration. This is essential for legacy devices (routers, IoT, guest networks) that only support plain DNS, not DoH/DoT. Without linking, those devices would bypass the profile's rules entirely.

**Current state:** The multi-account manager exposes account/profile/rule management via the NextDNS API but doesn't touch linked-IP. Users must manually link via `my.nextdns.io` dashboard or via NextDNS's public `link-ip.nextdns.io/:profile/:token` endpoint.

**Deployment context:** The app runs in a Docker container on a self-hosted Ubuntu/CasaOS home server that's always-on. Outbound calls from the container naturally carry the home network's public egress IP, so re-linking is transparent — no manual IP detection needed.

## Goals / Non-Goals

**Goals:**
- Enable users to link/re-link a profile to their home IP via the app UI ("Link IP Now" button).
- Enable hourly automatic re-linking for profiles marked with "auto-refresh" toggle, so ISP IP rotation doesn't break DNS.
- Build a minimal background scheduler subsystem that can run cron jobs reliably from the container.
- Display linked-IP status per profile (current linked IP, auto-refresh state).

**Non-Goals:**
- Multi-location support or per-account linked IPs (NextDNS enforces 1 global IP → 1 profile; multiple locations are out of scope).
- DDNS integration or custom IP specification (the container's egress IP is the only source used).
- UI for manually entering/detecting public IP (the container's outbound request is sufficient).
- Scheduled config swapping (that's a separate feature: `scheduled-profile-swap`).

## Decisions

**1. Token Freshness: Fetch `linkedIpUpdateToken` fresh each time**
- **Decision**: Don't cache the token in the database. Fetch it from `/profiles/:id/setup` right before each link call.
- **Rationale**: Token lifecycle is undocumented; fetching fresh ensures resilience to token rotation or expiration. The extra API call is negligible.
- **Alternative**: Cache in DB with TTL (added complexity, risk of stale token silently failing).

**2. Scheduler Architecture: In-process Node.js cron, not separate sidecar**
- **Decision**: Use `node-cron` npm package inside the Next.js app, triggered on server startup.
- **Rationale**: Self-hosted single container, always-on. In-process scheduler is simpler and avoids sidecar complexity.
- **Alternative**: Separate cron sidecar container (adds deployment complexity; not needed for a single-instance home server).

**3. Database Schema: Add boolean `auto_refresh_linked_ip` column to `profiles` table**
- **Decision**: Store auto-refresh state per profile in the database.
- **Rationale**: Persists user preference across restarts, integrates with existing profile schema.
- **Alternative**: In-memory config or env var (doesn't survive container restarts).

**4. API Endpoints: Reuse existing `/api/profiles/:id` PATCH for flag, add new `/api/profiles/:id/link-ip` POST**
- **Decision**: 
  - Update `auto_refresh_linked_ip` via existing PATCH `/api/profiles/:id` (same route that updates `display_name`, etc.).
  - New endpoint POST `/api/profiles/:id/link-ip` to trigger manual link (calls NextDNS, returns current IP).
- **Rationale**: Minimal new surface, follows existing API pattern.
- **Alternative**: New PATCH endpoint just for linked-IP (inconsistent with account/profile update patterns).

**5. Frontend: Inline toggle + button on profile card**
- **Decision**: Add toggle switch "Auto-refresh linked IP" and "Link IP Now" button to each profile's UI panel.
- **Rationale**: Discoverable, no new page/modal needed, fits existing profile management layout.
- **Alternative**: Separate linked-IP management page (adds navigation complexity).

**6. Cron Timing: Hourly, every hour on the hour**
- **Decision**: Run at 00, 01, 02... :00 UTC (top of each hour).
- **Rationale**: Simple, predictable, catches ISP rotation fast enough. User can tune later if needed.
- **Alternative**: Every 15 min (more responsive but unnecessary overhead), every 6h (too slow for dynamic IPs).

## Risks / Trade-offs

**Risk: Token expiration not documented**
- **Mitigation**: Fetch fresh from `/setup` endpoint each time; if it expires, the call fails gracefully and logs an error. User can manually retry via "Link IP Now" button.

**Risk: Cron job fails silently if container is down**
- **Mitigation**: Container is expected to be always-on in the deployment model. If it stops, re-linking pauses until restart (acceptable for home use). Future: add alerting/logging to detect missed runs.

**Risk: Multiple profiles with auto-refresh enabled → last-write-wins**
- **Mitigation**: NextDNS enforces 1 IP → 1 profile globally. If multiple profiles are marked auto-refresh, whichever the cron processes last will hold the link. Documented in UI ("Only one profile can hold the linked IP at a time"). User can choose to enable on just one profile, or accept last-write-wins behavior.

**Trade-off: In-process scheduler vs. external (cron, GitHub Actions, Vercel)**
- **Pro**: Simple, no external dependencies, works offline.
- **Con**: Cron won't run if the app process crashes (but container auto-restart should handle this). No distributed job queue for high-scale scenarios (not needed here).

## Migration Plan

1. Add `auto_refresh_linked_ip BOOLEAN DEFAULT FALSE` column to `profiles` table via a new migration script.
2. Deploy updated app with new endpoints and scheduler.
3. No data migration needed; flag defaults to false, so existing profiles opt-in to auto-refresh.
4. Rollback: Drop the column (auto-refresh is purely optional).

## Open Questions

- **Cron timing edge case**: If a profile's auto-refresh is toggled ON/OFF mid-hour, should that change take effect immediately in the current cron run, or on the next hour? (Recommend: next hour, simpler, documented).
- **Monitoring**: Should we log each cron run (success/failure) to a persistent log, or just emit structured logs? (Recommend: structured logs + optional Sentry/logging sink integration for alerting).
- **UI feedback on async re-link**: When user clicks "Link IP Now," should it return immediately with "queued" status, or wait for the NextDNS call to complete? (Recommend: wait, simpler, <1s typical latency).
