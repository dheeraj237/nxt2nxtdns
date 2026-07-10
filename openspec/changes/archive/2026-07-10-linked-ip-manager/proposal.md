## Why

NextDNS's "Linked IP" feature routes plain-DNS queries (from devices that don't support DoH/DoT) based on the source IP. When using a home router with NextDNS, you need to link your router's public IP to a profile so its traffic gets the right DNS rules. Currently, the multi-account manager doesn't expose this feature, forcing manual management via NextDNS's web dashboard. Adding linked-IP management to the app allows users to control which profile their home router points to directly from here, and auto-refresh the link hourly to survive ISP IP rotation without manual intervention.

## What Changes

- **Manual link button per profile**: A "Link IP Now" action that immediately links that profile to the current public IP by calling NextDNS's link-ip endpoint.
- **Auto-refresh toggle per profile**: A switch that marks a profile eligible for automatic re-linking every hour. The container's background scheduler runs the link call, so the home IP stays current even when your ISP rotates the public address.
- **Background scheduler subsystem**: A cron-based scheduler inside the app that runs background jobs (linked-IP refresh and future scheduled tasks) from the self-hosted container.
- **UI/UX**: Per-profile linked-IP status display (current IP, whether auto-refresh is on), "Link IP Now" button, and toggle switch.

## Capabilities

### New Capabilities

- `linked-ip-management`: Ability to manage which NextDNS profile is linked to the home router's IP, including manual re-linking and optional hourly automatic refresh via a background cron job.

### Modified Capabilities

<!-- No existing capability requirements change with this feature -->

## Impact

**Code changes:**
- Backend API: Integrate NextDNS's `/profiles/:id/setup` (read linkedIpUpdateToken) and `link-ip.nextdns.io` (write link) endpoints.
- Background scheduler: Add hourly cron job to refresh linked IPs for profiles with auto-refresh enabled.
- Database: Optional schema change to store auto-refresh flag per profile (if not already available in memory/config).
- Frontend: New UI component for linked-IP status and button/toggle on profile cards.

**Deployment:**
- Container must be always-on for background scheduler to work reliably.
- Works transparently with self-hosted Docker/CasaOS deployment on Ubuntu.

**Dependencies:**
- None on external services beyond NextDNS API (already required).
- May optionally add a cron library (e.g., `node-cron`) if using in-process scheduler.

**No breaking changes** — purely additive feature on top of existing account/profile management.
