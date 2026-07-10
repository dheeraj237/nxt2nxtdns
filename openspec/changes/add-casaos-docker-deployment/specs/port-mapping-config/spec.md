## ADDED Requirements

### Requirement: Custom port mapping via environment
The system SHALL allow users to configure the application port through environment variables.

#### Scenario: User sets custom port
- **WHEN** user sets environment variable `PORT=8080`
- **THEN** the application listens on port 8080 instead of the default port 3000

#### Scenario: Default port is used when not specified
- **WHEN** user starts container without PORT environment variable
- **THEN** the application listens on port 3000

### Requirement: Docker Compose port configuration
The Docker Compose file SHALL support easily changing port mappings without editing the compose file.

#### Scenario: User specifies port in compose override
- **WHEN** user creates `docker-compose.override.yml` with custom port mapping
- **THEN** the application is accessible on the custom port when started with `docker-compose up`

#### Scenario: Environment file controls ports
- **WHEN** user creates `.env` file with `APP_PORT=9000`
- **THEN** the docker-compose configuration uses that port from the environment file

### Requirement: Port is displayed to user
The system SHALL log or display the configured port on startup.

#### Scenario: User sees port in logs
- **WHEN** container starts
- **THEN** logs show "Application listening on port XXXX" where XXXX is the configured port

#### Scenario: User can query running container for port
- **WHEN** user inspects container environment or logs
- **THEN** the PORT setting is visible and documented
