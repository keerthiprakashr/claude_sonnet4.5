# Development Environment Architecture

## Overview

This project implements a **hybrid containerized development environment** that combines the benefits of local development (fast editing, familiar tools) with containerized execution (consistent runtime, isolated dependencies).

## Architecture Principles

### Hybrid Development Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOST MACHINE                             │
│  ┌────────────────────┐         ┌──────────────────────────┐   │
│  │   VS Code Editor   │────────▶│   Source Code Files      │   │
│  │   - Edit files     │         │   backend/src/**/*.ts    │   │
│  │   - Set breakpoints│         │   frontend/pages/**/*.tsx│   │
│  │   - View logs      │         │                          │   │
│  └────────┬───────────┘         └───────────┬──────────────┘   │
│           │                                  │                   │
│           │ TCP 9229/9230                   │ Volume Mount      │
│           │ (Debugger)                       │ (Bind Mount)      │
└───────────┼──────────────────────────────────┼───────────────────┘
            │                                  │
            │                                  ▼
┌───────────┼──────────────────────────────────────────────────────┐
│           │               DOCKER ENVIRONMENT                      │
│           │                                                       │
│  ┌────────▼─────────┐      ┌──────────────────┐                 │
│  │  VS Code         │      │   Backend         │                 │
│  │  Debugger Client │◀────▶│   Container       │                 │
│  │                  │      │   ┌────────────┐  │                 │
│  │  localhost:9229  │      │   │ Node.js    │  │                 │
│  │  localhost:9230  │      │   │ Debugger   │  │                 │
│  └──────────────────┘      │   │ --inspect  │  │                 │
│                            │   └────────────┘  │                 │
│                            │   /app/src (mount)│                 │
│                            └───────┬───────────┘                 │
│                                    │                             │
│  ┌─────────────────┐               │ HTTP                        │
│  │   Frontend      │               │                             │
│  │   Container     │◀──────────────┘                             │
│  │   ┌──────────┐  │                                             │
│  │   │ Next.js  │  │               ┌──────────────┐              │
│  │   │ Dev      │  │               │  PostgreSQL   │              │
│  │   │ Server   │  │◀─────────────▶│  Container    │              │
│  │   └──────────┘  │   TCP 5432    │               │              │
│  │   /app (mount)  │               │  pgdata-dev   │              │
│  └─────────────────┘               │  volume       │              │
│                                    └───────────────┘              │
└───────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Two-Tier Docker Strategy

The project maintains **separate Docker configurations** for development and production:

#### Development Containers (`Dockerfile.dev`)
- **Base Image**: `node:20` (full Debian-based image ~900MB)
- **Purpose**: Rich development environment
- **Includes**:
  - Development tools (git, vim, curl)
  - Database clients (postgresql-client)
  - All npm dependencies (including devDependencies)
  - Debugging capabilities (--inspect flag)
- **Source Code**: Mounted from host (NOT copied)
- **Build Time**: ~2-3 minutes (first time)

#### Production Containers (`Dockerfile`)
- **Base Image**: `node:20-alpine` (minimal Alpine image ~150MB)
- **Purpose**: Production-like testing and deployment
- **Multi-Stage Build**:
  - Stage 1 (builder): Install deps, compile TypeScript
  - Stage 2 (runner): Copy only built artifacts, production deps
- **Source Code**: Copied and compiled into image
- **Build Time**: ~1-2 minutes
- **Size**: 6x smaller than dev images

### 2. Volume Mounting Strategy

#### Bind Mounts (Host → Container)

**Backend (`backend/src` → `/app/src`):**
```yaml
volumes:
  - ./backend/src:/app/src:cached
  - ./backend/test:/app/test:cached
  - ./backend/tsconfig.json:/app/tsconfig.json:ro
  - ./backend/tsconfig.build.json:/app/tsconfig.build.json:ro
```

**Purpose:**
- Enables hot reload: File changes on host trigger container rebuild
- Two-way sync with `:cached` flag (optimized for host writes)
- Config files mounted read-only (`:ro`) for safety

**Frontend (`frontend/pages` → `/app/pages`):**
```yaml
volumes:
  - ./frontend/pages:/app/pages:cached
  - ./frontend/components:/app/components:cached
  - ./frontend/types:/app/types:cached
```

**Purpose:**
- Enables Next.js Fast Refresh
- Selective mounting (only source dirs, not build artifacts)

#### Named Volumes (Container-Managed)

```yaml
volumes:
  - backend-node-modules:/app/node_modules
  - frontend-node-modules:/app/node_modules
  - frontend-next:/app/.next
  - pgdata-dev:/var/lib/postgresql/data
```

**Why Named Volumes for Dependencies?**

1. **Platform Isolation**: Prevents host node_modules (Mac/Windows) from conflicting with container node_modules (Linux)
2. **Performance**: Docker-managed volumes are faster than bind mounts for high I/O operations
3. **Persistence**: Dependencies survive container restarts without rebuilds
4. **Native Binaries**: Packages with native bindings (bcrypt, sharp) compile for container architecture

### 3. Debugging Architecture

#### How Remote Debugging Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEBUGGING FLOW                                │
└─────────────────────────────────────────────────────────────────┘

1. Container starts with --inspect flag:
   backend: npm run start:debug
            ↓
            node --inspect=0.0.0.0:9229 dist/main.js

2. Node.js opens WebSocket debugger on port 9229

3. Port forwarded to host:
   - 9229:9229 (backend debugger)
   - 9230:9230 (frontend debugger)

4. VS Code connects via TCP:
   {
     "type": "node",
     "request": "attach",
     "port": 9229,
     "address": "localhost"
   }

5. Source maps bridge compiled ↔ source:
   localRoot:  /Users/.../backend/src
   remoteRoot: /app/src
```

#### Launch Configuration Breakdown

**Backend Debugger:**
```json
{
  "name": "Attach to Backend",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "localRoot": "${workspaceFolder}/backend/src",
  "remoteRoot": "/app/src",
  "restart": true,
  "sourceMaps": true
}
```

- `attach`: Connects to existing process (not launching new one)
- `localRoot` ↔ `remoteRoot`: Maps host paths to container paths
- `restart: true`: Reconnects automatically when container restarts
- `sourceMaps`: Enables breakpoints in TypeScript (not compiled JS)

**Full Stack Compound:**
```json
{
  "name": "Full Stack Debug",
  "configurations": ["Attach to Backend", "Attach to Frontend"],
  "stopAll": true
}
```

- Launches both debuggers simultaneously
- Single F5 press debugs entire stack
- `stopAll: true`: Disconnects both when one stops

### 4. Network Architecture

#### Service Communication

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Frontend   │         │   Backend   │         │  Database   │
│  Container  │────────▶│  Container  │────────▶│  Container  │
│             │  HTTP   │             │  TCP    │             │
│  Next.js    │  4000   │  NestJS     │  5432   │  PostgreSQL │
│  Port: 3000 │         │  Port: 4000 │         │  Port: 5432 │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                        │
       │                       │                        │
  localhost:3000          localhost:4000          localhost:55432
       │                       │                        │
       └───────────────────────┴────────────────────────┘
                    External Access (Host)
```

#### Container-to-Container Communication

**Internal DNS (Docker Network):**
- Frontend → Backend: `http://backend:4000`
- Backend → Database: `postgresql://db:5432`
- Docker Compose creates automatic service discovery

**External Access (Host → Container):**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Database: `postgresql://localhost:55432`

**Port Mapping Strategy:**
```yaml
services:
  db:
    ports:
      - "55432:5432"  # Non-standard external port (avoids conflicts)
  backend:
    ports:
      - "4000:4000"   # Standard port (no local backend running)
      - "9229:9229"   # Debugger port
  frontend:
    ports:
      - "3000:3000"   # Standard Next.js port
      - "9230:9230"   # Debugger port (different from backend)
```

### 5. Hot Reload Mechanisms

#### Backend (NestJS)

**Technology:** TypeScript watch mode + Nodemon restart
```bash
# Command in container
npm run start:debug
↓
nest start --debug 0.0.0.0:9229 --watch
```

**Flow:**
1. File saved in VS Code on host
2. Change syncs to `/app/src` via bind mount
3. NestJS detects file change
4. Recompiles TypeScript incrementally
5. Restarts Node.js process
6. Debugger reconnects automatically (`restart: true`)
7. **Time:** ~1-3 seconds from save to restart

**Optimizations:**
- `:cached` mount option reduces filesystem sync overhead
- Incremental compilation (only changed files)
- Named volume for node_modules (faster module resolution)

#### Frontend (Next.js)

**Technology:** Next.js Fast Refresh + Webpack HMR
```bash
# Command in container
npm run dev -- --hostname 0.0.0.0
↓
next dev --hostname 0.0.0.0
```

**Flow:**
1. File saved in VS Code on host
2. Change syncs to `/app/pages` via bind mount
3. Next.js webpack detects change
4. Recompiles only affected components
5. Sends update via WebSocket to browser
6. React patches component (preserves state)
7. **Time:** ~100-500ms from save to UI update

**Optimizations:**
- `WATCHPACK_POLLING=true`: Forces polling in containers (more reliable)
- Named volume for `.next` cache (faster rebuilds)
- Selective mounting (only source dirs, not all files)

### 6. Data Persistence Strategy

#### Development Data (Separate Namespace)

```yaml
volumes:
  pgdata-dev:              # Development database data
  backend-node-modules:    # Backend dependencies
  frontend-node-modules:   # Frontend dependencies
  frontend-next:           # Next.js build cache
```

**Why Separate dev Volumes?**
- Prevents test data contamination
- Allows parallel dev/test environments
- Safe to `make clean` without losing production data

#### Volume Lifecycle

```bash
# Start fresh (destroys ALL data)
docker-compose -f docker-compose.dev.yml down -v

# Preserve data across restarts
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up

# Rebuild images (keeps volumes)
docker-compose -f docker-compose.dev.yml up --build
```

### 7. Dependency Management

#### Installation Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Adding New Package to Backend                               │
└──────────────────────────────────────────────────────────────┘

1. Edit package.json on host:
   {
     "dependencies": {
       "new-package": "^1.0.0"
     }
   }

2. Rebuild container:
   docker-compose -f docker-compose.dev.yml up --build backend

3. Dockerfile.dev executes:
   COPY package*.json ./
   RUN npm install    # Installs into backend-node-modules volume

4. Volume persists across restarts:
   - Container stops: node_modules intact
   - Container starts: node_modules available
   - No re-install needed until package.json changes
```

#### .dockerignore Strategy

**Backend `.dockerignore`:**
```
node_modules  # Never copy from host (use volume)
dist          # Rebuilt in container
*.log         # Temporary files
.env          # Secrets (use environment vars)
```

**Purpose:**
- Faster builds (less to copy)
- Prevents host artifacts in container
- Enforces clean build from package.json

## Comparison: Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Base Image** | `node:20` (900MB) | `node:20-alpine` (150MB) |
| **Dependencies** | All (dev + prod) | Production only |
| **Source Code** | Mounted from host | Copied into image |
| **Build Artifacts** | Generated in volume | Copied into image |
| **Hot Reload** | Enabled | Disabled |
| **Debugging** | Enabled (ports 9229/9230) | Disabled |
| **Dev Tools** | git, vim, psql | None |
| **Startup Time** | ~5 seconds | ~1 second |
| **Build Time** | ~2 minutes (first time) | ~1 minute |
| **Image Size** | Not relevant (not deployed) | ~150-300MB |
| **Security** | Less hardened | Minimal attack surface |

## Workflow Optimization

### Developer Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  Typical Development Session                                     │
└─────────────────────────────────────────────────────────────────┘

1. Morning: Start environment
   $ make dev-up
   ⏱  20 seconds (containers already built)

2. Edit code in VS Code
   ⏱  Instant (files on host)

3. Test changes
   - Backend: Auto-reload in 1-3s
   - Frontend: Fast refresh in 100-500ms

4. Debug issue
   - Press F5 in VS Code
   - Set breakpoint
   - Trigger request
   ⏱  <1 second to attach

5. Add dependency
   $ edit package.json
   $ make dev-build
   ⏱  30 seconds (incremental rebuild)

6. Evening: Stop environment
   $ make dev-down
   ⏱  2 seconds
   💾 All data persists (volumes intact)
```

### Common Operations

| Operation | Command | Time | Data Loss? |
|-----------|---------|------|------------|
| Start environment | `make dev-up` | 5-20s | No |
| Stop environment | `make dev-down` | 2s | No |
| Restart service | `make dev-restart` | 10s | No |
| Add dependency | `make dev-build` | 30-60s | No |
| Full rebuild | `make dev-build --force-recreate` | 2-3min | No |
| Clean everything | `make clean` | 5s | **YES** |
| View logs | `make backend-logs` | Instant | No |
| Connect to DB | `make db-connect` | 1s | No |

## Troubleshooting Guide

### Issue: Port Already in Use

**Symptom:** `Error: bind: address already in use`

**Root Cause:** Another process (local dev server, old container) using port

**Diagnosis:**
```bash
lsof -i :4000          # Mac/Linux
netstat -ano | findstr :4000  # Windows
```

**Solutions:**
1. Kill conflicting process
2. Change port in `docker-compose.dev.yml`
3. Stop old containers: `docker ps -a | grep backend`

### Issue: Hot Reload Not Working

**Symptom:** Code changes don't trigger reload

**Root Cause:** Volume mount not working or file watcher issues

**Diagnosis:**
```bash
# Check if files are mounted
docker-compose -f docker-compose.dev.yml exec backend ls -la /app/src

# Check logs for file change detection
docker-compose -f docker-compose.dev.yml logs backend | grep "change"
```

**Solutions:**
1. Verify volume mounts in `docker-compose.dev.yml`
2. For frontend, ensure `WATCHPACK_POLLING=true`
3. Restart container: `make dev-restart`
4. Nuclear option: `make dev-build --force-recreate`

### Issue: Debugger Won't Connect

**Symptom:** VS Code shows "Could not connect to debug target"

**Root Cause:** Container not exposing debug port or not started with --inspect

**Diagnosis:**
```bash
# Check if port is exposed
docker-compose -f docker-compose.dev.yml port backend 9229
# Expected: 0.0.0.0:9229

# Check if debugger is listening
docker-compose -f docker-compose.dev.yml logs backend | grep -i debugger
# Expected: Debugger listening on ws://0.0.0.0:9229
```

**Solutions:**
1. Ensure container started: `docker-compose -f docker-compose.dev.yml ps`
2. Check `command` in `docker-compose.dev.yml` includes debug flag
3. Verify `launch.json` port matches exposed port
4. Restart container: `make dev-restart`

### Issue: Module Not Found After npm install

**Symptom:** `Error: Cannot find module 'new-package'`

**Root Cause:** Package installed on host, not in container volume

**Diagnosis:**
```bash
# Check if package exists in container
docker-compose -f docker-compose.dev.yml exec backend npm list new-package
```

**Solutions:**
1. **Always rebuild after package.json changes:**
   ```bash
   make dev-build
   ```
2. **Never run npm install on host** (it won't affect container)
3. Verify volume: `backend-node-modules:/app/node_modules`

### Issue: Database Connection Refused

**Symptom:** `connect ECONNREFUSED db:5432`

**Root Cause:** Backend started before DB health check passed

**Diagnosis:**
```bash
# Check DB health
docker-compose -f docker-compose.dev.yml ps
# db should show "healthy", not "starting"

# Check logs
docker-compose -f docker-compose.dev.yml logs db | grep "ready"
# Expected: database system is ready to accept connections
```

**Solutions:**
1. Wait for health check (automatic with `depends_on`)
2. Check health check config in `docker-compose.dev.yml`:
   ```yaml
   healthcheck:
     test: ["CMD-SHELL", "pg_isready -U taskuser -d taskmanager"]
   ```
3. Restart services: `make dev-restart`

## Best Practices

### DO

✅ **Edit files on host machine** (VS Code, your IDE)
✅ **Run commands in containers** (npm scripts, testing)
✅ **Commit package.json changes** (not node_modules)
✅ **Use make commands** (consistent across team)
✅ **Attach debugger as needed** (not always running)
✅ **Check logs when issues occur** (`make backend-logs`)
✅ **Rebuild after dependency changes** (`make dev-build`)
✅ **Use named volumes for node_modules**
✅ **Stop containers when not developing** (`make dev-down`)

### DON'T

❌ **Don't run npm install on host** (won't affect container)
❌ **Don't copy node_modules into container** (use volumes)
❌ **Don't mount entire directory** (selective mounting faster)
❌ **Don't commit .env files** (use environment vars)
❌ **Don't use same ports as local services** (5432 → 55432)
❌ **Don't forget to rebuild** after package.json changes
❌ **Don't edit files in container** (changes won't persist)
❌ **Don't start multiple instances** (port conflicts)

## Security Considerations

### Development Environment

- Debugger ports exposed to localhost (not 0.0.0.0)
- Database credentials in docker-compose.dev.yml (not in code)
- `.dockerignore` prevents copying secrets
- No production data in development volumes

### Production Environment

- Alpine images (smaller attack surface)
- Multi-stage builds (no build tools in final image)
- Production deps only (no dev tools)
- Environment variables for configuration (not .env files)
- No debugger ports exposed

## Performance Metrics

### Typical Performance (Apple M1/M2)

| Metric | Development | Production |
|--------|-------------|------------|
| Container startup | 5-10 seconds | 1-2 seconds |
| Hot reload (backend) | 1-3 seconds | N/A |
| Fast refresh (frontend) | 100-500ms | N/A |
| Initial build | 2-3 minutes | 1-2 minutes |
| Rebuild (cache hit) | 10-30 seconds | 30-60 seconds |
| Image size | ~900MB | ~150-300MB |
| Memory usage (idle) | ~500MB | ~100MB |
| Memory usage (active) | ~1-2GB | ~200-500MB |

### Optimization Tips

**Faster Builds:**
- Use `.dockerignore` aggressively
- Multi-stage builds for production
- Layer caching (COPY package.json before source)

**Faster Hot Reload:**
- Selective volume mounts (not entire directory)
- `:cached` mount option on Mac
- Named volumes for dependencies

**Lower Memory:**
- Stop containers when not developing
- Use Alpine images for production
- Limit container resources in docker-compose.yml (optional)

## Conclusion

This hybrid development environment provides the best of both worlds:

**Local Development Benefits:**
- Fast file editing (native filesystem)
- Familiar tools (VS Code, Git)
- No runtime dependencies on host
- Consistent across team (everyone uses same containers)

**Container Benefits:**
- Isolated dependencies (no version conflicts)
- Consistent runtime (same Node.js, PostgreSQL versions)
- Easy setup (one `make dev-up` command)
- Production parity (Alpine images for testing)

The key insight: **Code lives on host, runtime lives in containers, connected seamlessly via volumes and network ports.**
