## Context

The NextDNS Multi-Account Manager is currently deployable only from source code, requiring Node.js, npm, and manual setup. Home server users who want to use the app through CasaOS (a home server management platform) need a containerized distribution method. This design addresses Docker containerization, Docker Compose orchestration, and CasaOS AppStore integration.

## Goals / Non-Goals

**Goals:**
- Enable deployment via Docker with minimal configuration
- Provide one-click installation through CasaOS GUI
- Support flexible port mapping for users with existing services
- Ensure data persistence across container restarts
- Keep setup simple for non-technical users

**Non-Goals:**
- Kubernetes manifests (not needed for home server use case)
- Multi-container orchestration beyond docker-compose
- Automatic DNS record sync to container environment
- Support for arm/v6 or other exotic architectures (focus on amd64 and arm64)

## Decisions

### Decision 1: Multi-stage Dockerfile for optimized images
**Choice:** Use multi-stage build with Node.js builder stage and minimal runtime stage

**Rationale:** 
- Reduces final image size by excluding dev dependencies and build tools
- Node.js alpine images add less than 50MB; final image will be ~300MB
- Faster layer pulls on slower connections

**Alternatives considered:**
- Single-stage Dockerfile: Simpler but larger image (~1GB with dev deps)
- Pre-built binary: Locks us to specific Node/OS versions, breaks on edge cases

### Decision 2: Use docker-compose.yml as the primary deployment method
**Choice:** Include `docker-compose.yml` in repo root; CasaOS will reference it

**Rationale:**
- docker-compose is widely understood; users can modify it independently
- CasaOS supports docker-compose files via `x-` extensions
- Centralized: one source of truth for container config

**Alternatives considered:**
- Raw docker run commands: Harder for users to maintain
- Custom orchestration: Unnecessary for home server scale

### Decision 3: CasaOS manifest as separate `.casaos/` directory
**Choice:** Store manifest files in `.casaos/` directory in repo root, with icon.png and docker-compose.casaos.yml

**Rationale:**
- CasaOS looks for `.casaos/` by convention (follows their AppStore format)
- Keeps deployment artifacts separate from source code
- Easy to update manifest independently of code

**Alternatives considered:**
- Embed manifest in root docker-compose.yml: Mixes concerns
- Separate repo for CasaOS packaging: Harder to keep in sync

### Decision 4: Environment variable for port configuration
**Choice:** Support `PORT` environment variable; default to 3000

**Rationale:**
- Aligns with Node.js/Express conventions
- Simple for users to override: `PORT=8080 docker-compose up`
- CasaOS form builder can expose this as a text input

**Alternatives considered:**
- Use docker-compose ports directly: Requires editing compose file each time
- Read from `.env` file only: Less flexible in container context

### Decision 5: Data persistence via named volumes
**Choice:** Use docker named volumes for app data; mount to `/app/data` in container

**Rationale:**
- Named volumes are portable across hosts
- Users can back up with `docker volume ls` and `docker volume inspect`
- CasaOS handles volume backup/restore automatically

**Alternatives considered:**
- Bind mounts to `/var/lib/nxttonxtdns`: Less portable, permission issues
- In-container only: Data lost on container restart

### Decision 6: Registry: Docker Hub
**Choice:** Push images to Docker Hub as `dheeraj237/nxttonxtdns:latest` and `dheeraj237/nxttonxtdns:vX.Y.Z`

**Rationale:**
- Docker Hub is the standard registry; CasaOS users expect it
- Free tier sufficient for this project
- Built-in GitHub Actions integration for CI/CD

**Alternatives considered:**
- GitHub Container Registry (ghcr.io): Equally valid, but Hub is more discoverable
- Self-hosted registry: Overkill for this project's scale

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Image size grows over time | Monitor with `docker images`; use multi-stage builds; avoid unnecessary dependencies |
| Port 3000 conflicts with user services | Document in README; default can be overridden with PORT env var |
| Database persistence breaks if volume deleted | Clear docs on `docker volume` commands; CasaOS auto-backups volumes |
| CasaOS manifest format changes | Manifest uses standard docker-compose format; worst case is manual install |
| Build pipeline fails for arm64 | Use GitHub Actions matrix strategy for multi-arch builds early |
| Users expect automatic updates | Document manual pull/restart; consider watchtower integration in future |

## Migration Plan

1. **Phase 1 - Dockerfile & Docker Compose (Week 1)**
   - Create multi-stage Dockerfile in repo root
   - Create docker-compose.yml with app, database (if needed), and volume mounts
   - Test locally with `docker build` and `docker-compose up`

2. **Phase 2 - CasaOS Integration (Week 1)**
   - Create `.casaos/docker-compose.yml` with CasaOS service metadata
   - Add icon.png (256x256, PNG format)
   - Submit to CasaOS AppStore for review

3. **Phase 3 - CI/CD Pipeline (Week 2)**
   - GitHub Actions workflow to build and push to Docker Hub on release tags
   - Build multi-arch images (amd64, arm64)
   - Push with both `latest` and version tags

4. **Phase 4 - Documentation (Week 2)**
   - Update README with Docker and CasaOS installation instructions
   - Add troubleshooting guide (port conflicts, volume management, logs)

## Open Questions

- Should we include a reverse proxy (nginx) in docker-compose for HTTPS support?
- What's the minimum Node.js version for the app? (affects base image selection)
- Should we provide a SQLite database sidecar or expect external database?
- Do we need health check endpoint in the app for Kubernetes-style probes?
