# account-onboarding

## Purpose
TBD - covers onboarding, listing, editing, and deleting NextDNS accounts within the local app.

## Requirements

### Requirement: Account list view
The system SHALL show all onboarded accounts as a vertical list (not a grid), each row displaying the account's label and a delete icon.

#### Scenario: Viewing accounts after login
- **WHEN** a user completes master-password login
- **THEN** the system displays every onboarded account as a list row with a visible delete icon

#### Scenario: No accounts onboarded yet
- **WHEN** a user completes master-password login and no accounts exist
- **THEN** the system shows an empty-state message and the add-account action remains available

### Requirement: Add account via API key
The system SHALL let a user onboard a new account by providing a label and a NextDNS API key, fetching that key's available profiles, and requiring selection of one profile as the account's default before saving.

#### Scenario: Successful onboarding
- **WHEN** a user submits a label and a valid API key, then selects one of the returned profiles as default
- **THEN** the system saves the account with its encrypted API key and the chosen profile's id as `default_profile_id`

#### Scenario: Invalid API key
- **WHEN** a user submits an API key that NextDNS rejects
- **THEN** the system shows an error and does not create the account

#### Scenario: Key with no profiles
- **WHEN** a user submits a valid API key that has zero profiles on NextDNS
- **THEN** the system SHALL NOT allow the account to be saved until at least one profile exists to select as default

### Requirement: Edit account label and default profile
The system SHALL let a user rename an existing account and change its default profile to any other profile already associated with that account.

#### Scenario: Rename an account
- **WHEN** a user edits an account's label and saves
- **THEN** the system persists the new label without altering the account's API key or default profile

#### Scenario: Change default profile
- **WHEN** a user selects a different profile belonging to the same account as the new default
- **THEN** the system updates `default_profile_id` to the selected profile's id

### Requirement: An account always has exactly one default profile
The system SHALL guarantee that every existing account has a non-null `default_profile_id` at all times, and that an account can never be reduced to zero profiles.

#### Scenario: Onboarding requires a default before saving
- **WHEN** a user is onboarding a new account
- **THEN** the system SHALL NOT create the account row until a default profile has been selected

#### Scenario: Deleting the last profile on an account
- **WHEN** a user attempts to delete an account's only remaining profile
- **THEN** the system refuses the deletion and explains that an account must always have at least one profile

#### Scenario: Deleting the current default profile
- **WHEN** a user attempts to delete a profile that is currently set as its account's default, and the account has other profiles
- **THEN** the system refuses the deletion and explains that the default must be changed to another profile first

#### Scenario: Deleting a non-default profile
- **WHEN** a user deletes a profile that is not the account's current default, on an account with more than one profile
- **THEN** the system removes that profile and leaves `default_profile_id` unchanged

### Requirement: Delete account
The system SHALL let a user remove an account from the list via its delete icon, and the confirmation prompt SHALL state that this only removes the account from this app's local database, not from NextDNS.

#### Scenario: Deleting an account
- **WHEN** a user clicks the delete icon on an account row and confirms
- **THEN** the system removes the account and its associated profile rows from the local database
- **AND** the account and its profiles remain untouched on NextDNS itself

#### Scenario: Confirmation copy
- **WHEN** the delete confirmation prompt is shown
- **THEN** its text SHALL make explicit that the action is local-only and does not affect the account on NextDNS
