## ADDED Requirements

### Requirement: Save-to target selection modal
The system SHALL provide a "Save to..." action on the account detail page that opens a modal listing every onboarded account with a checkbox, plus a select-all/select-none control.

#### Scenario: Opening the modal
- **WHEN** a user clicks "Save to..." on the account detail page
- **THEN** the system opens a modal listing all onboarded accounts, each with an unchecked checkbox by default

#### Scenario: Select all or none
- **WHEN** a user activates the select-all control
- **THEN** the system checks every account's checkbox
- **AND** activating it again (or a select-none control) unchecks all of them

### Requirement: Diff preview before applying a clone
The system SHALL compute and display a per-target diff between the currently open profile's settings and each selected target account's default profile before applying any changes.

#### Scenario: Reviewing the diff
- **WHEN** a user checks one or more target accounts and confirms the selection
- **THEN** the system computes a diff for each selected target's default profile against the currently open profile
- **AND** displays all diffs to the user before any target is modified

### Requirement: Apply clone to selected accounts' default profiles
The system SHALL overwrite each selected target account's default profile's Denylist, Allowlist, Privacy, and Parental Control settings with the currently open profile's settings, only after the user confirms the diff preview.

#### Scenario: Confirming the clone
- **WHEN** a user confirms the diff preview
- **THEN** the system applies the open profile's Denylist, Allowlist, Privacy, and Parental Control settings to each selected target account's default profile
- **AND** accounts not selected in the modal remain unchanged

#### Scenario: Cloning to zero targets
- **WHEN** a user opens the "Save to..." modal, selects no accounts, and confirms
- **THEN** the system SHALL NOT apply any changes and SHALL NOT show a diff for zero targets

#### Scenario: Source account excluded from its own target list
- **WHEN** the "Save to..." modal lists accounts for a clone originating from a given account's profile
- **THEN** that source account SHALL still appear as a selectable target, since cloning a profile onto a different profile within the same account (via the profile dropdown) is a valid use case
