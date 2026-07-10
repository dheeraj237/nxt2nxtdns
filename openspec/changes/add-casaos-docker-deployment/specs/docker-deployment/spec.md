## ADDED Requirements

### Requirement: Docker image availability
The system SHALL be packaged and published as a Docker image to a public registry (Docker Hub).

#### Scenario: User pulls docker image
- **WHEN** user runs `docker pull nxttonxtdns:latest`
- **THEN** the image downloads successfully and contains the compiled Next.js app with all runtime dependencies

#### Scenario: Container starts successfully
- **WHEN** user runs `docker run -p 3000:3000 nxttonxtdns:latest`
- **THEN** the container starts, the app listens on port 3000 inside the container, and the health check passes

### Requirement: Docker Compose support
The system SHALL include a `docker-compose.yml` file in the root of the repository for easy multi-container deployment.

#### Scenario: User deploys with docker-compose
- **WHEN** user runs `docker-compose up -d` from the project root
- **THEN** the application starts, database service (if any) is initialized, and the app is accessible

#### Scenario: Volumes are properly mapped
- **WHEN** container runs via docker-compose
- **THEN** application data persists in mounted volumes across container restarts

### Requirement: Environment variables configurable
The system SHALL support configuration through environment variables in the Docker container.

#### Scenario: User sets environment variable
- **WHEN** user passes `NEXTDNS_API_KEY=xyz` at runtime
- **THEN** the application uses that API key for NextDNS API calls

#### Scenario: Default environment works
- **WHEN** user starts container without custom environment variables
- **THEN** the application starts with sensible defaults and logs which settings were applied
