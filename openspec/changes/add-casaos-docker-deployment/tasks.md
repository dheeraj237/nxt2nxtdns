## 1. Dockerfile and Multi-stage Build

- [x] 1.1 Create `Dockerfile` in repository root
- [x] 1.2 Implement builder stage with Node.js runtime
- [x] 1.3 Copy package.json and package-lock.json
- [x] 1.4 Install dependencies in builder stage
- [x] 1.5 Build Next.js app with `npm run build`
- [x] 1.6 Create runtime stage with minimal Node.js alpine image
- [x] 1.7 Copy built app and node_modules from builder stage
- [x] 1.8 Expose port 3000 (internal)
- [x] 1.9 Add health check endpoint configuration
- [x] 1.10 Set default command to start Next.js server with `node server.js` or `npm start`
- [ ] 1.11 Test Dockerfile locally: `docker build -t nxttonxtdns:latest .`
- [ ] 1.12 Verify image size (should be < 500MB)

## 2. Docker Compose Configuration

- [x] 2.1 Create `docker-compose.yml` in repository root
- [x] 2.2 Define `app` service with image reference
- [x] 2.3 Set port mapping: `3000:${PORT:-3000}` (respects PORT env var)
- [x] 2.4 Add environment variables section (API keys, database URLs)
- [x] 2.5 Configure named volume for app data at `/app/data`
- [x] 2.6 Set restart policy to `unless-stopped`
- [ ] 2.7 Add resource limits (memory, CPU) if needed
- [ ] 2.8 Test locally: `docker-compose up -d`
- [ ] 2.9 Verify app is accessible on http://localhost:3000
- [ ] 2.10 Test data persistence: stop and restart, verify data intact
- [ ] 2.11 Test port override: `PORT=8080 docker-compose up -d`

## 3. CasaOS Integration

- [x] 3.1 Create `.casaos/` directory in repository root
- [x] 3.2 Create `.casaos/docker-compose.yml` with CasaOS-specific extensions
- [x] 3.3 Add x-casaos-title, x-casaos-description, x-casaos-icon fields
- [x] 3.4 Define environment variables for CasaOS form (API key input, port, etc.)
- [ ] 3.5 Create app icon at `.casaos/icon.png` (256x256 PNG)
- [x] 3.6 Write `.casaos/description.md` with installation instructions
- [x] 3.7 Test docker-compose.yml validity: `docker-compose -f .casaos/docker-compose.yml config`
- [ ] 3.8 Prepare metadata for CasaOS AppStore submission
- [ ] 3.9 Document CasaOS manifest structure in README

## 4. Environment Variable and Port Configuration

- [x] 4.1 Update Next.js app to read PORT env var (or use 3000 default)
- [ ] 4.2 Add PORT to `.env.example` with default value
- [x] 4.3 Update docker-compose.yml to pass PORT from environment
- [x] 4.4 Add startup log message showing configured port
- [ ] 4.5 Test: Set `PORT=9000` and verify app logs and accessibility
- [ ] 4.6 Test: Start without PORT env var and verify default 3000 is used

## 5. CI/CD Pipeline (GitHub Actions)

- [x] 5.1 Create `.github/workflows/docker-build-push.yml`
- [x] 5.2 Configure workflow trigger on semantic version tags (v*.*.*)
- [x] 5.3 Set up Docker buildx for multi-arch builds (amd64, arm64)
- [ ] 5.4 Add Docker Hub credentials to GitHub secrets
- [ ] 5.5 Build image for both architectures
- [ ] 5.6 Push with tags: `latest`, and version tag (e.g., `v1.0.0`)
- [ ] 5.7 Test workflow by creating a test tag and verifying push to Docker Hub
- [ ] 5.8 Verify image pulls successfully: `docker pull dheeraj237/nxttonxtdns:latest`

## 6. Documentation

- [x] 6.1 Update `README.md` with Docker section (basic usage)
- [x] 6.2 Add CasaOS installation instructions to README
- [x] 6.3 Add port mapping examples to README
- [x] 6.4 Create `DOCKER.md` with detailed Docker instructions
- [x] 6.5 Document volume management and data backup
- [x] 6.6 Add troubleshooting section (port conflicts, permission issues)
- [x] 6.7 Document how to override docker-compose settings
- [x] 6.8 Add example commands for common scenarios

## 7. Testing and Validation

- [ ] 7.1 Test Docker image on Linux machine (amd64)
- [ ] 7.2 Test Docker image on ARM machine (arm64) or Docker desktop with arm64 emulation
- [ ] 7.3 Verify health check responds correctly
- [ ] 7.4 Test volume mount and persistence across restarts
- [ ] 7.5 Verify logs are visible with `docker logs` command
- [ ] 7.6 Test environment variable passing from docker-compose
- [ ] 7.7 Test custom port mapping scenarios
- [ ] 7.8 Verify no hardcoded paths or localhost references that break in container
- [ ] 7.9 Test with real CasaOS instance or CasaOS simulator

## 8. CasaOS AppStore Submission

- [ ] 8.1 Create GitHub issue on CasaOS AppStore repo with app metadata
- [ ] 8.2 Follow CasaOS AppStore submission guidelines
- [ ] 8.3 Provide icon, description, screenshots
- [ ] 8.4 Link to Docker Hub image and github repo
- [ ] 8.5 Wait for CasaOS team review and approval
- [ ] 8.6 Merge into CasaOS AppStore (once approved)

## 9. Release and Handoff

- [ ] 9.1 Create release notes documenting Docker/CasaOS support
- [ ] 9.2 Tag release as semantic version (e.g., v1.1.0)
- [ ] 9.3 Verify CI/CD pipeline triggers and pushes to Docker Hub
- [ ] 9.4 Test pulling released image and running it
- [ ] 9.5 Update project issue tracking (close related issues)
