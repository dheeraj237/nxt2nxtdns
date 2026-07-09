## Context

The app already has a scheduler infrastructure (from linked-ip-manager) that runs cron jobs at fixed intervals. Scheduled profile swaps require two distinct time-based operations: apply at a start time, restore at an end time. These times are user-defined and arbitrary (e.g., "09:00 to 17:00"), unlike the hourly linked-IP refresh.

The sync/diff engine already exists to apply one profile's config to others (`src/lib/sync/{diffEngine,executor}.ts`), so we reuse it rather than reinvent config application.

Current state: No schedule storage, no time-based swap capability.

## Goals / Non-Goals

**Goals:**
- Enable users to define daily (or one-time) schedule windows and target profile.
- Auto-apply target profile config to all accounts' default profiles at start time.
- Auto-restore original configs at end time, without user confirmation.
- Persist schedules across app restarts.
- Allow users to enable/disable schedules without deleting them.
- Integrate with existing background scheduler (don't create a second job processor).

**Non-Goals:**
- Complex scheduling (cron expressions, recurring patterns beyond daily). Start with daily schedules (e.g., "every weekday 09:00-17:00").
- Manual snapshot restore UI (no "undo" button for users; restore is automatic at end time).
- Nested/conditional swaps (e.g., "swap to A unless override flag B is set").
- Multi-target swaps (one schedule = one target profile; if users want multiple profiles swapped at once, they create separate schedules or use a shared "group" profile).

## Decisions

**1. Cron Representation: Store start/end times as HH:MM, compute cron expressions at runtime**
- **Decision**: Schedules table has `start_time TEXT` (HH:MM) and `end_time TEXT` (HH:MM). At app startup, convert them to two cron expressions: `MM HH * * *` (daily at start time) and `MM HH * * *` (daily at end time). Create two separate node-cron jobs.
- **Rationale**: User-friendly input (just pick times), no need for users to write cron syntax. Daily recurrence is simple and covers the stated use case (work hours, bedtime, etc.).
- **Alternative**: Store full cron expressions (more flexible, but requires UI for cron picker—complex).
- **Alternative**: One cron job that evaluates all schedules per minute (simpler job setup, but runs 1440 times/day polling—wasteful).

**2. Snapshot Storage: Store snapshot JSON in database, keyed by (schedule_id, account_id)**
- **Decision**: New table `schedule_snapshots(id, schedule_id, account_id, profile_id, snapshot_json, created_at)`. When a schedule's start time hits, insert a snapshot per account. When end time hits, read the snapshot and apply it.
- **Rationale**: Isolates snapshot data per execution, allows auditing (which profiles were restored when), survives if the app restarts mid-schedule.
- **Alternative**: Store snapshot in memory (lost on restart; risky if app crashes before end time).
- **Alternative**: Always re-read current state from NextDNS at end time instead of restoring a snapshot (doesn't match "restore to what it was" semantics; doesn't handle manual user edits between start/end).

**3. Transaction Atomicity: Snapshot all accounts in a transaction, then apply all in a transaction**
- **Decision**: At start time: `tx1 = snapshot all accounts; tx2 = apply target to all`. If tx1 succeeds but tx2 fails partway, we've snapshotted but only some accounts got the target config. Log this clearly and let the user manually correct or re-run. At end time: `tx3 = restore all from snapshot in a single tx`.
- **Rationale**: SQLite transactions prevent partial snapshots. Apply is per-profile via NextDNS API (each call can fail independently), so we can't guarantee all-or-nothing, but we can minimize exposure by logging what failed.
- **Alternative**: One big transaction that snapshots and applies together (simpler logic, but longer lock time; less useful for auditing).

**4. Schedule Evaluation: Scheduler query all schedules every minute, check if now matches start/end cron**
- **Decision**: Add a background job that runs every minute (`*/1 * * * *`) and queries `schedules WHERE enabled = TRUE`. For each, check if current time matches its start or end cron expression. If it does and we haven't already executed that operation today (tracked via a `last_executed_at` timestamp), trigger snapshot/apply/restore.
- **Rationale**: Simple polling model, handles arbitrary start/end times, `last_executed_at` prevents double-execution if cron fires twice (clock skew, etc.).
- **Alternative**: Create a new cron job per schedule (dynamic job creation/destruction). More complex to manage; node-cron doesn't have a built-in registry for querying job status.

**5. Error Handling: Log failures per account, don't fail the whole schedule**
- **Decision**: If apply fails for one account, log it, move to the next account. Snapshot failures cause the entire schedule start to fail (missing snapshot = can't restore). Apply failures are partial; restore still attempts all accounts (restoring what we can). Users must monitor logs or check the UI to see what failed.
- **Rationale**: Fault tolerance. One account's NextDNS API error shouldn't block other accounts. Snapshot is critical; if it fails, we bail early rather than apply with no way to restore.
- **Alternative**: Halt the entire schedule if any account fails (all-or-nothing, but impacts all users for one account's flakiness).

**6. Database Schema for Schedules:**
```sql
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,         -- HH:MM format
  end_time TEXT NOT NULL,           -- HH:MM format
  target_profile_id TEXT NOT NULL REFERENCES profiles(id),
  enabled BOOLEAN DEFAULT TRUE,
  last_executed_at TEXT,            -- ISO timestamp of last start_time trigger
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE schedule_snapshots (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,         -- the profile_id that was applied
  snapshot_json TEXT NOT NULL,      -- JSON blob of the profile's live config
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Risks / Trade-offs

**Risk: Clock skew or multiple app instances**
- **Mitigation**: `last_executed_at` timestamp prevents re-execution within the same day. If two instances run simultaneously, both might trigger; use DB-level unique constraint on (schedule_id, date(created_at)) for snapshots to prevent duplicates.

**Risk: User manually modifies profile between start and end time, then restore overwrites it**
- **Mitigation**: Document this behavior clearly in UI. Schedule is a declarative statement: "at this time, use this config." If user edits during the window, they're overriding the schedule; restore will re-apply the scheduled config anyway at end time.

**Risk: Long-running apply operation blocks the scheduler minute-tick**
- **Mitigation**: Schedules are per-account; apply is typically fast (<5 sec per account). If it takes longer, the next minute-tick will see the schedule already ran (via `last_executed_at`) and skip. Acceptable for home use.

**Risk: NextDNS API downtime at start/end time**
- **Mitigation**: Retry logic in apply/restore (existing sync engine handles this). If it fails, log and move on. User can manually trigger restore via UI if needed (future feature).

**Trade-off: No recurring schedules beyond daily**
- **Pro**: Simpler UI, simpler cron logic.
- **Con**: User who wants "Mon-Fri 09:00-17:00" must create one schedule and rely on us not executing it on weekends (not in scope for this feature).

## Migration Plan

1. Add `schedules` and `schedule_snapshots` tables via SQL migration.
2. Deploy updated app with new scheduler jobs and API endpoints.
3. No data migration needed; schedules table starts empty.
4. Rollback: Drop both tables (schedules are optional, not relied upon).

## Open Questions

- **Timezone**: Should schedules be in the container's local timezone, UTC, or user-configurable? (Recommend: container's timezone for simplicity; document this in the UI.)
- **One-time vs. recurring**: Should a schedule run once, daily, or both? (Recommend: daily only for MVP; one-time is a future feature.)
- **Concurrent schedules**: Can a single account have multiple active schedules at the same time? (Recommend: yes, last-applied-wins if times overlap.)
- **Manual schedule trigger**: Should users be able to manually trigger a schedule (not just at the scheduled time)? (Recommend: no for MVP; future enhancement.)
