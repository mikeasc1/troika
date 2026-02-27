# start.ps1 - Start all backend services (Windows PowerShell)
# Usage: .\start.ps1 [-Mode dev|worker|beat|all]

param(
    [ValidateSet("dev", "worker", "beat", "flower", "migrate", "all")]
    [string]$Mode = "all"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message)
    Write-Host "[TwitterOS] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Test-Redis {
    try {
        $result = redis-cli ping 2>$null
        if ($result -eq "PONG") {
            Write-Log "Redis is running"
            return $true
        }
    } catch {}
    Write-Warning-Log "Redis is not running. Celery tasks will fail."
    Write-Warning-Log "Start Redis with: redis-server"
    return $false
}

function Run-Migrations {
    Write-Log "Running database migrations..."
    uv run alembic upgrade head
}

function Start-API {
    Write-Log "Starting FastAPI server on http://127.0.0.1:8001"
    uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
}

function Start-Worker {
    Write-Log "Starting Celery worker..."
    uv run celery -A app.core.celery_app worker --loglevel=info --pool=solo
}

function Start-Beat {
    Write-Log "Starting Celery beat scheduler..."
    uv run celery -A app.core.celery_app beat --loglevel=info
}

function Start-Flower {
    Write-Log "Starting Celery Flower on http://127.0.0.1:5555"
    uv run celery -A app.core.celery_app flower --port=5555
}

switch ($Mode) {
    "dev" {
        Run-Migrations
        Start-API
    }
    "worker" {
        Start-Worker
    }
    "beat" {
        Start-Beat
    }
    "flower" {
        Start-Flower
    }
    "migrate" {
        Run-Migrations
    }
    "all" {
        Write-Log "Starting all services..."
        Run-Migrations
        Test-Redis | Out-Null
        
        Write-Log "Starting Celery worker in background..."
        $worker = Start-Process -FilePath "uv" -ArgumentList "run celery -A app.core.celery_app worker --loglevel=info --pool=solo" -PassThru -NoNewWindow
        
        Write-Log "Starting Celery beat in background..."
        $beat = Start-Process -FilePath "uv" -ArgumentList "run celery -A app.core.celery_app beat --loglevel=info" -PassThru -NoNewWindow
        
        Write-Log "Starting Celery Flower in background on http://127.0.0.1:5555..."
        $flower = Start-Process -FilePath "uv" -ArgumentList "run celery -A app.core.celery_app flower --port=5555" -PassThru -NoNewWindow
        
        Write-Log "Starting FastAPI server (Ctrl+C to stop all)..."
        try {
            Start-API
        } finally {
            Write-Log "Stopping background services..."
            Stop-Process -Id $worker.Id -ErrorAction SilentlyContinue
            Stop-Process -Id $beat.Id -ErrorAction SilentlyContinue
            Stop-Process -Id $flower.Id -ErrorAction SilentlyContinue
        }
    }
    default {
        Write-Host @"
Usage: .\start.ps1 [-Mode <mode>]

Modes:
  dev     - Run FastAPI in development mode
  worker  - Run Celery worker only
  beat    - Run Celery beat scheduler only
  flower  - Run Celery Flower monitoring UI only
  migrate - Run database migrations only
  all     - Run all services (API + worker + beat + flower)
"@
    }
}
