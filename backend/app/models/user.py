"""
User model - System users who create campaigns.
"""

from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.campaign import Campaign
    from app.models.credentials import ApifyCredential, VTUCredential


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    twitter_username: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    campaigns: Mapped[List["Campaign"]] = relationship("Campaign", back_populates="user", cascade="all, delete-orphan")
    apify_credentials: Mapped[List["ApifyCredential"]] = relationship("ApifyCredential", back_populates="user", cascade="all, delete-orphan")
    vtu_credentials: Mapped[List["VTUCredential"]] = relationship("VTUCredential", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
