# NextDNS Multi-Account Manager

A comprehensive web interface for managing multiple NextDNS accounts and profiles with ease.

## Features

- **Multi-Account Management**: Manage multiple NextDNS accounts from one dashboard
- **Profile Management**: Switch between profiles, configure DNS filters, and customize settings
- **Scheduled Profile Swaps**: Automatically switch profiles on a schedule
- **Linked IP Management**: Monitor and manage IP address links across accounts
- **Activity Logs**: Track account changes and access logs
- **Web Analytics**: View performance and usage analytics

## Installation

1. Click "Install" in CasaOS App Store
2. Set the following environment variables:
   - `MASTER_PASSWORD`: Admin password for the web interface (required)
   - `JWT_SECRET`: Secret key for session tokens (required)
   - `PORT`: Custom port (optional, default: 3000)

3. Click "Install" and wait for the container to start

## Configuration

### Custom Port

By default, the app runs on port 3000. To use a different port:
- During installation: Set the `PORT` environment variable
- After installation: Edit the docker-compose configuration via CasaOS and update the `PORT` environment variable

### Database

The app uses SQLite for data storage. All data is automatically persisted to the Docker volume.

## Accessing the Application

Once installed, access the app at:
```
http://<your-casaos-ip>:<port>
```

Default credentials: Use the `MASTER_PASSWORD` you set during installation.

## Documentation

For more information, visit the project repository:
https://github.com/dheeraj237/nxttonxtdns

## Support

For issues and feature requests, please open an issue on GitHub:
https://github.com/dheeraj237/nxttonxtdns/issues
