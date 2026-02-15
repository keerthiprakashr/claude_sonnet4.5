# Makefile for Docker Development Environment
# Usage: make <target>

.PHONY: help dev-up dev-down dev-restart dev-logs dev-build test clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev-up        - Start development containers"
	@echo "  make dev-down      - Stop development containers"
	@echo "  make dev-restart   - Restart development containers"
	@echo "  make dev-logs      - View all container logs"
	@echo "  make dev-build     - Rebuild development containers"
	@echo "  make backend-logs  - View backend logs only"
	@echo "  make frontend-logs - View frontend logs only"
	@echo "  make db-logs       - View database logs only"
	@echo "  make test          - Run tests in Alpine containers"
	@echo "  make clean         - Remove all containers and volumes"
	@echo "  make db-connect    - Connect to PostgreSQL database"

# Development environment commands
dev-up:
	docker-compose -f docker-compose.dev.yml up

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-restart:
	docker-compose -f docker-compose.dev.yml restart

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-build:
	docker-compose -f docker-compose.dev.yml up --build

# Individual service logs
backend-logs:
	docker-compose -f docker-compose.dev.yml logs -f backend

frontend-logs:
	docker-compose -f docker-compose.dev.yml logs -f frontend

db-logs:
	docker-compose -f docker-compose.dev.yml logs -f db

# Testing
test:
	docker-compose up --build --abort-on-container-exit

# Cleanup
clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose down -v

# Database access
db-connect:
	docker-compose -f docker-compose.dev.yml exec db psql -U taskuser -d taskmanager
