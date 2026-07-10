## ADDED Requirements

### Requirement: CasaOS app manifest
The system SHALL include a CasaOS application manifest file that allows discovery and installation through CasaOS GUI.

#### Scenario: App appears in CasaOS marketplace
- **WHEN** user opens CasaOS App Store
- **THEN** the NextDNS Multi-Account Manager appears in the listing with description, icon, and install button

#### Scenario: User installs via CasaOS
- **WHEN** user clicks "Install" in CasaOS GUI
- **THEN** the app is downloaded, configured with default settings, and started automatically

#### Scenario: Manifest contains metadata
- **WHEN** manifest file is present in repository
- **THEN** it includes app name, description, icon URL, version, author, and Docker Compose reference

### Requirement: CasaOS configuration support
The system SHALL support CasaOS-specific environment variables and volume mounts for data persistence.

#### Scenario: CasaOS installs with persisted data
- **WHEN** user installs app via CasaOS and restarts the container
- **THEN** all previously saved configurations and data are retained

#### Scenario: Container has access to CasaOS API
- **WHEN** app is running in CasaOS
- **THEN** the app can optionally communicate with CasaOS socket for integration (if needed)
