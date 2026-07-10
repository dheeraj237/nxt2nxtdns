# Proposal: Analytics & Logs Tabs

## Summary

Implement two new profile tabs to monitor DNS query usage and view real-time logs:

1. **Analytics Tab** - Monthly quota monitor (queries used / 300K free limit)
2. **Logs Tab** - Real-time DNS query log viewer (last 50 entries)

Both tabs are read-only views that fetch data on-demand from NextDNS API; no local storage required.

---

## Problem

- Users can't see how close they are to the 300K monthly query limit
- No way to monitor query patterns in real-time via this app
- Currently these tabs are just placeholders ("not available yet")

---

## Solution

### Analytics Tab
- Show current month's total queries and blocked queries
- Display as:
  - Total queries this month: XXX / 300,000 (XX%)
  - Blocked queries this month: YYY
  - Progress bar with color coding (green <70%, yellow 70-90%, red >90%)
  - Last updated timestamp
- [Reload ⟳] button to fetch fresh data manually

### Logs Tab
- Show last 50 DNS query log entries from current profile
- Display as table with columns:
  - Timestamp
  - Domain
  - Status (blocked/allowed/default)
  - Device name
  - Client IP (optional)
- Manual [Reload ⟳] button to fetch fresh entries
- No auto-refresh (manual only)

---

## Scope

### Included
- Analytics tab UI + API endpoint
- Logs tab UI + API endpoint
- Per-profile views (not aggregated across accounts)
- Manual reload functionality
- Color-coded quota warnings (green/yellow/red)
- Error handling & loading states

### Excluded
- Auto-refresh / polling in background
- Historical data storage
- Advanced filtering / search
- Export / download functionality
- Aggregated multi-account quota view

---

## Implementation Steps

1. Create backend API routes (2 endpoints)
2. Create React hooks (useAnalytics, useLogs)
3. Build Analytics tab UI component
4. Build Logs tab UI component
5. Wire into ProfileTabs component
6. Test with real NextDNS API data

---

## Acceptance Criteria

- [ ] Analytics tab shows current month's quota usage with accurate data
- [ ] Quota warning colors display correctly (green/yellow/red thresholds)
- [ ] Logs tab displays last 50 entries with correct schema
- [ ] [Reload] buttons fetch fresh data on click
- [ ] Loading states shown during API calls
- [ ] Error messages displayed if API fails
- [ ] Per-profile data isolation (each profile shows own data)

---

## Dependencies

- NextDNS API endpoints must be accessible:
  - `GET /profiles/:id/analytics/status` (monthly stats)
  - `GET /profiles/:id/logs?limit=50&sort=desc` (recent logs)
- No new database schema needed
- No new dependencies required

---

## Questions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Logs auto-refresh? | Manual only | Simpler, user can control API calls |
| Quota color warnings? | Yes (green/yellow/red) | Visual feedback helps catch approaching limits |
| Multi-account aggregate? | Per-profile only | Simpler, user sees data for current profile |
| Logs limit | Fixed 50 entries | Simple & sufficient for monitoring |

