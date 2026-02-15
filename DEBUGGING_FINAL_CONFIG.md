# Debugging Configuration - Final Setup

## Overview

This project uses **backend-only remote debugging** since Next.js is used purely for UI (React components), not as a backend.

- **Backend (NestJS)**: Remote debugging via VS Code on port 9229
- **Frontend (React)**: Client-side debugging via Chrome DevTools

## Configuration Summary

### Backend Debugging (Enabled)

#### Files Modified

**`backend/package.json`:**
```json
{
  "scripts": {
    "start:debug": "nest start --debug 0.0.0.0:9229 --watch"
  }
}
```

**`backend/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "inlineSourceMap": true,
    "inlineSources": true
  }
}
```

**`.vscode/launch.json`:**
```json
{
  "configurations": [
    {
      "name": "Attach to Backend",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}/backend",
      "remoteRoot": "/app",
      "sourceMaps": true
    },
    {
      "name": "Chrome: Debug React Components",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

**`docker-compose.dev.yml` (backend):**
```yaml
backend:
  command: npm run start:debug
  ports:
    - "4000:4000"      # API server
    - "9229:9229"      # Node.js debugger
```

### Frontend Debugging (Chrome Only)

#### Files Modified

**`frontend/package.json`:**
```json
{
  "scripts": {
    "dev": "next dev"
  }
}
```
- No `dev:debug` script needed

**`docker-compose.dev.yml` (frontend):**
```yaml
frontend:
  command: npm run dev -- --hostname 0.0.0.0
  ports:
    - "3000:3000"      # Next.js dev server only
```
- No debugger port (9230) needed

## How to Debug

### Backend (NestJS TypeScript)

1. **Start containers:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Attach debugger in VS Code:**
   - Press `Cmd+Shift+D` (Mac) or `Ctrl+Shift+D` (Windows/Linux)
   - Select "Attach to Backend"
   - Press `F5`

3. **Set breakpoint:**
   - Open `backend/src/todos/todos.controller.ts`
   - Click gutter on line 15
   - Red dot appears

4. **Trigger:**
   ```bash
   curl http://localhost:4000/todos
   ```

5. **Debug:**
   - Execution pauses at breakpoint
   - Inspect variables, step through code
   - Use Debug Console to execute code

### Frontend (React Components)

1. **Start containers** (if not already running)

2. **Launch Chrome debugger:**
   - Press `Cmd+Shift+D` / `Ctrl+Shift+D`
   - Select "Chrome: Debug React Components"
   - Press `F5`
   - Chrome opens with DevTools attached

3. **Set breakpoints:**
   - Open `frontend/pages/index.tsx`
   - Set breakpoint in React component code
   - Interact with UI to trigger breakpoint

4. **Debug:**
   - Breakpoints work in React components
   - `useState`, `useEffect`, event handlers all debuggable
   - Full Chrome DevTools available

## Why This Setup?

### Questions Answered

**Q: Why no server-side debugging for Next.js?**
A: This project uses NestJS as the backend. Next.js is only used for client-side React UI. Next.js API routes and server-side features (`getServerSideProps`, etc.) are not used, so server-side Next.js debugging isn't needed.

**Q: Can I still debug React components?**
A: Yes! Use "Chrome: Debug React Components" configuration. This launches Chrome with debugger attached - full client-side debugging capability.

**Q: What if I want to add Next.js API routes later?**
A: You can re-enable Next.js server-side debugging by:
1. Adding `dev:debug` script to `frontend/package.json`
2. Exposing port `9230` in `docker-compose.dev.yml`
3. Adding "Attach to Frontend" config to `launch.json`

See `DEBUGGING_SETUP.md` for details.

## Verification Checklist

After setup:

- [ ] Backend container shows: `Debugger listening on ws://0.0.0.0:9229`
- [ ] Frontend container shows: `ready - started server on 0.0.0.0:3000` (no debugger message)
- [ ] VS Code "Attach to Backend" connects successfully
- [ ] Breakpoint in `backend/src/**/*.ts` triggers
- [ ] Variables inspectable in VS Code
- [ ] Hot reload works (1-3 seconds)
- [ ] Chrome debugger launches with "Chrome: Debug React Components"
- [ ] Breakpoints in React components work

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT MACHINE                     │
│                                                              │
│  ┌──────────────┐         ┌────────────────────────────┐   │
│  │  VS Code     │         │  Source Code (Host)        │   │
│  │              │────────▶│  backend/src/**/*.ts       │   │
│  │  Debugger    │         │  frontend/**/*.tsx         │   │
│  │  Port 9229   │         └────────────────────────────┘   │
│  └──────┬───────┘                                           │
│         │ TCP Debug Protocol                                │
│         │                                                    │
│  ┌──────▼───────┐                                           │
│  │   Chrome     │                                           │
│  │   DevTools   │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
          │
          │ Port Forwarding
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER CONTAINERS                         │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │   Backend    │      │   Frontend   │      │    DB    │  │
│  │   NestJS     │◀────▶│   Next.js    │      │ Postgres │  │
│  │   :4000      │ HTTP │   :3000      │      │  :5432   │  │
│  │ Debug:9229 ✓ │      │ Debug: None  │      └──────────┘  │
│  └──────────────┘      └──────────────┘                     │
│  TypeScript Source     React Components                      │
│  Remote Debugging      Browser Debugging                     │
└─────────────────────────────────────────────────────────────┘
```

## Quick Commands

```bash
# Start environment
docker-compose -f docker-compose.dev.yml up

# Check backend debugger is listening
docker-compose -f docker-compose.dev.yml logs backend | grep Debugger
# Expected: Debugger listening on ws://0.0.0.0:9229

# Verify NO debugger on frontend
docker-compose -f docker-compose.dev.yml logs frontend | grep -i debug
# Expected: No output (no debugger)

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

## Debugging Cheat Sheet

| Task | Configuration | Shortcut |
|------|--------------|----------|
| Debug backend API | "Attach to Backend" | F5 |
| Debug React components | "Chrome: Debug React Components" | F5 |
| Set breakpoint | Click gutter | (mouse) |
| Continue | Continue button | F5 |
| Step over | Step over button | F10 |
| Step into | Step into button | F11 |
| Stop debugging | Stop button | Shift+F5 |

## Files Reference

| File | Purpose | Changed? |
|------|---------|----------|
| `backend/package.json` | Debug script with `0.0.0.0:9229` | ✅ Yes |
| `backend/tsconfig.json` | Inline source maps | ✅ Yes |
| `frontend/package.json` | Regular dev (no debug) | ✅ Simplified |
| `docker-compose.dev.yml` | Backend port 9229 exposed | ✅ Yes |
| `.vscode/launch.json` | Two configs (backend + chrome) | ✅ Yes |

## Related Documentation

- [README.md](./README.md) - Main usage guide (needs update)
- [DEBUGGING_SETUP.md](./DEBUGGING_SETUP.md) - Detailed config (needs update)
- [DEBUGGING_TEST_GUIDE.md](./DEBUGGING_TEST_GUIDE.md) - Testing (needs update)
