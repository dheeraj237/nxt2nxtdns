# Linked IP Management

## Purpose

Enable automatic hourly re-linking of NextDNS profiles to the current public IP, with manual override option and single-IP-per-profile constraint awareness.

## Requirements

### Requirement: Display linked IP status per profile

The system SHALL display the currently linked IP address and auto-refresh state for each profile in the profile management UI.

#### Scenario: Linked IP is current
- **WHEN** user views a profile that has a linked IP set
- **THEN** the profile card displays the linked IP (e.g., "Linked IP: 203.0.113.42") and the auto-refresh toggle state

#### Scenario: No linked IP is set
- **WHEN** user views a profile with no linked IP
- **THEN** the profile card displays "No linked IP" or similar message

#### Scenario: Auto-refresh is enabled
- **WHEN** a profile has the auto-refresh toggle enabled
- **THEN** the UI indicates this (e.g., checkmark or "Auto-refresh: on")

### Requirement: Manual link IP button

The system SHALL provide a "Link IP Now" button on each profile that immediately links that profile to the current public IP.

#### Scenario: User links profile successfully
- **WHEN** user clicks "Link IP Now" on a profile
- **THEN** the system fetches the current `linkedIpUpdateToken` from NextDNS's `/profiles/:id/setup` endpoint
- **AND** the system calls NextDNS's `link-ip.nextdns.io/:profile/:token` endpoint (with the container's egress IP as the source)
- **AND** the system updates the displayed linked IP status in the UI
- **AND** the system shows a success message (e.g., "Linked to IP: 203.0.113.42")

#### Scenario: Link IP call fails
- **WHEN** the manual link call fails (e.g., NextDNS API unreachable, invalid profile)
- **THEN** the system displays an error message to the user and does not update the linked IP status
- **AND** the system logs the failure for debugging

### Requirement: Auto-refresh toggle

The system SHALL provide a toggle switch per profile that enables/disables automatic hourly re-linking.

#### Scenario: User enables auto-refresh
- **WHEN** user toggles the "Auto-refresh linked IP" switch ON
- **THEN** the system persists that setting to the database (`auto_refresh_linked_ip = true` for that profile)
- **AND** that profile becomes eligible for the hourly cron job

#### Scenario: User disables auto-refresh
- **WHEN** user toggles the "Auto-refresh linked IP" switch OFF
- **THEN** the system updates the database (`auto_refresh_linked_ip = false`)
- **AND** that profile is no longer processed by the hourly cron job

#### Scenario: Toggle state persists across restarts
- **WHEN** a user enables auto-refresh, then restarts the app
- **THEN** the profile still has auto-refresh enabled (state persisted in database)

### Requirement: Hourly automatic re-link cron job

The system SHALL run a background job every hour (at the top of each hour, UTC) that re-links any profile with auto-refresh enabled to the current public IP.

#### Scenario: Cron job runs and re-links profile
- **WHEN** the hourly cron job executes
- **THEN** the system queries all profiles with `auto_refresh_linked_ip = true`
- **AND** for each such profile, the system fetches the latest `linkedIpUpdateToken` from `/profiles/:id/setup`
- **AND** the system calls `link-ip.nextdns.io/:profile/:token` to re-link using the container's current egress IP
- **AND** the system logs the result (success or failure) for that profile

#### Scenario: Cron job survives ISP IP rotation
- **WHEN** a profile has auto-refresh enabled and the home network's public IP changes between cron runs
- **THEN** the next cron job re-links the profile to the new IP automatically
- **AND** the user does not need to manually update the link

#### Scenario: Cron job handles multiple auto-refresh profiles
- **WHEN** multiple profiles have auto-refresh enabled
- **THEN** the cron job processes all of them in a single run
- **AND** if one profile's re-link fails, the others are still attempted (no early exit)

#### Scenario: No profiles with auto-refresh enabled
- **WHEN** the hourly cron job runs but no profiles have auto-refresh enabled
- **THEN** the cron job completes successfully with no action taken (idempotent)

### Requirement: API endpoint for manual link

The system SHALL expose a POST `/api/profiles/:id/link-ip` endpoint that immediately links the specified profile to the current IP.

#### Scenario: Successful API call
- **WHEN** the frontend calls `POST /api/profiles/:id/link-ip`
- **THEN** the system fetches `linkedIpUpdateToken` from NextDNS
- **AND** the system calls `link-ip.nextdns.io/:id/:token`
- **AND** the system returns HTTP 200 with the current linked IP and refresh timestamp

#### Scenario: Profile not found
- **WHEN** the frontend calls `POST /api/profiles/:id/link-ip` with an invalid profile ID
- **THEN** the system returns HTTP 404

#### Scenario: API call from NextDNS fails
- **WHEN** NextDNS's setup or link-ip endpoints are unreachable or return an error
- **THEN** the system returns HTTP 502 or 503 with an error message describing the NextDNS failure

### Requirement: Database schema for auto-refresh state

The system SHALL store auto-refresh preference per profile in the database.

#### Scenario: New profile inherits default state
- **WHEN** a new profile is created
- **THEN** the `auto_refresh_linked_ip` column defaults to `false`

#### Scenario: Auto-refresh state persists after update
- **WHEN** a user updates a profile's display name or other fields, and auto-refresh is enabled
- **THEN** the auto-refresh state remains unchanged (not affected by unrelated updates)

### Requirement: Constraint: Only one profile can hold the linked IP

The system SHALL NOT prevent multiple profiles from having auto-refresh enabled, but users SHALL understand that only one profile can hold the linked IP at a time (enforced by NextDNS).

#### Scenario: Multiple auto-refresh enabled (last-write-wins)
- **WHEN** multiple profiles have auto-refresh enabled
- **THEN** the cron job will re-link all of them, and the last one processed will hold the linked IP after the run completes
- **AND** the UI displays a warning or explanation: "Multiple auto-refresh profiles enabled. NextDNS enforces one IP per profile. Last re-linked profile will hold the IP."

#### Scenario: User enables auto-refresh on a second profile
- **WHEN** user enables auto-refresh on Profile B while Profile A already has it enabled
- **THEN** the system allows it (no error) but explains the constraint in a tooltip or help text
