# profile-editor

## Purpose
TBD - covers the account detail page's profile switcher, tab bar, and per-profile editing/saving behavior.

## Requirements

### Requirement: Account detail page with profile switcher
The system SHALL open an account detail page when a user clicks an account row, showing a profile dropdown that defaults to the account's `default_profile_id` and can be switched to any other profile belonging to that account.

#### Scenario: Opening an account
- **WHEN** a user clicks an account row on the account list
- **THEN** the system navigates to that account's detail page with the dropdown pre-selected to its default profile

#### Scenario: Switching profiles within an account
- **WHEN** a user selects a different profile from the dropdown on an account with multiple profiles
- **THEN** the system loads and displays that profile's settings in place of the previous selection, without navigating away from the account detail page

### Requirement: NextDNS-mirrored tab bar
The system SHALL render tabs in this order: Security, Privacy, Parental Control, Denylist, Allowlist, Logs, Analytics, Settings. Privacy, Parental Control, Denylist, and Allowlist SHALL be fully functional; Security, Logs, Analytics, and Settings SHALL render placeholder content only.

#### Scenario: Functional tabs
- **WHEN** a user opens the Privacy, Parental Control, Denylist, or Allowlist tab
- **THEN** the system displays that section's live settings for the currently selected profile and allows edits

#### Scenario: Placeholder tabs
- **WHEN** a user opens the Security, Logs, Analytics, or Settings tab
- **THEN** the system displays placeholder content and does not attempt to fetch or persist any data for that tab

### Requirement: Denylist/allowlist active toggle
The system SHALL render an active/inactive toggle switch on every denylist and allowlist entry, calling the existing entry-PATCH endpoint immediately when toggled, independent of the page's Save action.

#### Scenario: Disabling an entry without deleting it
- **WHEN** a user toggles an entry's switch to inactive
- **THEN** the system calls the PATCH endpoint to set that entry's `active` field to false and reflects the new state immediately
- **AND** the entry remains in the list rather than being removed

#### Scenario: Toggle fails
- **WHEN** the PATCH call for a toggle fails
- **THEN** the system reverts the switch to its previous state and surfaces an error to the user

### Requirement: Save current profile only
The system SHALL provide a Save action on the account detail page that persists changes to only the currently selected account and profile.

#### Scenario: Saving edits
- **WHEN** a user edits Privacy, Parental Control, Denylist, or Allowlist settings for the selected profile and clicks Save
- **THEN** the system applies those changes to that profile only, on that profile's own account
- **AND** no other account or profile is modified
