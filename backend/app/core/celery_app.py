"""
Celery application configuration.
"""

import sys
from pathlib import Path

# Ensure the backend directory is in sys.path so Celery workers can import `utils`
_backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "twitteros",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.verification", "app.tasks.delivery"],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    worker_prefetch_multiplier=1,
)

# Beat schedule for periodic tasks
# Beat schedule for periodic tasks
# Local: Fast for testing (Verify 2m, Deliver 1m)
# Production: Cost-effective (Verify 1h, Deliver 5m)
if settings.ENVIRONMENT == "production":
    verify_schedule = 3600.0  # 1 hour
    deliver_schedule = 300.0  # 5 minutes
else:
    verify_schedule = 120.0   # 2 minutes
    deliver_schedule = 60.0   # 1 minute

celery_app.conf.beat_schedule = {
    "verify-followers": {
        "task": "app.tasks.verification.verify_all_campaigns",
        "schedule": verify_schedule,
    },
    "deliver-rewards": {
        "task": "app.tasks.delivery.deliver_pending_rewards",
        "schedule": deliver_schedule,
    },
}
