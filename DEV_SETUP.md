# Development Environment Setup

This project supports containerized development with VS Code debugging while editing code on your host machine.

## Architecture

- **Host Machine**: Edit source code with your preferred editor
- **Docker Containers**: Run Node.js runtime, PostgreSQL database, debuggers
- **VS Code**: Attach debugger to running containers via TCP

## Quick Start

### 1. Prerequisites

- Docker Desktop installed and running
- VS Code with recommended extensions (prompt will appear)
- Node.js 20+ (optional, only needed for host-side linting)

### 2. Start Development Environment

```bash
# Option A: Using VS Code tasks
# Terminal → Run Task → "Start Dev Containers"

# Option B: Using command line
docker-compose -f docker-compose.dev.yml up --build
```

Wait for services to be ready:
```
✓ db started
✓ backend started - Nest application successfully started
✓ frontend started - ready - started server on 0.0.0.0:3000
```

### 3. Verify Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/todos
- PostgreSQL: localhost:55432 (credentials in docker-compose.dev.yml)

### 4. Start Debugging

1. Open VS Code Run and Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
2. Select configuration:
   - **"Attach to Backend"** - Debug NestJS API
   - **"Attach to Frontend"** - Debug Next.js server
   - **"Full Stack Debug"** - Debug both simultaneously
3. Press F5 or click "Start Debugging"
4. Set breakpoints in your code
5. Make requests to trigger breakpoints

### 5. Edit Code

Edit files on your host machine:
- `backend/src/**/*.ts` - Changes trigger hot reload in container
- `frontend/pages/**/*.tsx` - Changes trigger Next.js fast refresh

Changes sync to containers automatically via volume mounts.

## Development Workflow

### Daily Development

1. **Start containers** (once per session):
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Edit code** on host machine using VS Code

3. **Attach debugger** when needed (F5)

4. **View logs** if needed:
   ```bash
   # Backend logs
   docker-compose -f docker-compose.dev.yml logs -f backend

   # Frontend logs
   docker-compose -f docker-compose.dev.yml logs -f frontend

   # All logs
   docker-compose -f docker-compose.dev.yml logs -f
   ```

5. **Stop containers** when done:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Debugging Tips

**Backend (NestJS):**
- Breakpoints work in `backend/src/**/*.ts`
- Debug port: 9229
- Hot reload enabled - changes restart server automatically
- Use `console.log()` or logger - output appears in container logs

**Frontend (Next.js):**
- Breakpoints work in `frontend/pages/**/*.tsx`
- Debug port: 9230
- Fast refresh enabled - UI updates without full reload
- API calls to backend go through http://localhost:4000

**Database:**
- Connect using any PostgreSQL client to `localhost:55432`
- Credentials: `taskuser` / `taskpass` / `taskmanager`
- Use VS Code PostgreSQL extension (recommended in extensions.json)

### Common Commands

```bash
# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend
docker-compose -f docker-compose.dev.yml restart frontend

# Rebuild after package.json changes
docker-compose -f docker-compose.dev.yml up --build

# Force clean rebuild
docker-compose -f docker-compose.dev.yml up --build --force-recreate

# Stop and remove everything including volumes
docker-compose -f docker-compose.dev.yml down -v
```

## Running Tests

Tests run in separate Alpine-based containers (production-like):

```bash
# Build and run tests in Alpine containers
docker-compose up --build

# Or use VS Code task: "Run Tests (Alpine Containers)"
```

**Why separate containers for tests?**
- Tests use minimal Alpine images (smaller, faster)
- Development uses full Node.js images (debugging tools)
- Ensures code works in production-like environment

## Troubleshooting

### Debugger Won't Connect

**Check container is running:**
```bash
docker-compose -f docker-compose.dev.yml ps
```

**Check debugger port is exposed:**
```bash
# Should show: 0.0.0.0:9229 -> 9229/tcp
docker-compose -f docker-compose.dev.yml port backend 9229
```

**Check logs for debugger ready message:**
```bash
docker-compose -f docker-compose.dev.yml logs backend | grep -i debugger
# Should show: Debugger listening on ws://0.0.0.0:9229
```

**Restart container:**
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

### Hot Reload Not Working

**For backend:**
- Check that `src/` files are mounted in docker-compose.dev.yml
- Verify logs show "File change detected. Starting incremental compilation..."

**For frontend:**
- Check that pages/components are mounted
- Try adding `WATCHPACK_POLLING=true` to environment (already in docker-compose.dev.yml)

**If still not working:**
```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

### Port Already in Use

If you see errors like "port is already allocated":

```bash
# Find what's using the port (example: port 4000)
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Kill the process or change port in docker-compose.dev.yml
```

### Database Connection Issues

**Backend can't connect to database:**
- Wait for db health check to pass (green checkmark in logs)
- Database takes ~5-10 seconds to initialize on first run
- Check environment variables in docker-compose.dev.yml match

**External client can't connect:**
- Use `localhost:55432` (not 5432)
- Credentials: taskuser / taskpass
- Database name: taskmanager

### Module Not Found Errors

**After adding new npm packages:**
```bash
# Rebuild container to install new dependencies
docker-compose -f docker-compose.dev.yml up --build backend
# or
docker-compose -f docker-compose.dev.yml up --build frontend
```

**Node modules from host interfering:**
- Named volumes prevent this (backend-node-modules, frontend-node-modules)
- Never mount node_modules from host
- Run `npm install` only inside container

## File Structure

```
.
├── .vscode/
│   ├── launch.json              # Debugger configurations
│   ├── tasks.json               # Docker Compose tasks
│   ├── settings.json            # Workspace settings
│   └── extensions.json          # Recommended extensions
│
├── backend/
│   ├── Dockerfile               # Production build (Alpine)
│   ├── Dockerfile.dev           # Development build (full Node.js)
│   └── src/                     # Edit here - syncs to container
│
├── frontend/
│   ├── Dockerfile               # Production build (Alpine)
│   ├── Dockerfile.dev           # Development build (full Node.js)
│   └── pages/                   # Edit here - syncs to container
│
├── docker-compose.yml           # Production-like tests (Alpine)
├── docker-compose.dev.yml       # Development environment
└── DEV_SETUP.md                 # This file
```

## Additional Resources

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Docker Compose](https://docs.docker.com/compose/)
- [NestJS Debugging](https://docs.nestjs.com/recipes/debugging)
- [Next.js Debugging](https://nextjs.org/docs/pages/building-your-application/configuring/debugging)
