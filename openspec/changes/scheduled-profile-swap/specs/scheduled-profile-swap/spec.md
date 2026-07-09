## ADDED Requirements

### Requirement: Create and manage schedules

The system SHALL allow users to create, view, update, and delete schedules that define start and end times for profile config swaps.

#### Scenario: Create a new schedule
- **WHEN** user submits a form with schedule name, start time (HH:MM), end time (HH:MM), and target profile
- **THEN** the system creates the schedule and persists it to the database
- **AND** the system returns HTTP 201 with the created schedule ID

#### Scenario: List all schedules
- **WHEN** user requests GET `/api/schedules`
- **THEN** the system returns a JSON array of all schedules with their current state (enabled/disabled)

#### Scenario: Update a schedule
- **WHEN** user PATCHes a schedule (e.g., change name, times, or target profile)
- **THEN** the system updates the schedule in the database
- **AND** if the schedule is enabled and times have changed, the scheduler recomputes its cron jobs

#### Scenario: Delete a schedule
- **WHEN** user deletes a schedule
- **THEN** the system removes it and all associated snapshots from the database
- **AND** the scheduler stops executing that schedule's jobs

#### Scenario: Enable/disable a schedule
- **WHEN** user toggles the enabled flag on a schedule
- **THEN** the system persists the flag change
- **AND** disabled schedules are not evaluated by the scheduler

### Requirement: Automatic profile config snapshot at start time

The system SHALL capture the current configuration of every account's default profile at the scheduled start time.

#### Scenario: Snapshot succeeds
- **WHEN** the scheduler evaluates a schedule at its start_time (HH:MM)
- **AND** the schedule is enabled
- **THEN** for each account in the system, the system fetches the account's default profile's current live config from NextDNS
- **AND** stores a snapshot (profile_id, full config JSON) in the schedule_snapshots table, keyed by (schedule_id, account_id)
- **AND** logs the snapshot action with timestamp

#### Scenario: Snapshot fails for one account
- **WHEN** fetching the current config from NextDNS fails for one account (API error, invalid key, network timeout)
- **THEN** the system logs the failure for that account
- **AND** continues attempting to snapshot other accounts
- **AND** proceeds to apply the target profile config (even if some accounts weren't snapshotted; those accounts cannot be restored at end time)

#### Scenario: Snapshot fails for all accounts
- **WHEN** snapshotting all accounts fails (e.g., no accounts exist, or all API calls fail)
- **THEN** the system logs an error
- **AND** does NOT proceed to apply the target profile config
- **AND** schedule execution halts with no configs changed

### Requirement: Apply target profile config to all accounts' default profiles at start time

The system SHALL apply the schedule's target profile configuration to every account's default profile.

#### Scenario: Apply succeeds
- **WHEN** after snapshots are taken, the scheduler applies the target profile's config
- **THEN** for each account, the system uses the existing sync/diff engine to copy the target profile's settings (denylist, allowlist, privacy, parental control) into that account's default profile
- **AND** logs the apply action with: account_id, target_profile_id, number of changes applied

#### Scenario: Apply fails for one account
- **WHEN** applying config to one account's profile fails (NextDNS API error, profile not found, permission denied)
- **THEN** the system logs the failure for that account
- **AND** continues applying to other accounts
- **AND** updates the schedule's last_executed_at timestamp (marking the start_time as executed, even if some accounts failed)

#### Scenario: Target profile not found
- **WHEN** the target profile specified in the schedule no longer exists (e.g., it was deleted after the schedule was created)
- **THEN** the system logs an error
- **AND** does NOT apply any configs
- **AND** still creates snapshots (so end_time restore can revert to previous state)

### Requirement: Automatic profile config restore at end time

The system SHALL restore each account's default profile to its pre-swap configuration at the scheduled end time.

#### Scenario: Restore succeeds
- **WHEN** the scheduler evaluates a schedule at its end_time (HH:MM)
- **AND** the schedule is enabled
- **AND** there exists a snapshot from that schedule's start_time run
- **THEN** for each account that has a snapshot, the system applies the snapshot config back to that account's default profile
- **AND** logs the restore action with: account_id, number of changes reverted

#### Scenario: Restore with no snapshot
- **WHEN** end_time is reached but no snapshot exists for that account
- **THEN** the system logs a warning
- **AND** skips that account (cannot restore without snapshot)
- **AND** continues restoring other accounts

#### Scenario: Restore fails for one account
- **WHEN** restoring config to one account's profile fails (NextDNS API error, network timeout, profile permission denied)
- **THEN** the system logs the failure for that account
- **AND** continues restoring other accounts
- **AND** marks the schedule as having attempted the end_time operation (prevent re-execution)

### Requirement: Prevent double-execution of start/end times

The system SHALL ensure each schedule's start and end time operations run at most once per day.

#### Scenario: Schedule fires once per day
- **WHEN** a schedule's start_time matches the current time and last_executed_at is before today's start_time
- **THEN** the system executes the start_time operation (snapshot + apply)
- **AND** updates schedule.last_executed_at to the current timestamp

#### Scenario: Schedule does not re-fire within same day
- **WHEN** a schedule's start_time matches the current time but last_executed_at is today's date
- **THEN** the system skips execution and logs that it was already executed today

#### Scenario: End time operates independently
- **WHEN** end_time arrives and the start_time operation was executed today
- **THEN** the system executes the end_time operation (restore)
- **AND** does not update last_executed_at (start_time execution already marked the day as active)

### Requirement: UI for schedule management

The system SHALL provide a user interface for creating and managing schedules.

#### Scenario: Schedule list page
- **WHEN** user navigates to the schedules page
- **THEN** the system displays a list of all schedules with: name, start_time, end_time, target profile name, enabled toggle, edit/delete buttons

#### Scenario: Create schedule form
- **WHEN** user clicks "New Schedule"
- **THEN** the system shows a form with: name (text), start_time (time picker, HH:MM), end_time (time picker, HH:MM), target_profile (dropdown of all profiles across all accounts)
- **AND** form validates that start_time < end_time and both are valid times

#### Scenario: Edit schedule form
- **WHEN** user clicks edit on a schedule
- **THEN** the system pre-fills the form with the schedule's current values
- **AND** allows all fields to be modified

#### Scenario: Toggle enable/disable
- **WHEN** user clicks the toggle switch on a schedule
- **THEN** the system immediately updates the enabled flag
- **AND** disabled schedules are grayed out in the UI

### Requirement: Constraints and edge cases

The system SHALL handle overlapping schedules and time boundary conditions gracefully.

#### Scenario: Multiple schedules with overlapping times
- **WHEN** more than one schedule is active and their times overlap (e.g., Schedule A: 09:00-17:00, Schedule B: 13:00-20:00)
- **THEN** both snapshots and applies are executed at their respective start times
- **AND** at end times, configs are restored from the most recent snapshot for that (schedule, account) pair
- **AND** the last-applied schedule wins during overlap (last restore reverts to that schedule's snapshot)

#### Scenario: Schedule with start_time == end_time
- **WHEN** a user creates a schedule with start_time = end_time (e.g., both 12:00)
- **THEN** the system rejects it and returns HTTP 400 with error "start_time must be before end_time"

#### Scenario: Schedule created after start_time but before end_time
- **WHEN** a user creates a schedule at 14:30 with start_time 09:00 and end_time 17:00 (i.e., the time window is already open for today)
- **THEN** the system creates the schedule
- **AND** the scheduler does NOT execute start_time for today (only future occurrences)
- **AND** will execute end_time if it hasn't passed yet (if 14:30 < 17:00, end_time will still run at 17:00)

#### Scenario: No accounts exist
- **WHEN** a schedule's start_time is reached but no accounts are configured in the system
- **THEN** the system logs a warning
- **AND** does nothing (no profiles to snapshot/apply)
- **AND** does not fail or mark the schedule as broken
