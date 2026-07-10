## 1. Database Schema

- [x] 1.1 Create SQL migration to add `schedules` table with columns: id (PK), name, start_time (HH:MM), end_time (HH:MM), target_profile_id (FK), enabled (BOOLEAN DEFAULT TRUE), last_executed_at (nullable), created_at
- [x] 1.2 Create SQL migration to add `schedule_snapshots` table with columns: id (PK), schedule_id (FK), account_id (FK), profile_id, snapshot_json (TEXT), created_at
- [x] 1.3 Create migration function in `src/lib/db/client.ts` to handle existing databases (same pattern as auto_refresh_linked_ip migration)
- [ ] 1.4 Test migrations locally (apply and rollback) on both fresh and existing databases

## 2. Database Layer (Repository)

- [x] 2.1 Add `ScheduleRow` and `ScheduleSnapshotRow` interfaces to `src/lib/db/repo.ts`
- [x] 2.2 Add `schedulesRepo` object with: list(), get(id), create(name, startTime, endTime, targetProfileId), update(id, patch), delete(id), updateLastExecutedAt(id)
- [x] 2.3 Add `schedule_snapshots` repository with: create(scheduleId, accountId, profileId, snapshot), getLatestByScheduleAndAccount(scheduleId, accountId), deleteByScheduleId(scheduleId), getSnapshotsForRestore(scheduleId) [returns all snapshots from today's start_time execution]
- [ ] 2.4 Write tests for repository functions (create, update, list, snapshot operations)

## 3. Backend: Scheduler Extension

- [x] 3.1 Extend `src/lib/scheduler/index.ts` to add function `getScheduleJobsFromDatabase()` that queries all enabled schedules and converts each to two cron expressions (start_time, end_time)
- [x] 3.2 Create new file `src/lib/scheduler/scheduledProfileSwapRunner.ts` with:
  - `runScheduleStart(scheduleId)` function: snapshot + apply target profile
  - `runScheduleEnd(scheduleId)` function: restore from snapshot
  - Both include comprehensive error logging per-account
- [x] 3.3 Extend the scheduler initialization in `src/lib/scheduler/index.ts` to:
  - Create a minute-tick job (`*/1 * * * *`) that queries schedules and checks if any match current time
  - Call `runScheduleStart()` or `runScheduleEnd()` as needed
  - Respect the `last_executed_at` flag to prevent double-execution
- [x] 3.4 Implement snapshot logic: fetch profile live config from NextDNS, store JSON in schedule_snapshots table
- [x] 3.5 Implement apply logic: use existing sync/diff engine to apply target profile config to all accounts' default profiles
- [x] 3.6 Implement restore logic: read snapshot, apply it back to each account's default profile
- [x] 3.7 Add comprehensive logging: `[Schedule] ...` prefixed logs for all operations (snapshot start, apply success/fail per account, restore success/fail per account)

## 4. Backend: API Routes

- [x] 4.1 Create `src/app/api/schedules/route.ts` with:
  - GET handler: return all schedules as JSON
  - POST handler: accept (name, startTime, endTime, targetProfileId), validate, create schedule, return 201 with new schedule
- [x] 4.2 Create `src/app/api/schedules/[id]/route.ts` with:
  - GET handler: return single schedule by ID
  - PATCH handler: accept (name?, startTime?, endTime?, targetProfileId?, enabled?), validate, update, return 200
  - DELETE handler: delete schedule and associated snapshots, return 204
- [x] 4.3 Validation: start_time < end_time, both are valid HH:MM format, targetProfileId exists
- [x] 4.4 Error handling: 404 if schedule not found, 400 if validation fails, 500 if DB error
- [ ] 4.5 Write integration tests for all endpoints

## 5. Frontend: Data Models and API Client

- [x] 5.1 Add `Schedule` and `ScheduleSnapshot` types to `src/lib/apiClient.ts`
- [x] 5.2 Add API client functions to the `api` object:
  - `listSchedules()`: GET `/api/schedules`
  - `createSchedule(name, startTime, endTime, targetProfileId)`: POST `/api/schedules`
  - `updateSchedule(id, patch)`: PATCH `/api/schedules/:id`
  - `deleteSchedule(id)`: DELETE `/api/schedules/:id`

## 6. Frontend: Hooks

- [x] 6.1 Create new hook `src/hooks/useSchedules.ts` with React Query:
  - `useSchedules()`: list all schedules
  - `useCreateSchedule()`: mutation to create
  - `useUpdateSchedule()`: mutation to update
  - `useDeleteSchedule()`: mutation to delete
  - All mutations invalidate the list query on success

## 7. Frontend: UI Components

- [x] 7.1 Create `src/components/ScheduleList.tsx`: displays all schedules in a table with: name, start_time, end_time, target profile, enabled toggle, edit/delete buttons
- [x] 7.2 Create `src/components/ScheduleForm.tsx`: form for create/edit with: name text input, start_time time picker, end_time time picker, target_profile dropdown
  - Pre-fill on edit mode
  - Validate start_time < end_time
  - Show loading state on submit
  - Display error messages
- [x] 7.3 Create `src/components/ScheduleModal.tsx`: modal wrapper around ScheduleForm (for create/edit flows)
- [x] 7.4 Create `src/components/ScheduleDeleteModal.tsx`: confirmation modal for delete action
- [x] 7.5 Implement enable/disable toggle: update enabled flag via PATCH mutation, show loading state, log errors

## 8. Frontend: Schedule Management Page

- [x] 8.1 Create new page `src/app/schedules/page.tsx`:
  - Display ScheduleList component
  - "New Schedule" button opens ScheduleModal in create mode
  - Clicking edit opens ScheduleModal in edit mode
  - Clicking delete opens ScheduleDeleteModal for confirmation
- [x] 8.2 Link from home page or nav to /schedules route
- [x] 8.3 Add breadcrumb/back button to return to home

## 9. Frontend: Profile Display (Show Next Scheduled Swap)

- [ ] 9.1 Optional: In the profile editor or account page, add a small badge/indicator showing the next scheduled swap that will affect this account (e.g., "Profile will swap to 'Work' at 09:00")
  - Only if a schedule with this account's default profile as target is upcoming today
  - Show start/end times
  - (Can be skipped if time constraint; low priority)

## 10. Integration Testing

- [ ] 10.1 Write end-to-end test: create a schedule, trigger start_time (mock time or wait), verify snapshots created, verify apply was called, verify configs changed
- [ ] 10.2 Write end-to-end test: trigger end_time, verify restore was called, verify configs reverted
- [ ] 10.3 Write test: handle one account failing during apply; verify others still apply and log shows partial failure
- [ ] 10.4 Write test: multiple schedules with overlapping times; verify correct snapshot/restore sequence
- [ ] 10.5 Manual test: create schedule in UI, verify it appears in list, toggle enable/disable, verify it toggles, delete and verify removal

## 11. Manual Testing & Validation

- [ ] 11.1 Create a test schedule in the UI with start/end times in the near future (or mock the system clock if possible)
- [ ] 11.2 Verify snapshot is created at start_time (check DB or logs)
- [ ] 11.3 Verify target profile config is applied to all accounts' default profiles at start_time
- [ ] 11.4 Verify each account's config is restored at end_time (check that changes from start_time are reverted)
- [ ] 11.5 Verify logs show all operations clearly: snapshot success/fail per account, apply success/fail per account, restore success/fail per account
- [ ] 11.6 Test with actual NextDNS API: verify real denylist/allowlist changes are applied and reverted
- [ ] 11.7 Test edge case: disable a schedule mid-execution (at start_time), verify it doesn't apply or restore
- [ ] 11.8 Test that double-execution is prevented (same schedule shouldn't run twice in one day)

## 12. Documentation & Deployment

- [ ] 12.1 Add README section explaining scheduled profile swaps: what they do, how to use, example scenarios (work hours, bedtime)
- [ ] 12.2 Document the schedule time format (HH:MM), timezone behavior (container local time)
- [ ] 12.3 Document constraints: start_time < end_time, daily recurrence only (no custom cron), last-applied-wins for overlapping schedules
- [ ] 12.4 Test deployment: build Docker image, run on home server, verify scheduler initializes, verify first scheduled swap executes
- [ ] 12.5 Verify no breaking changes: run existing test suite, all tests pass

## 13. Scheduler Robustness

- [ ] 13.1 Add error recovery: if snapshot fails, log and don't apply (don't proceed if critical dependency fails)
- [ ] 13.2 Add error recovery: if apply partially fails, log per-account and continue (don't halt for partial failures)
- [ ] 13.3 Add error recovery: if restore partially fails, log per-account and continue
- [ ] 13.4 Test scheduler handles missing target_profile gracefully (profile was deleted after schedule created)
- [ ] 13.5 Test scheduler handles empty accounts list (no profiles to snapshot/apply)
