## Why

Currently, the NextDNS multi-account manager is only deployable via source code. Containerizing the app enables easy distribution, consistent environments, and one-click installation via CasaOS, making it accessible to home server users who want a managed UI for multi-account NextDNS management.

## What Changes

- Push application as a Docker image to a registry
- Create a standard `docker-compose.yml` for standalone Docker deployments
- Add CasaOS application manifest to enable GUI-based installation in CasaOS
- Support custom port mapping through environment variables and compose configuration

## Capabilities

### New Capabilities
- `docker-deployment`: Ability to run the app as a containerized service with Docker/Docker Compose
- `casaos-integration`: Ability to discover and install the app through CasaOS GUI marketplace
- `port-mapping-config`: Ability to configure custom host port mapping at deployment time

### Modified Capabilities
<!-- No existing specs affected by this change -->

## Impact

- **Code**: No source code changes required; deployment artifacts only
- **APIs**: No API changes
- **Dependencies**: Requires Docker runtime for deployments
- **Systems**: Adds Docker Hub (or equivalent registry) as distribution channel; integrates with CasaOS AppStore
