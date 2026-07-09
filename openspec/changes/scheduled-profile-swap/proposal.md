## Why

Temporal DNS rules are common: block streaming during work hours, apply parental controls on school nights, relax filters for weekend guests. Currently, users must manually switch profiles at scheduled times via NextDNS's web UI or remember to change them. Adding scheduled profile swaps allows home router DNS rules to switch automatically based on time, without manual intervention. This is a natural extension of the existing profile-clone feature's sync engine.

## What Changes

- **Schedule creation UI**: Users can create schedules with start time, end time, and target profile to apply.
- **Auto-snapshot and restore**: At start time, the system captures the current config of all accounts' default profiles, applies the target profile's config via the existing sync engine, and logs the operation. At end time, it automatically restores each account's original snapshot without prompting.
- **Background scheduler integration**: Extends the existing background scheduler (from linked-ip-manager feature) to support both hourly and schedule-based cron jobs.
- **Schedule management**: CRUD endpoints and UI to list, create, update (e.g., disable a schedule), and delete schedules.
- **Persistence**: Schedules are stored in the database and survive app restarts.

## Capabilities

### New Capabilities

- `scheduled-profile-swap`: Ability to define time-based profile configuration swaps, with automatic snapshot/restore of each account's default profile config at scheduled times.

### Modified Capabilities

- `linked-ip-management`: The background scheduler now supports multiple job types (linked-IP refresh + scheduled swaps). No breaking changes to linked-IP itself; pure extension.

## Impact

**Code changes:**
- Database: New `schedules` table with start_time, end_time, target_profile_id, enabled flag.
- Backend API: New `/api/schedules` CRUD endpoints.
- Scheduler: Extend existing scheduler to evaluate all active schedules at their times and trigger snapshot/apply/restore operations.
- Frontend: Schedule management page with add/edit/delete/toggle UI.

**Integrations:**
- Uses existing sync/diff engine (`src/lib/sync/*`) for config application.
- Uses existing scheduler infrastructure added by linked-ip-manager.

**No breaking changes** — purely additive. Schedules are opt-in and don't affect existing profile or linked-IP functionality.
