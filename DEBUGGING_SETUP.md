# Debugging Setup - Configuration Reference

This document details the exact configuration used to enable TypeScript debugging in Docker containers.

## Overview

The debugging setup uses **inline source maps** to enable breakpoints in TypeScript source files while code runs in Docker containers. The debugger connects via TCP to Node.js inspector running inside containers.

## Key Configuration Changes

### 1. Backend Debugging Configuration

#### `backend/package.json`
```json
{
  "scripts": {
    "start:debug": "node node_modules/@nestjs/cli/bin/nest.js start --debug 0.0.0.0:9229 --watch"
  }
}
```

**Key points:**
- `--debug 0.0.0.0:9229` binds debugger to all interfaces (accessible from host)
- **Not** `127.0.0.1` (would only work inside container)
- `--watch` enables hot reload

#### `backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "inlineSourceMap": true,
    "inlineSources": true,
    "outDir": "./dist"
  }
}
```

**Why inline source maps:**
- Traditional source maps (`.js.map` files) only exist in container
- VS Code can't access them without mounting `dist` folder
- Mounting `dist` causes `EBUSY` errors (NestJS tries to clean it)
- **Solution:** Embed source maps directly in `.js` files
- `inlineSources: true` embeds original TypeScript code too

### 2. Frontend Debugging Configuration

#### `frontend/package.json`
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:debug": "NODE_OPTIONS='--inspect=0.0.0.0:9230' next dev"
  }
}
```

**Key points:**
- Uses `NODE_OPTIONS` to pass inspector flag to Next.js
- Port `9230` (different from backend's `9229`)
- Binds to `0.0.0.0` for external access

#### `docker-compose.dev.yml` - Frontend
```yaml
frontend:
  command: npm run dev:debug -- --hostname 0.0.0.0
  ports:
    - "3000:3000"      # Next.js dev server
    - "9230:9230"      # Node.js debugger
```

### 3. VS Code Launch Configuration

#### `.vscode/launch.json`
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Backend",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}/backend",
      "remoteRoot": "/app",
      "protocol": "inspector",
      "restart": true,
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**", "node_modules/**"]
    },
    {
      "name": "Attach to Frontend",
      "type": "node",
      "request": "attach",
      "port": 9230,
      "address": "localhost",
      "localRoot": "${workspaceFolder}/frontend",
      "remoteRoot": "/app",
      "protocol": "inspector",
      "restart": true,
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**", "node_modules/**"]
    }
  ],
  "compounds": [
    {
      "name": "Full Stack Debug",
      "configurations": ["Attach to Backend", "Attach to Frontend"],
      "stopAll": true
    }
  ]
}
```

**Key configuration details:**

| Setting | Value | Purpose |
|---------|-------|---------|
| `port` | 9229/9230 | Debugger port (must match container) |
| `address` | localhost | Connect to host's forwarded port |
| `localRoot` | `${workspaceFolder}/backend` | Source code on host |
| `remoteRoot` | `/app` | Source code in container |
| `restart` | true | Auto-reconnect after hot reload |
| `sourceMaps` | true | Enable TypeScript source mapping |

**Why this works:**
- `localRoot` → `remoteRoot` mapping tells VS Code how to translate paths
- When code runs `/app/dist/main.js`, inline source map points to `/app/src/main.ts`
- VS Code translates `/app/` to `${workspaceFolder}/backend/`
- Result: Breakpoint in local file pauses remote execution

## Common Issues & Solutions

### Issue 1: "Could not read source map" Error

**Error:**
```
Could not read source map for file:///app/dist/app.module.js:
ENOENT: no such file or directory, open '.../backend/dist/app.module.js.map'
```

**Cause:** Using separate `.js.map` files instead of inline source maps

**Solution:**
```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "inlineSourceMap": true,  // NOT "sourceMap": true
    "inlineSources": true
  }
}
```

### Issue 2: Debugger Won't Attach

**Error:** "Could not connect to debug target at localhost:9229"

**Cause:** Debugger listening on `127.0.0.1` (localhost inside container)

**Solution:**
```json
// backend/package.json
{
  "scripts": {
    "start:debug": "nest start --debug 0.0.0.0:9229 --watch"
                                        // ^^^^^^^^^ not 127.0.0.1
  }
}
```

**Verify:**
```bash
docker-compose -f docker-compose.dev.yml logs backend | grep Debugger
# Should show: Debugger listening on ws://0.0.0.0:9229/...
```

### Issue 3: Breakpoints Show as Gray (Unverified)

**Cause:** Path mapping incorrect or source maps not working

**Solutions:**
1. Check `localRoot` and `remoteRoot` in `launch.json`
2. Verify inline source maps enabled in `tsconfig.json`
3. Rebuild container: `docker-compose -f docker-compose.dev.yml up --build`

### Issue 4: EBUSY Error When Mounting dist Folder

**Error:**
```
EBUSY: resource busy or locked, rmdir '/app/dist'
```

**Cause:** Tried to mount `./backend/dist:/app/dist` in docker-compose

**Why it fails:**
- NestJS tries to clean/rebuild `dist` folder on startup
- Can't remove a mounted directory
- Causes startup failure

**Solution:**
- **Don't mount dist folder**
- Use inline source maps instead
- Let container manage its own `dist` folder

## How It Works: Debugging Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Container Starts                                              │
│    npm run start:debug                                           │
│    ↓                                                             │
│    node --enable-source-maps --inspect=0.0.0.0:9229 dist/main   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Debugger Listens                                              │
│    Debugger listening on ws://0.0.0.0:9229                       │
│    Port forwarded: container:9229 → host:9229                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. VS Code Connects                                              │
│    Press F5 → Connects to localhost:9229                         │
│    Receives list of loaded scripts from Node.js                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Source Map Resolution                                         │
│    Node.js runs: /app/dist/todos/todos.controller.js            │
│    Inline source map points to: ../src/todos/todos.controller.ts│
│    Absolute path: /app/src/todos/todos.controller.ts            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Path Translation (VS Code)                                    │
│    remoteRoot: /app → localRoot: ${workspaceFolder}/backend     │
│    /app/src/todos/todos.controller.ts                           │
│    ↓                                                             │
│    /Users/.../backend/src/todos/todos.controller.ts             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Breakpoint Match                                              │
│    User sets breakpoint in local file (line 15)                 │
│    VS Code translates to remote path                            │
│    Sends to Node.js: "break at /app/src/.../controller.ts:15"   │
│    ✓ Breakpoint verified (solid red dot)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Execution Pauses                                              │
│    Request hits endpoint → execution reaches line 15            │
│    Node.js pauses, sends state to VS Code                       │
│    VS Code highlights line 15 in yellow                         │
│    Variables, call stack, etc. visible in UI                    │
└─────────────────────────────────────────────────────────────────┘
```

## Verification Checklist

After setup, verify everything works:

- [ ] Backend container starts without errors
- [ ] Frontend container starts without errors
- [ ] Backend logs show: `Debugger listening on ws://0.0.0.0:9229`
- [ ] Frontend logs show: `Debugger listening on ws://0.0.0.0:9230`
- [ ] VS Code "Attach to Backend" connects (orange status bar)
- [ ] Breakpoint in `backend/src/**/*.ts` shows as solid red
- [ ] `curl http://localhost:4000/todos` pauses at breakpoint
- [ ] Variables panel shows TypeScript variables
- [ ] Hot reload works (edit file → auto-restart → debugger reconnects)
- [ ] Frontend debugger attaches to port 9230
- [ ] Breakpoint in `frontend/pages/api/**/*.ts` works

## Performance Notes

### Inline Source Maps Impact

**Build time:** No significant change (~same as separate .map files)
**Runtime:** Minimal overhead (<1% CPU)
**File size:** JS files are ~30% larger (source code embedded)
**Hot reload:** Same speed (1-3 seconds for backend)

### When to Use Inline vs Separate Source Maps

**Use inline source maps when:**
- ✅ Debugging in Docker containers
- ✅ Can't easily mount compiled output
- ✅ Development environment only

**Use separate source maps when:**
- ✅ Production builds (smaller files)
- ✅ Source maps uploaded to error tracking
- ✅ Local development (no containers)

## Frontend Debugging Limitations

**What you CAN debug:**
- ✅ API routes (`pages/api/**/*.ts`)
- ✅ `getServerSideProps` functions
- ✅ `getStaticProps` functions
- ✅ Server-side Next.js code

**What you CANNOT debug with Node debugger:**
- ❌ React components (client-side)
- ❌ `useEffect`, `onClick` handlers
- ❌ Browser JavaScript

**For client-side debugging:**
Use the "Chrome: Frontend" configuration in `launch.json` instead, which launches Chrome with DevTools attached.

## Security Notes

**Development mode only:**
- Debugger ports 9229/9230 should NEVER be exposed in production
- `inlineSourceMap` bloats file size - use separate maps for production
- Remove `--inspect` flag for production builds

**Docker production images:**
- Use multi-stage builds
- Production stage should NOT have debugger flags
- Don't COPY source code into production images

## References

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [VS Code Node.js Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [TypeScript Source Maps](https://www.typescriptlang.org/tsconfig#sourceMap)
- [NestJS Debugging](https://docs.nestjs.com/recipes/debugging)
