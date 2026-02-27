#!/bin/bash
# start.sh - Start all backend services
# Usage: ./start.sh [dev|worker|beat|all]

set -e

MODE=${1:-all}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[TwitterOS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Redis is running
check_redis() {
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            log "Redis is running"
            return 0
        fi
    fi
    warn "Redis is not running. Celery tasks will fail."
    warn "Start Redis with: redis-server"
    return 1
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    uv run alembic upgrade head
}

# Start FastAPI server
start_api() {
    log "Starting FastAPI server on http://127.0.0.1:8000"
    uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

# Start Celery worker
start_worker() {
    log "Starting Celery worker..."
    uv run celery -A app.core.celery_app worker --loglevel=info
}

# Start Celery beat scheduler
start_beat() {
    log "Starting Celery beat scheduler..."
    uv run celery -A app.core.celery_app beat --loglevel=info
}

# Start Celery Flower monitoring UI
start_flower() {
    log "Starting Celery Flower on http://127.0.0.1:5555"
    uv run celery -A app.core.celery_app flower --port=5555
}

# Start all services in background (for production)
start_all_background() {
    log "Starting all services..."
    run_migrations
    check_redis || true
    
    log "Starting Celery worker in background..."
    uv run celery -A app.core.celery_app worker --loglevel=info &
    WORKER_PID=$!
    
    log "Starting Celery beat in background..."
    uv run celery -A app.core.celery_app beat --loglevel=info &
    BEAT_PID=$!
    
    log "Starting Celery Flower in background on http://127.0.0.1:5555..."
    uv run celery -A app.core.celery_app flower --port=5555 &
    FLOWER_PID=$!
    
    log "Starting FastAPI server..."
    uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
    
    # Cleanup on exit
    trap "kill $WORKER_PID $BEAT_PID $FLOWER_PID 2>/dev/null" EXIT
}

case $MODE in
    dev)
        run_migrations
        start_api
        ;;
    worker)
        start_worker
        ;;
    beat)
        start_beat
        ;;
    flower)
        start_flower
        ;;
    migrate)
        run_migrations
        ;;
    all)
        start_all_background
        ;;
    *)
        echo "Usage: $0 [dev|worker|beat|migrate|all]"
        echo ""
        echo "  dev     - Run FastAPI in development mode"
        echo "  worker  - Run Celery worker only"
        echo "  beat    - Run Celery beat scheduler only"
        echo "  flower  - Run Celery Flower monitoring UI only"
        echo "  migrate - Run database migrations only"
        echo "  all     - Run all services (API + worker + beat + flower)"
        exit 1
        ;;
esac
