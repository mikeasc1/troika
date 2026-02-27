"""
Base model for SQLAlchemy models.

This re-exports Base from app.core.db for convenience.
"""

from app.core.db import Base

__all__ = ["Base"]
