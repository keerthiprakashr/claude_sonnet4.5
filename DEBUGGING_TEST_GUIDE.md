# Debugging Test Guide

This guide walks you through testing all debugging capabilities in this development environment.

## Configuration Notes

This setup uses **backend-only remote debugging**:

- **Backend**: Node.js debugger on `0.0.0.0:9229` (accessible from host)
- **Frontend**: Chrome DevTools (client-side debugging only)
- **Source Maps**: Inline (embedded in backend `.js` files)
- **Path Mapping**: `${workspaceFolder}/backend` ↔ `/app` (container)

**Why Chrome-only for frontend?**
- Next.js is used only for UI rendering (React components)
- Backend API is NestJS (no Next.js API routes)
- Client-side code debugs best in Chrome DevTools

For detailed configuration, see [DEBUGGING_FINAL_CONFIG.md](./DEBUGGING_FINAL_CONFIG.md)

## Prerequisites

✅ All containers running (`./verify-debugging.sh` passes all checks)
✅ VS Code open with this project
✅ Check backend logs show: `Debugger listening on ws://0.0.0.0:9229`
✅ Check frontend logs show: `ready - started server on 0.0.0.0:3000` (no debugger)

## Test 1: Backend Debugging (NestJS)

### Step-by-Step Instructions

1. **Open VS Code Run and Debug Panel**
   - Mac: `Cmd+Shift+D`
   - Windows/Linux: `Ctrl+Shift+D`

2. **Select Debug Configuration**
   - Click the dropdown at the top
   - Select **"Attach to Backend"**

3. **Start Debugging**
   - Press `F5` or click the green play button
   - Wait 1-2 seconds
   - You should see debug toolbar appear at top of VS Code
   - Status bar turns orange (debug mode active)

4. **Set a Breakpoint**
   - Open `backend/src/todos/todos.controller.ts`
   - Find line 15 (the `findAll()` method)
   - Click in the gutter (left of line number)
   - A red dot should appear

5. **Trigger the Breakpoint**
   - Open a new terminal
   - Run: `curl http://localhost:4000/todos`

6. **What Should Happen**
   - VS Code window comes to foreground
   - Line 15 is highlighted in yellow
   - Execution is paused
   - Debug toolbar is active
   - Variables panel shows `this.todosService`

7. **Inspect Variables**
   - **Variables Panel** (left sidebar):
     - Expand `this`
     - See `todosService` object
     - See all class properties

8. **Use Debug Console**
   - Open Debug Console (bottom panel)
   - Type: `this.todosService`
   - Press Enter
   - See the service object details

9. **Step Through Code**
   - Press `F10` (Step Over)
   - Execution moves to `return this.todosService.findAll()`
   - Press `F11` (Step Into)
   - Jumps into the `findAll()` method in todos.service.ts
   - Press `F5` (Continue)
   - Request completes, terminal shows JSON response

10. **Disconnect Debugger**
    - Press `Shift+F5` or click red stop button
    - Debug toolbar disappears

### Expected Results

✅ Debugger attaches successfully
✅ Breakpoint verified (solid red dot)
✅ Execution pauses at breakpoint
✅ Variables are inspectable
✅ Debug console works
✅ Step controls work

---

## Test 2: Backend Hot Reload

### Step-by-Step Instructions

1. **Ensure Backend is Running**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```
   Keep this terminal open to watch logs

2. **Edit Backend Code**
   - Open `backend/src/todos/todos.controller.ts`
   - Add a console.log at line 15:
   ```typescript
   @Get()
   findAll(): Todo[] {
     console.log('🔍 DEBUG: Testing hot reload'); // Add this line
     return this.todosService.findAll();
   }
   ```

3. **Save the File**
   - Press `Cmd+S` / `Ctrl+S`

4. **Watch the Logs**
   - Within 1-3 seconds, you should see:
   ```
   File change detected. Starting incremental compilation...
   Found 0 errors. Watching for file changes.
   Debugger listening on ws://0.0.0.0:9229/...
   Nest application successfully started
   ```

5. **Test the Change**
   ```bash
   curl http://localhost:4000/todos
   ```

6. **Verify in Logs**
   - You should see: `🔍 DEBUG: Testing hot reload`
   - Followed by the JSON response

7. **If Debugger Was Attached**
   - It automatically reconnects after restart
   - Try setting breakpoint and triggering again
   - Should pause at your new line

### Expected Results

✅ File save triggers rebuild (1-3 seconds)
✅ Server restarts automatically
✅ New code runs immediately
✅ Debugger reconnects automatically
✅ Console.log appears in logs

### Timing Benchmark

| Action | Expected Time |
|--------|---------------|
| Save file | Instant |
| Detect change | < 500ms |
| Recompile TypeScript | 1-2 seconds |
| Restart server | < 1 second |
| **Total** | **1-3 seconds** |

---

## Test 3: Frontend Debugging (React Components in Chrome)

### Step-by-Step Instructions

1. **Start Chrome Debugger**
   - Open Run and Debug panel
   - Select **"Chrome: Debug React Components"**
   - Press `F5`
   - New Chrome window opens with DevTools

2. **Set Breakpoint in React Component**
   - In VS Code, open `frontend/pages/index.tsx`
   - Set breakpoint in a React hook or event handler:
   ```tsx
   export default function Home() {
     const [todos, setTodos] = useState([]); // ← Breakpoint line 1

     useEffect(() => {
       console.log('Fetching todos'); // ← Breakpoint line 2
       fetch('http://localhost:4000/todos')
         .then(res => res.json())
         .then(setTodos);
     }, []);
   }
   ```

3. **Trigger Breakpoint**
   - In the Chrome window, navigate or refresh
   - Breakpoint should trigger in VS Code

4. **Alternative: Use Chrome DevTools Directly**
   - Open Chrome DevTools (F12)
   - Go to Sources tab
   - Find `frontend/pages/index.tsx`
   - Set breakpoint directly in Chrome
   - Refresh page

5. **Inspect React State**
   - Variables panel shows component state
   - Can see props, state, hooks
   - Use Debug Console to execute code

### Expected Results

✅ Chrome launches with debugging
✅ Breakpoints in React components work
✅ Can inspect component state
✅ Can step through React code
✅ Chrome DevTools fully functional

---

## Test 4: Frontend Hot Reload (React Fast Refresh)

### Step-by-Step Instructions

1. **Open Frontend Logs**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f frontend
   ```

2. **Open Browser**
   - Navigate to http://localhost:3000

3. **Edit React Component**
   - Open `frontend/pages/index.tsx`
   - Find the main heading
   - Change the text:
   ```tsx
   <h1>Task Manager - Hot Reload Test! 🔥</h1>
   ```

4. **Save the File**
   - Press `Cmd+S` / `Ctrl+S`

5. **Watch Browser**
   - Within 100-500ms, page updates automatically
   - **NO full page reload**
   - Component state preserved (if any)

6. **Check Logs**
   - Should see:
   ```
   event - compiled client and server successfully in 247 ms
   ```

7. **Test with State** (Advanced)
   - Add a counter to `index.tsx`:
   ```tsx
   const [count, setCount] = useState(0);

   <button onClick={() => setCount(count + 1)}>
     Count: {count}
   </button>
   ```
   - Click button a few times (e.g., count = 5)
   - Edit the button text and save
   - Count should still be 5 (state preserved!)

### Expected Results

✅ Browser updates in 100-500ms
✅ No full page reload
✅ Component state preserved
✅ Logs show compilation success

### Timing Benchmark

| Action | Expected Time |
|--------|---------------|
| Save file | Instant |
| Webpack rebuild | 100-300ms |
| Browser update | < 200ms |
| **Total** | **100-500ms** |

---

## Test 5: Full Stack Debugging (Backend + Frontend)

### Step-by-Step Instructions

Since frontend uses Chrome and backend uses VS Code, run both debuggers:

1. **Start Backend Debugger (VS Code)**
   - Select "Attach to Backend"
   - Press `F5`
   - Set breakpoint in `backend/src/todos/todos.controller.ts`:
   ```typescript
   @Get()
   findAll(): Todo[] {
     // ← Breakpoint here
     return this.todosService.findAll();
   }
   ```

2. **Start Frontend Debugger (Chrome)**
   - Select "Chrome: Debug React Components"
   - Press `F5`
   - Chrome opens

3. **Set Frontend Breakpoint**
   - In Chrome DevTools, open Sources tab
   - Find `frontend/pages/index.tsx`
   - Set breakpoint in `useEffect`:
   ```tsx
   useEffect(() => {
     // ← Breakpoint in Chrome
     fetch('http://localhost:4000/todos')
       .then(res => res.json())
       .then(setTodos);
   }, []);
   ```

4. **Trigger Flow**
   - Refresh page in Chrome
   - Chrome pauses at frontend breakpoint
   - Press `F8` (Resume) in Chrome
   - Request goes to backend
   - VS Code pauses at backend breakpoint
   - Press `F5` in VS Code
   - Response returns to frontend

5. **Inspect at Each Layer**
   - **Frontend**: Network tab shows request
   - **Backend**: Variables panel shows service data
   - **Frontend**: Console shows response data

### Expected Results

✅ Both debuggers work simultaneously
✅ Can trace request from browser to backend
✅ Can inspect at each layer
✅ Both hot reload features work

---

## Test 6: Database Debugging

### Step-by-Step Instructions

1. **Add Database Breakpoint**
   - Open `backend/src/todos/todos.service.ts`
   - Set breakpoint before database call

2. **Attach Backend Debugger**
   - Select "Attach to Backend"
   - Press F5

3. **Trigger Database Operation**
   ```bash
   curl http://localhost:4000/todos
   ```

4. **Inspect at Breakpoint**
   - Check Debug Console
   - Execute: `await this.todosRepository.find()`
   - See database query results

5. **Connect to Database Directly**
   ```bash
   docker-compose -f docker-compose.dev.yml exec db psql -U taskuser -d taskmanager
   ```

   Run queries:
   ```sql
   SELECT * FROM todos;
   \d todos
   ```

### Expected Results

✅ Can debug database service code
✅ Can execute queries in debug console
✅ Can connect to DB directly

---

## Troubleshooting Tests

### If Debugger Won't Attach

```bash
# Check debugger is listening
docker-compose -f docker-compose.dev.yml logs backend | grep Debugger

# Check port is exposed
docker-compose -f docker-compose.dev.yml port backend 9229

# Restart container
docker-compose -f docker-compose.dev.yml restart backend

# Wait 5 seconds, then try F5 again
```

### If Breakpoint is Gray (Unverified)

- Check `launch.json` has correct paths:
  ```json
  "localRoot": "${workspaceFolder}/backend",
  "remoteRoot": "/app"
  ```
- Verify inline source maps enabled in `backend/tsconfig.json`
- Rebuild: `docker-compose -f docker-compose.dev.yml up --build`

### If Hot Reload Doesn't Work

```bash
# Check logs for file change detection
docker-compose -f docker-compose.dev.yml logs backend

# Verify volume mounts
docker-compose -f docker-compose.dev.yml exec backend ls -la /app/src

# Force rebuild
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

---

## Quick Test Checklist

Use this checklist to verify all capabilities:

- [ ] Backend debugger attaches (port 9229)
- [ ] Breakpoints in backend TypeScript code work
- [ ] Variables inspection works in VS Code
- [ ] Debug console works in VS Code
- [ ] Step Over (F10) works
- [ ] Step Into (F11) works
- [ ] Backend hot reload (1-3 seconds)
- [ ] Debugger auto-reconnects after hot reload
- [ ] Chrome debugger launches
- [ ] Breakpoints in React components work
- [ ] Chrome DevTools fully functional
- [ ] Frontend fast refresh (100-500ms)
- [ ] Database connection works
- [ ] Logs are accessible

---

## Performance Benchmarks

| Operation | Expected Time | What to Measure |
|-----------|---------------|-----------------|
| Debugger attach (backend) | 1-2 seconds | F5 to debug toolbar |
| Backend hot reload | 1-3 seconds | Save to restart |
| Frontend fast refresh | 100-500ms | Save to browser update |
| Breakpoint trigger | < 100ms | Request to pause |
| Container startup | 5-10 seconds | `make dev-up` to ready |

---

## Next Steps

After completing all tests:

1. **Review Logs**: Check `make dev-logs` for any warnings
2. **Test Your Feature**: Use debugger for actual development
3. **Share with Team**: Ensure everyone can reproduce these tests
4. **Document Issues**: File any problems with container logs

## Additional Resources

- [README.md](./README.md) - Full usage guide
- [DEBUGGING_FINAL_CONFIG.md](./DEBUGGING_FINAL_CONFIG.md) - Configuration reference
- [verify-debugging.sh](./verify-debugging.sh) - Automated verification

---

**Debugging is working correctly when:**
- ✅ Backend breakpoints pause execution in VS Code
- ✅ Frontend breakpoints pause execution in Chrome
- ✅ Variables are inspectable and accurate
- ✅ Hot reload completes in < 3 seconds (backend)
- ✅ Fast refresh completes in < 500ms (frontend)
- ✅ Debuggers reconnect automatically
- ✅ No manual container restarts needed
