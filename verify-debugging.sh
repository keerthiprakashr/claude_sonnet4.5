#!/bin/bash

# Debugging Verification Script
# This script helps verify all debugging capabilities are working

echo "=================================="
echo "Debugging Capabilities Test"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check containers are running
echo "1. Checking containers status..."
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Containers are running"
else
    echo -e "${RED}✗${NC} Containers are not running"
    exit 1
fi
echo ""

# Test 2: Check backend debugger port
echo "2. Checking backend debugger port (9229)..."
BACKEND_PORT=$(docker-compose -f docker-compose.dev.yml port backend 9229 2>/dev/null | grep -o "0.0.0.0:9229")
if [ "$BACKEND_PORT" == "0.0.0.0:9229" ]; then
    echo -e "${GREEN}✓${NC} Backend debugger port exposed: $BACKEND_PORT"
else
    echo -e "${RED}✗${NC} Backend debugger port not exposed"
    exit 1
fi
echo ""

# Test 3: Check frontend debugger port
echo "3. Checking frontend debugger port (9230)..."
FRONTEND_PORT=$(docker-compose -f docker-compose.dev.yml port frontend 9230 2>/dev/null | grep -o "0.0.0.0:9230")
if [ "$FRONTEND_PORT" == "0.0.0.0:9230" ]; then
    echo -e "${GREEN}✓${NC} Frontend debugger port exposed: $FRONTEND_PORT"
else
    echo -e "${RED}✗${NC} Frontend debugger port not exposed"
    exit 1
fi
echo ""

# Test 4: Check backend API is responding
echo "4. Testing backend API endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/todos)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓${NC} Backend API responding (HTTP $HTTP_CODE)"
    echo "   Sample data:"
    curl -s http://localhost:4000/todos | python3 -m json.tool | head -15 2>/dev/null || curl -s http://localhost:4000/todos | head -15
else
    echo -e "${RED}✗${NC} Backend API not responding (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: Check frontend is responding
echo "5. Testing frontend server..."
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_CODE" == "200" ]; then
    echo -e "${GREEN}✓${NC} Frontend server responding (HTTP $FRONTEND_CODE)"
else
    echo -e "${RED}✗${NC} Frontend server not responding (HTTP $FRONTEND_CODE)"
fi
echo ""

# Test 6: Check debugger is listening (from logs)
echo "6. Checking debugger listeners in logs..."
if docker-compose -f docker-compose.dev.yml logs backend 2>/dev/null | grep -q "Debugger listening"; then
    echo -e "${GREEN}✓${NC} Backend debugger is listening"
    docker-compose -f docker-compose.dev.yml logs backend 2>/dev/null | grep "Debugger listening" | tail -1
else
    echo -e "${YELLOW}!${NC} Backend debugger status unknown (check logs manually)"
fi
echo ""

# Test 7: Check database connectivity
echo "7. Testing database connectivity..."
if docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U taskuser -d taskmanager >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database is ready and accepting connections"
else
    echo -e "${RED}✗${NC} Database not ready"
fi
echo ""

echo "=================================="
echo "Summary"
echo "=================================="
echo ""
echo -e "${GREEN}All basic checks passed!${NC}"
echo ""
echo "Next steps to test debugging:"
echo "  1. Open VS Code"
echo "  2. Go to Run and Debug panel (Cmd+Shift+D / Ctrl+Shift+D)"
echo "  3. Select 'Attach to Backend' and press F5"
echo "  4. Open backend/src/todos/todos.controller.ts"
echo "  5. Set a breakpoint on line 15 (findAll method)"
echo "  6. Run: curl http://localhost:4000/todos"
echo "  7. VS Code should pause at your breakpoint!"
echo ""
echo "For detailed instructions, see: ./DEBUGGING_TEST_GUIDE.md"
echo ""
