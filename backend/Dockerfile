# syntax=docker/dockerfile:1

# ================================
# TwitterOS Backend Dockerfile
# ================================

FROM python:3.12-slim AS base
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND

# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# ================================
# Production stage (Built as appuser)
# ================================
FROM base AS production
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND

# Create non-root user for security
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid 1000 -m appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user FIRST to ensure all subsequent files are owned by appuser
USER appuser

# Copy dependency files
COPY --chown=appuser:appuser pyproject.toml uv.lock /app/

# Install dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy application code
COPY --chown=appuser:appuser . /app/

# Set path to use virtual environment
ENV PATH="/app/.venv/bin:$PATH"

# ---- HARDEN SCRIPT HANDLING ----
# 1) Fail early if scripts are missing
# 2) Normalize CRLF -> LF (Windows-safe)
# 3) Make executable
RUN test -f /app/start.sh || (echo "ERROR: Missing /app/start.sh in image" && exit 1) && \
    test -f /app/entrypoint.sh || (echo "ERROR: Missing /app/entrypoint.sh in image" && exit 1) && \
    sed -i 's/\r$//' /app/start.sh /app/entrypoint.sh && \
    chmod +x /app/start.sh /app/entrypoint.sh
# --------------------------------

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command (used by production stage if you ever run it directly)
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ================================
# Worker stage (Celery worker only)
# ================================
FROM production AS worker
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND
CMD ["/app/start.sh", "worker"]

# ================================
# Beat stage (Celery beat only)
# ================================
FROM production AS beat
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND
CMD ["/app/start.sh", "beat"]

# ================================
# API stage (FastAPI only)
# ================================
FROM production AS api
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND
CMD ["/app/entrypoint.sh"]