# Full Stack TypeScript Task Manager

A containerized full-stack TypeScript application demonstrating professional development workflows with integrated debugging support.

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL 16
- **Development**: Docker Compose + VS Code Remote Debugging

## Quick Start

### Prerequisites

- Docker Desktop (v20.10+)
- VS Code with recommended extensions (auto-prompt on first open)
- Node.js 20+ (optional, for host-side linting)

### Start Development Environment

```bash
# Option 1: Using Make
make dev-up

# Option 2: Using Docker Compose directly
docker-compose -f docker-compose.dev.yml up
```

Wait for all services to be ready (~20 seconds):
```
✓ db       | database system is ready to accept connections
✓ backend  | Nest application successfully started
✓ frontend | ready - started server on 0.0.0.0:3000
```

### Verify Services Running

- **Frontend**: http://localhost:3000 (Next.js UI)
- **Backend API**: http://localhost:4000/todos (REST API)
- **Database**: localhost:55432 (PostgreSQL)

## Debugging Guide

This project supports **remote debugging** where you edit code on your host machine and debug it running inside Docker containers.

**Key Configuration:**
- Backend debugger: `0.0.0.0:9229` (accessible from host)
- Frontend debugger: `0.0.0.0:9230` (accessible from host)
- Source maps: Inline (embedded in `.js` files)
- Path mapping: `${workspaceFolder}/backend` ↔ `/app`

For detailed configuration, see [DEBUGGING_SETUP.md](./DEBUGGING_SETUP.md)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR COMPUTER                           │
│                                                              │
│  ┌──────────────┐         ┌────────────────────────────┐   │
│  │  VS Code     │         │  Source Code (Host)        │   │
│  │  - Edit code │────────▶│  backend/src/**/*.ts       │   │
│  │  - Debug     │         │  frontend/pages/**/*.tsx   │   │
│  └──────┬───────┘         └───────────┬────────────────┘   │
│         │                              │                     │
│         │ Attach Debugger (TCP)       │ Volume Mount        │
│         │ Port 9229, 9230             │ (Live Sync)         │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER CONTAINERS                         │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │   Backend    │      │   Frontend   │      │    DB    │  │
│  │   :4000      │◀────▶│   :3000      │      │  :5432   │  │
│  │  Debug:9229  │      │  Debug:9230  │      └──────────┘  │
│  └──────────────┘      └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Debugging the Backend (NestJS)

#### Step 1: Start the Development Environment

```bash
make dev-up
```

Wait for the message:
```
backend  | Debugger listening on ws://0.0.0.0:9229
backend  | Nest application successfully started
```

#### Step 2: Attach VS Code Debugger

1. Open the **Run and Debug** panel in VS Code:
   - Mac: `Cmd+Shift+D`
   - Windows/Linux: `Ctrl+Shift+D`

2. Select **"Attach to Backend"** from the dropdown

3. Press **F5** or click the green play button

4. You should see:
   ```
   🔗 Debugger attached to backend:9229
   ```

#### Step 3: Set Breakpoints

1. Open a backend file, e.g., `backend/src/todos/todos.controller.ts`

2. Click in the gutter (left of line numbers) to set a breakpoint:
   ```typescript
   @Get()
   findAll() {  // ← Click here to add breakpoint (red dot appears)
     return this.todosService.findAll();
   }
   ```

3. The breakpoint will show as a verified red dot

#### Step 4: Trigger the Breakpoint

Make a request to the backend API:

```bash
# From terminal
curl http://localhost:4000/todos

# Or open in browser
http://localhost:4000/todos
```

**What happens:**
1. Request hits the endpoint
2. Code execution pauses at your breakpoint
3. VS Code jumps to the line and highlights it yellow
4. Debug toolbar appears at the top
5. You can now inspect variables, step through code, etc.

#### Step 5: Debug Controls

Once paused at a breakpoint:

| Action | Shortcut | What it does |
|--------|----------|--------------|
| **Continue** | F5 | Resume execution until next breakpoint |
| **Step Over** | F10 | Execute current line, move to next |
| **Step Into** | F11 | Enter into function calls |
| **Step Out** | Shift+F11 | Exit current function |
| **Restart** | Ctrl+Shift+F5 | Restart debugger |
| **Stop** | Shift+F5 | Disconnect debugger |

#### Debug Panels

**Variables Panel** (left sidebar):
- **Local**: Variables in current scope
- **Closure**: Variables from parent scopes
- **Global**: Global variables (process, etc.)

**Watch Panel**:
- Add expressions to monitor: `this.todosService`, `req.user`, etc.
- Updates automatically as you step through code

**Call Stack Panel**:
- Shows function call hierarchy
- Click any frame to jump to that context

**Debug Console** (bottom):
- Execute code in current context
- Examples:
  ```javascript
  // Inspect variable
  this.todosService

  // Call method
  await this.todosService.findAll()

  // Check environment
  process.env.DB_HOST
  ```

#### Live Editing with Hot Reload

1. With debugger attached, edit a file:
   ```typescript
   // backend/src/todos/todos.controller.ts
   @Get()
   findAll() {
     console.log('DEBUG: Finding all todos'); // Add this line
     return this.todosService.findAll();
   }
   ```

2. Save the file (`Cmd+S` / `Ctrl+S`)

3. Watch the backend logs:
   ```
   File change detected. Starting incremental compilation...
   Compilation complete. Restarting...
   Debugger listening on ws://0.0.0.0:9229
   Nest application successfully started
   ```

4. **Debugger automatically reconnects** (configured with `"restart": true`)

5. Send another request - your new code runs with breakpoint still active

**Reload time:** 1-3 seconds from save to restart

### Debugging the Frontend (React Components)

This project uses **Chrome DevTools** for frontend debugging since Next.js is used only for UI rendering, not as a backend.

**Note:** The backend API is NestJS (not Next.js API routes), so there's no server-side Next.js code to debug.

#### Step 1: Ensure Containers Are Running

```bash
make dev-up
```

Wait for:
```
frontend | ready - started server on 0.0.0.0:3000
```

#### Step 2: Launch Chrome Debugger

1. Open **Run and Debug** panel (`Cmd+Shift+D` / `Ctrl+Shift+D`)

2. Select **"Chrome: Debug React Components"** from the dropdown

3. Press **F5**

4. A new Chrome window opens with DevTools attached

#### Step 3: Debug React Components

Set breakpoints in React components:

```tsx
// frontend/pages/index.tsx
export default function Home() {
  const [todos, setTodos] = useState([]); // ← Breakpoint here

  useEffect(() => {
    // ← Or breakpoint here
    fetch('http://localhost:4000/todos')
      .then(res => res.json())
      .then(setTodos);
  }, []);

  const handleAddTodo = () => {
    // ← Breakpoints work in event handlers
    console.log('Adding todo');
  };

  return <div>...</div>;
}
```

**What you can debug:**
- ✅ React component rendering
- ✅ `useState`, `useEffect` hooks
- ✅ Event handlers (`onClick`, etc.)
- ✅ API calls from browser
- ✅ All client-side JavaScript

**What runs in the browser:**
- Everything in `frontend/pages/**/*.tsx`
- Everything in `frontend/components/**/*.tsx`
- All React code

#### Step 4: Using Chrome DevTools

Once Chrome opens:

1. **Sources tab**: See all loaded TypeScript files
2. **Set breakpoints**: Click line numbers in Chrome DevTools
3. **Console**: Execute code in current context
4. **Network**: Inspect API calls to backend
5. **React DevTools**: Inspect component tree (if installed)

#### Step 5: React Fast Refresh (Hot Reload)

1. Edit a React component:
   ```tsx
   // frontend/pages/index.tsx
   export default function Home() {
     return (
       <div>
         <h1>Task Manager</h1>  {/* Edit this */}
         <p>Updated in real-time!</p>  {/* Add this */}
       </div>
     );
   }
   ```

2. Save the file

3. **Browser updates instantly** (100-500ms) without full refresh

4. **Component state is preserved** (unless export changes)

5. Check frontend logs:
   ```
   event - compiled client and server successfully in 247 ms
   ```

### Debugging Full Request Flow (Backend + Frontend)

Debug both backend and frontend to trace requests end-to-end.

#### Setup

Since frontend uses Chrome DevTools and backend uses VS Code, you'll run both debuggers separately:

1. **Start Backend Debugger (VS Code)**:
   - Select "Attach to Backend"
   - Press `F5`
   - Set breakpoint in `backend/src/todos/todos.controller.ts`

2. **Start Frontend Debugger (Chrome)**:
   - Select "Chrome: Debug React Components"
   - Press `F5`
   - Chrome opens with DevTools

#### Example: Debug a Full Request Flow

**Scenario:** User clicks button → Frontend calls API → Backend queries DB

1. **Set frontend breakpoint in Chrome DevTools:**
   - Open Chrome Sources tab
   - Find `frontend/pages/index.tsx`
   - Set breakpoint in event handler:
   ```tsx
   async function handleAddTodo() {
     const response = await fetch('http://localhost:4000/todos', {
       // ← Breakpoint in Chrome DevTools
       method: 'POST',
       body: JSON.stringify({ title: 'New Todo' })
     });
   }
   ```

2. **Set backend breakpoint in VS Code:**
   ```typescript
   // backend/src/todos/todos.controller.ts
   @Post()
   create(@Body() createTodoDto: CreateTodoDto) {
     // ← Breakpoint in VS Code
     return this.todosService.create(createTodoDto);
   }
   ```

3. **Trigger the flow:**
   - In Chrome, click "Add Todo" button
   - Chrome pauses at frontend breakpoint
   - Press **F8** (Resume) in Chrome
   - VS Code pauses at backend breakpoint
   - Inspect request payload in VS Code
   - Press **F5** (Continue) in VS Code
   - Response returns to frontend

4. **Inspect at each layer:**
   - **Frontend (Chrome)**: Check request format, headers in Network tab
   - **Backend (VS Code)**: Check parsed DTO, validation in Variables panel
   - **Service (VS Code)**: Step into to check database query
   - **Return (Chrome)**: Check response in Console

## Common Debugging Scenarios

### Scenario 1: API Returns Unexpected Data

**Problem:** Frontend displays wrong data

**Debug approach:**

1. Set breakpoint in backend controller:
   ```typescript
   @Get(':id')
   findOne(@Param('id') id: string) {
     const result = this.todosService.findOne(+id);
     // ← Breakpoint here - inspect result
     return result;
   }
   ```

2. Make request from frontend or curl

3. Inspect `result` in Variables panel

4. If wrong, step into service method:
   ```typescript
   async findOne(id: number) {
     // ← Step into this
     return this.todosRepository.findOne({ where: { id } });
   }
   ```

5. Check database query in Debug Console:
   ```javascript
   // Execute in debug console
   await this.todosRepository.find()
   ```

### Scenario 2: Request Never Reaches Backend

**Problem:** Frontend makes request but backend doesn't respond

**Debug approach:**

1. Check network in browser DevTools:
   - Open browser DevTools (F12)
   - Network tab
   - Make request
   - Check status: CORS error? 404? Timeout?

2. Set breakpoint at earliest point in backend:
   ```typescript
   // backend/src/main.ts
   async function bootstrap() {
     const app = await NestFactory.create(AppModule);
     app.enableCors(); // ← Breakpoint here to verify startup
   }
   ```

3. Check if request URL is correct:
   ```typescript
   // Frontend - verify URL
   fetch('http://localhost:4000/todos') // Should be 4000, not 3000
   ```

4. Check container networking:
   ```bash
   # From host
   curl http://localhost:4000/todos

   # Check backend logs
   make backend-logs
   ```

### Scenario 3: Database Query Fails

**Problem:** Error: "relation does not exist" or connection refused

**Debug approach:**

1. Set breakpoint in service before query:
   ```typescript
   async findAll() {
     console.log('DB Host:', process.env.DB_HOST);
     // ← Breakpoint here
     return this.todosRepository.find();
   }
   ```

2. Check environment variables in Debug Console:
   ```javascript
   process.env.DB_HOST  // Should be 'db', not 'localhost'
   process.env.DB_PORT  // Should be '5432'
   process.env.DB_NAME  // Should be 'taskmanager'
   ```

3. Test database connection:
   ```bash
   # Connect to database directly
   make db-connect

   # List tables
   \dt

   # Check tables exist
   SELECT * FROM todos;
   ```

4. Check logs for migration errors:
   ```bash
   make backend-logs | grep -i migration
   make db-logs | grep -i error
   ```

### Scenario 4: Environment Variable Not Set

**Problem:** `process.env.SOMETHING` is undefined

**Debug approach:**

1. Set breakpoint where env var is used

2. Check value in Debug Console:
   ```javascript
   process.env.API_KEY  // undefined?
   ```

3. Verify in `docker-compose.dev.yml`:
   ```yaml
   services:
     backend:
       environment:
         - API_KEY=your-key-here  # Add this
   ```

4. **Restart container** (env vars loaded at startup):
   ```bash
   make dev-restart
   ```

5. Reconnect debugger and verify:
   ```javascript
   process.env.API_KEY  // Should now have value
   ```

## Development Workflow

### Typical Daily Workflow

```bash
# 1. Morning: Start environment (once per day)
make dev-up

# 2. Work in VS Code
# - Edit backend/src/**/*.ts
# - Edit frontend/pages/**/*.tsx
# - Changes auto-reload (1-3 seconds)

# 3. Debug when needed
# - Press F5 in VS Code
# - Set breakpoints
# - Trigger requests

# 4. View logs if needed
make backend-logs   # Backend only
make frontend-logs  # Frontend only
make dev-logs       # All services

# 5. Evening: Stop environment
make dev-down
```

### After Adding Dependencies

**Backend:**
```bash
# 1. Edit package.json
code backend/package.json

# 2. Rebuild container
make dev-build

# 3. Restart debugger (F5)
```

**Frontend:**
```bash
# 1. Edit package.json
code frontend/package.json

# 2. Rebuild container
docker-compose -f docker-compose.dev.yml up --build frontend

# 3. Restart debugger (F5)
```

### Database Operations

**Connect to database:**
```bash
make db-connect
```

**Run queries:**
```sql
-- List all tables
\dt

-- View todos
SELECT * FROM todos;

-- Insert test data
INSERT INTO todos (title, completed) VALUES ('Test Todo', false);

-- Exit
\q
```

**Reset database:**
```bash
# Stop and remove volumes
make clean

# Restart (creates fresh DB)
make dev-up
```

## Troubleshooting

### Debugger Won't Connect

**Symptoms:**
- VS Code shows "Could not connect to debug target"
- Timeout error after 10 seconds

**Solutions:**

1. **Check containers are running:**
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   # All should show "Up"
   ```

2. **Check debugger is listening:**
   ```bash
   make backend-logs | grep -i debugger
   # Should show: Debugger listening on ws://0.0.0.0:9229
   ```

3. **Check port is exposed:**
   ```bash
   docker-compose -f docker-compose.dev.yml port backend 9229
   # Should show: 0.0.0.0:9229
   ```

4. **Restart container:**
   ```bash
   make dev-restart
   # Wait 10 seconds, then try F5 again
   ```

5. **Check launch.json:**
   ```json
   // .vscode/launch.json
   {
     "port": 9229,  // Should match backend port
     "address": "localhost"  // Not 0.0.0.0
   }
   ```

### Breakpoints Not Triggering

**Symptoms:**
- Breakpoint shows as gray circle (unverified)
- Code doesn't pause when hit

**Solutions:**

1. **Check source maps are enabled:**
   ```json
   // .vscode/launch.json
   {
     "sourceMaps": true  // Must be true
   }
   ```

2. **Verify path mappings:**
   ```json
   {
     "localRoot": "${workspaceFolder}/backend",
     "remoteRoot": "/app"
     // Maps host backend folder to container /app
   }
   ```

3. **Verify inline source maps enabled:**
   ```json
   // backend/tsconfig.json
   {
     "compilerOptions": {
       "inlineSourceMap": true,
       "inlineSources": true
     }
   }
   ```

4. **Check file is mounted:**
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend ls -la /app/src/todos
   # Should list your files
   ```

5. **Rebuild and restart:**
   ```bash
   make dev-build
   # Then F5 to reattach debugger
   ```

### Source Map Errors

**Symptoms:**
- Debug Console shows: `Could not read source map for file:///app/dist/...`
- Error mentions `.map` file not found on host

**Cause:**
Using separate source map files instead of inline source maps

**Solution:**

1. **Update tsconfig.json:**
   ```json
   // backend/tsconfig.json
   {
     "compilerOptions": {
       "inlineSourceMap": true,  // NOT "sourceMap": true
       "inlineSources": true      // Embed source code too
     }
   }
   ```

2. **Rebuild container:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build backend
   ```

3. **Why inline source maps:**
   - Separate `.map` files only exist in container `/app/dist/`
   - VS Code can't access them without mounting `dist` folder
   - Mounting `dist` causes `EBUSY` errors (NestJS cleans it on startup)
   - Inline maps embed source maps directly in `.js` files
   - Debugger reads them via Node.js inspector protocol

For more details, see [DEBUGGING_SETUP.md](./DEBUGGING_SETUP.md)

### Hot Reload Not Working

**Symptoms:**
- Edit file, save, but container doesn't restart
- No "File change detected" message in logs

**Solutions:**

1. **Check logs for file change detection:**
   ```bash
   make backend-logs
   # Save a file, should see: "File change detected. Starting incremental compilation..."
   ```

2. **Verify volume mounts:**
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend ls -la /app/src
   # Should show modified timestamp matching your edit
   ```

3. **For frontend, check WATCHPACK_POLLING:**
   ```yaml
   # docker-compose.dev.yml
   frontend:
     environment:
       - WATCHPACK_POLLING=true  # Should be set
   ```

4. **Force rebuild:**
   ```bash
   make dev-build --force-recreate
   ```

### Port Conflicts

**Symptoms:**
- `Error: bind: address already in use`

**Solutions:**

1. **Find what's using the port:**
   ```bash
   # Mac/Linux
   lsof -i :4000

   # Windows
   netstat -ano | findstr :4000
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Or change port in docker-compose.dev.yml:**
   ```yaml
   services:
     backend:
       ports:
         - "4001:4000"  # Change host port to 4001
   ```

## Project Structure

```
.
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── todos/
│   │   │   ├── todos.controller.ts    # REST endpoints
│   │   │   ├── todos.service.ts       # Business logic
│   │   │   └── todos.entity.ts        # Database model
│   │   └── main.ts                     # Application entry
│   ├── Dockerfile                      # Production build
│   └── Dockerfile.dev                  # Development build
│
├── frontend/                   # Next.js frontend
│   ├── pages/
│   │   ├── index.tsx                   # Home page
│   │   └── api/                        # API routes
│   ├── components/                     # React components
│   ├── Dockerfile                      # Production build
│   └── Dockerfile.dev                  # Development build
│
├── .vscode/
│   ├── launch.json                     # Debugger configs ⭐
│   ├── tasks.json                      # Build tasks
│   └── settings.json                   # Workspace settings
│
├── docker-compose.dev.yml              # Development environment ⭐
├── docker-compose.yml                  # Production environment
├── Makefile                            # Helper commands ⭐
└── README.md                           # This file
```

## Make Commands Reference

| Command | What it does |
|---------|-------------|
| `make dev-up` | Start development containers |
| `make dev-down` | Stop development containers |
| `make dev-restart` | Restart all containers |
| `make dev-logs` | View all logs (follow mode) |
| `make dev-build` | Rebuild and start containers |
| `make backend-logs` | View backend logs only |
| `make frontend-logs` | View frontend logs only |
| `make db-logs` | View database logs only |
| `make db-connect` | Open PostgreSQL shell |
| `make test` | Run tests in production containers |
| `make clean` | Remove all containers and volumes |

## VS Code Debug Configurations

| Configuration | What it debugs | Where |
|--------------|----------------|-------|
| **Attach to Backend** | NestJS TypeScript code | VS Code (Port 9229) |
| **Chrome: Debug React Components** | React client-side code | Chrome DevTools |

**Note:** Frontend debugging uses Chrome DevTools, not VS Code remote debugging, since Next.js is used only for UI rendering (not as a backend).

## Additional Resources

- [DEV_SETUP.md](./DEV_SETUP.md) - Detailed setup and troubleshooting
- [QUICKSTART.md](./QUICKSTART.md) - Quick reference commands
- [DEV_ENV_ARCHITECTURE.md](./DEV_ENV_ARCHITECTURE.md) - Architecture deep dive
- [VS Code Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

**Issues?**
1. Check [DEV_SETUP.md](./DEV_SETUP.md) troubleshooting section
2. Check container logs: `make dev-logs`
3. Try clean rebuild: `make clean && make dev-build`

## License

MIT
