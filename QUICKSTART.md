# Quick Start Scripts

## Development Environment

### Using Make (Recommended)
```bash
make dev-up        # Start development containers
make dev-logs      # View logs
make dev-down      # Stop containers
```

### Using NPM Scripts
```bash
npm run dev:up     # Start development containers
npm run dev:down   # Stop development containers
npm run dev:logs   # View logs
```

### Using Docker Compose Directly
```bash
docker-compose -f docker-compose.dev.yml up
docker-compose -f docker-compose.dev.yml down
```

## Debugging in VS Code

1. Start containers: `make dev-up`
2. Wait for "Nest application successfully started"
3. Press F5 in VS Code
4. Select "Attach to Backend" or "Attach to Frontend"
5. Set breakpoints and debug!

## Editing Code

- Edit files on your **host machine** (Mac/Windows/Linux)
- Changes automatically sync to containers
- Backend hot reloads on file save
- Frontend fast refreshes on file save

## Common Tasks

### View Logs
```bash
make backend-logs    # Backend only
make frontend-logs   # Frontend only
make dev-logs        # All services
```

### Restart Services
```bash
make dev-restart     # Restart all
docker-compose -f docker-compose.dev.yml restart backend  # Backend only
```

### Connect to Database
```bash
make db-connect      # Opens psql shell
# Or use VS Code PostgreSQL extension: localhost:55432
```

### Run Tests
```bash
make test            # Runs tests in Alpine containers
```

### Clean Everything
```bash
make clean           # Removes containers and volumes
```

## Troubleshooting

**Debugger not connecting?**
```bash
docker-compose -f docker-compose.dev.yml logs backend | grep -i debugger
# Should show: Debugger listening on ws://0.0.0.0:9229
```

**Hot reload not working?**
```bash
make dev-build       # Rebuild containers
```

**Port conflicts?**
```bash
lsof -i :4000        # Check what's using the port (Mac/Linux)
```

See DEV_SETUP.md for detailed documentation.
