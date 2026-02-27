"""
Credential models - Per-user API credentials with rotation support.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class ApifyCredential(Base):
    """Apify API credentials for a user."""
    __tablename__ = "apify_credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    api_key: Mapped[str] = mapped_column(String(255), nullable=False)
    label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Friendly name
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_exhausted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Lower = higher priority
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="apify_credentials")

    def __repr__(self) -> str:
        return f"<ApifyCredential(id={self.id}, label='{self.label}', exhausted={self.is_exhausted})>"


class VTUCredential(Base):
    """VTU.ng credentials for a user."""
    __tablename__ = "vtu_credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    password_encrypted: Mapped[str] = mapped_column(String(500), nullable=False)  # Store encrypted
    label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_exhausted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="vtu_credentials")

    def __repr__(self) -> str:
        return f"<VTUCredential(id={self.id}, username='{self.username}', exhausted={self.is_exhausted})>"
