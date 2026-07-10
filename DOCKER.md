# Docker Deployment Guide

This guide covers deploying NextDNS Multi-Account Manager using Docker and Docker Compose.

## Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0 (or `docker compose` built into newer Docker versions)
- At least 500MB of disk space for the container image
- 256MB of RAM minimum (512MB recommended)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/dheeraj237/nxt2nxtdns.git
cd nxt2nxtdns
```

### 2. Set environment variables

Create or update `.env` file:

```bash
MASTER_PASSWORD=your_secure_password_here
JWT_SECRET=$(openssl rand -hex 32)
# PORT=3000  # Optional: uncomment to use a custom port
```

Required variables:
- `MASTER_PASSWORD`: Admin password for web interface
- `JWT_SECRET`: Session token secret (generate with `openssl rand -hex 32`)

Optional variables:
- `PORT`: Custom port (default: 3000)
- `DB_PATH`: Database path inside container (default: /app/data/app.db)

### 3. Start the application

```bash
# Build and start
docker compose up --build -d

# Or, if using a pre-built image
docker compose -f docker-compose.yml up -d
```

### 4. Access the application

```
http://localhost:3000
```

Sign in with the `MASTER_PASSWORD` you set.

## Configuration

### Environment Variables

All configuration is done via environment variables. Add them to your `.env` file or pass them directly:

```bash
docker compose up -e MASTER_PASSWORD=password -d
```

### Custom Port

To expose on a different port:

```bash
PORT=8080 docker compose up -d
```

Or edit `docker-compose.yml` and change the port mapping:

```yaml
ports:
  - "8080:3000"  # Map port 8080 on host to 3000 in container
```

### Volume Management

Data is stored in a Docker named volume called `nxtdns-data`. This persists across container restarts and rebuilds.

```bash
# View volumes
docker volume ls | grep nxtdns

# Inspect volume details
docker volume inspect nxtdns-data

# Backup database
docker run --rm -v nxtdns-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/nxtdns-backup.tar.gz -C /data .

# Restore database
docker run --rm -v nxtdns-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/nxtdns-backup.tar.gz -C /data
```

## Image Tags

### Latest builds

- `dheerusuthar/nxt2nxtdns:latest` - Latest stable release
- `dheerusuthar/nxt2nxtdns:vX.Y.Z` - Specific version (e.g., v1.0.0)

### Building locally

```bash
# Build for your architecture
docker build -t nxt2nxtdns:local .

# Or build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 \
  -t nxt2nxtdns:local .
```

## Monitoring and Logs

### View logs

```bash
# Tail logs
docker compose logs -f

# View last 100 lines
docker compose logs --tail=100
```

### Health check

```bash
# Check container status
docker compose ps

# Expected output shows 'healthy' for the app service
```

### Access container shell

```bash
docker compose exec app sh
```

## Stopping and Removing

### Stop the application

```bash
docker compose down
```

### Stop and remove all data

```bash
docker compose down -v
```

This deletes the named volume and all stored data.

## Reverse Proxy Setup

The container serves plain HTTP. For HTTPS, use a reverse proxy.

### Nginx

```nginx
server {
    server_name nextdns.example.com;
    listen 80;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy

```caddyfile
nextdns.example.com {
    reverse_proxy localhost:3000
}
```

### Tailscale (private network)

```bash
# Install Tailscale on the host, then access via Tailscale IP
# Example: https://machine-name.tailnet-xxxxx.ts.net:3000
```

## Multi-Architecture Support

The Docker image is built for both `amd64` (x86) and `arm64` (ARM) architectures, so it works on:

- Standard x86 Linux servers
- Raspberry Pi 4, 5
- Mac with Apple Silicon (via Docker Desktop)
- CasaOS (supports both amd64 and arm64)

## Troubleshooting

### Port already in use

If port 3000 is already in use:

```bash
# Find what's using the port
lsof -i :3000

# Use a different port
PORT=3001 docker compose up -d
```

### Permission denied errors

```bash
# Make sure docker daemon is running
sudo systemctl start docker

# Or use sudo with docker commands
sudo docker compose up -d

# Or add your user to docker group (requires re-login)
sudo usermod -aG docker $USER
```

### Database locked error

This can happen if multiple containers try to access the same database. Ensure only one instance is running:

```bash
docker compose down
docker compose up -d
```

### Container won't start

Check the logs:

```bash
docker compose logs app
```

Common issues:
- Missing environment variables (MASTER_PASSWORD, JWT_SECRET)
- Port already in use
- Database permissions

### Slow performance

- Ensure Docker has enough resources (4GB RAM, 2 CPU cores recommended for better performance)
- Check Docker daemon logs: `journalctl -u docker`
- Use native installation instead of WSL2 on Windows if possible

## CasaOS Installation

### Prerequisites

- CasaOS >= 0.4.0 running on a home server
- Sufficient disk space for container image and data

### Installation Steps

1. Open CasaOS dashboard
2. Go to "App Store"
3. Search for "NextDNS Multi-Account Manager"
4. Click the app entry
5. Click "Install"
6. Fill in the required fields:
   - `MASTER_PASSWORD`: Your admin password
   - `JWT_SECRET`: Generate with `openssl rand -hex 32` or use a random string
   - `PORT`: (optional) Custom port, leave empty for default 3000
7. Click "Install" and wait for the container to start
8. Access the app via CasaOS dashboard or directly at the configured port

### CasaOS-specific features

- One-click installation and updates
- Automatic startup on system reboot
- Built-in reverse proxy support
- Easy environment variable management
- Integrated file manager for backups

## Development

### Build image locally

```bash
docker build -t nxt2nxtdns:dev .
```

### Run with mounted source (for development)

```bash
docker run -it --rm \
  -v $(pwd)/src:/app/src \
  -p 3000:3000 \
  -e MASTER_PASSWORD=dev \
  -e JWT_SECRET=dev \
  nxt2nxtdns:dev
```

## Security Considerations

1. **Change default passwords**: Always set a strong `MASTER_PASSWORD`
2. **Generate JWT_SECRET**: Use `openssl rand -hex 32` for a random secret
3. **Use HTTPS**: Put the app behind a reverse proxy with HTTPS
4. **Network access**: Consider using a firewall or private network
5. **API keys**: The app stores NextDNS API keys in the database. Secure the host and volume backups.
6. **Regular backups**: Backup the `nxtdns-data` volume regularly

## Resources

- [Docker documentation](https://docs.docker.com/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [Project repository](https://github.com/dheeraj237/nxt2nxtdns)
- [NextDNS API documentation](https://my.nextdns.io/docs)
