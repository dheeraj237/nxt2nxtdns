## 1. Database Migration

- [x] 1.1 Create SQL migration to add `auto_refresh_linked_ip BOOLEAN DEFAULT FALSE` column to `profiles` table
- [x] 1.2 Test migration locally (apply and rollback) to ensure correctness

## 2. Backend: NextDNS API Integration

- [x] 2.1 Add `getProfileSetup(accountId, profileId)` function to `src/lib/nextdns/endpoints.ts` that calls `GET /profiles/:id/setup` and returns the full response (including `linkedIpUpdateToken`, `linkedIp`, `linkedIpDNSServers`)
- [x] 2.2 Add `linkProfileToCurrentIp(linkedIpUpdateToken, profileId)` function to `src/lib/nextdns/endpoints.ts` that calls `GET https://link-ip.nextdns.io/:profileId/:token` and handles CORS (note: cross-origin, no X-Api-Key auth)
- [x] 2.3 Add error handling for both endpoints: if `/setup` fails (bad profile, invalid key), throw NextDnsApiError; if `link-ip` fails, throw NextDnsApiError with descriptive message
- [ ] 2.4 Test both functions against live NextDNS API (use a test profile) to verify request/response shapes

## 3. Backend: Database Layer Update

- [x] 3.1 Update `src/lib/db/repo.ts` `ProfileRow` interface to include optional `auto_refresh_linked_ip: boolean` field
- [x] 3.2 Add `profilesRepo.getByAutoRefresh()` function that queries all profiles where `auto_refresh_linked_ip = true` (used by scheduler)
- [x] 3.3 Add `profilesRepo.updateAutoRefresh(profileId, enabled: boolean)` function to toggle the auto-refresh flag
- [ ] 3.4 Write simple tests for database read/write operations on the new column

## 4. Backend: Manual Link API Endpoint

- [x] 4.1 Create new route `src/app/api/profiles/[id]/link-ip/route.ts` with POST handler
- [x] 4.2 POST handler SHALL: accept profileId from URL, look up the account and profile in DB, fetch the account's NextDNS API key
- [x] 4.3 POST handler SHALL: call `getProfileSetup()` to fetch the linkedIpUpdateToken
- [x] 4.4 POST handler SHALL: call `linkProfileToCurrentIp()` with the token
- [x] 4.5 POST handler SHALL: return HTTP 200 with JSON: `{ linkedIp: string, linkedIpDNSServers: string[], updatedAt: ISO8601 timestamp }`
- [x] 4.6 POST handler SHALL: handle errors (404 if profile not found, 502 if NextDNS fails) with descriptive messages
- [ ] 4.7 Write integration test: call the endpoint and verify it hits the NextDNS mock/live API correctly

## 5. Backend: Scheduler Setup

- [x] 5.1 Install `node-cron` package: `npm install node-cron` (add to dependencies in `package.json`)
- [x] 5.2 Create new file `src/lib/scheduler/linkedIpRefresher.ts` that exports a function `initLinkedIpRefresherJob()`: returns a cron job
- [x] 5.3 The job SHALL query profiles where `auto_refresh_linked_ip = true`
- [x] 5.4 The job SHALL for each profile: fetch account's API key, call `getProfileSetup()`, call `linkProfileToCurrentIp()`
- [x] 5.5 The job SHALL catch and log errors per-profile (don't fail the whole job if one profile fails)
- [x] 5.6 The job SHALL run on cron schedule: `0 * * * *` (every hour at :00)
- [x] 5.7 Create new file `src/lib/scheduler/index.ts` that exports `initScheduler()`: initializes all cron jobs (currently just linked-IP, but extensible for future jobs)
- [x] 5.8 Call `initScheduler()` on app startup in `src/app/layout.tsx` or `src/instrumentation.ts` (whichever pattern the app uses)

## 6. Backend: Update Existing Profile API

- [x] 6.1 Modify `src/app/api/profiles/[id]/route.ts` PATCH handler to accept and process `auto_refresh_linked_ip` field if provided
- [x] 6.2 PATCH handler SHALL only update the flag if user has permission to modify that profile (respect existing auth logic)
- [ ] 6.3 Write test: PATCH profile with `{ auto_refresh_linked_ip: true }` and verify DB reflects it

## 7. Frontend: Data Models and Hooks

- [x] 7.1 Update `src/lib/nextdns/types.ts` to add `linkedIp`, `linkedIpDNSServers`, `linkedIpUpdateToken` fields to a new `ProfileSetup` interface
- [x] 7.2 Update API client `src/lib/apiClient.ts` to add two new functions: `linkProfileNow(profileId)` (calls POST `/api/profiles/:id/link-ip`) and `updateProfileAutoRefresh(profileId, enabled)` (calls PATCH with the flag)
- [x] 7.3 Create new hook `src/hooks/useLinkedIp.ts`: `const { linkedIp, isAutoRefreshEnabled, linkNow, toggleAutoRefresh, loading, error } = useLinkedIp(profileId)`. Use React Query to fetch and manage state. Call `linkProfileNow` and `updateProfileAutoRefresh` via the API client.
- [ ] 7.4 Write test for the hook: verify loading states, success states, and error handling

## 8. Frontend: UI Component

- [x] 8.1 Create new component `src/components/ProfileLinkedIpCard.tsx` that renders:
  - Current linked IP (or "No linked IP" if none)
  - "Link IP Now" button (calls `linkNow()`, shows loading spinner, displays success/error toast)
  - "Auto-refresh linked IP" toggle (calls `toggleAutoRefresh()`, shows loading spinner)
  - Optional help text explaining the 1-IP-1-profile constraint and that multiple auto-refresh may result in last-write-wins
- [x] 8.2 Design for consistency with existing profile cards (use same spacing, typography, button styles)
- [x] 8.3 Add component to the profile management UI, likely in `src/app/accounts/[id]/page.tsx` within the profile list or as a collapsible section

## 9. Frontend: Warning for Multiple Auto-Refresh

- [x] 9.1 In the profiles list or account view, add a conditional warning banner if more than one profile has auto-refresh enabled: "Multiple profiles have auto-refresh enabled. NextDNS enforces one IP per profile; last re-linked profile will hold the IP."
- [x] 9.2 Make the warning dismissible (user can close it, don't re-show per session) or just informational

## 10. Testing and Validation

- [ ] 10.1 Write end-to-end test: enable auto-refresh on a profile, wait for the next cron hour (or mock time), verify the link call was made
- [ ] 10.2 Manual test: click "Link IP Now" button in UI, verify the linked IP updates and matches the container's egress IP
- [ ] 10.3 Manual test: disable auto-refresh toggle on a profile, verify it stops being processed by the cron job (check logs)
- [ ] 10.4 Manual test: simulate ISP IP rotation (if testable) and verify hourly cron re-links to the new IP
- [ ] 10.5 Verify database migration runs cleanly on a fresh database and on an existing database with data
- [ ] 10.6 Check logs: ensure scheduler startup is logged, each cron run is logged with success/failure per profile

## 11. Documentation and Deployment

- [ ] 11.1 Add README section explaining the linked-IP feature: what it does, how to use it, the 1-IP-1-profile constraint
- [ ] 11.2 Document the new API endpoints in any API docs (if the app maintains OpenAPI/GraphQL schema, update it)
- [ ] 11.3 Test deployment: build Docker image, run on the home server, verify scheduler starts and logs appear in container logs
- [ ] 11.4 Verify no breaking changes: run existing test suite and ensure all pass
