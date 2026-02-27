#!/bin/bash
set -e

echo "[TwitterOS] Running database migrations..."
uv run alembic upgrade head
echo "[TwitterOS] Migrations complete."

echo "[TwitterOS] Starting FastAPI server..."
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
