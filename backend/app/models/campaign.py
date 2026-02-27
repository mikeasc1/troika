"""
Campaign models - Giveaway campaigns with spinner rewards.
"""

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.participant import Participant, SpinResult


class Campaign(Base):
    """A giveaway campaign created by a user."""
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    twitter_account_to_follow: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Airtime Reward Configuration
    reward_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Amount per participant (Standard campaigns)
    currency: Mapped[str] = mapped_column(String(10), default="NGN", nullable=False)

    # Prize Pool (Spinner campaigns)
    prize_pool_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Distribution Strategy
    distribution_strategy: Mapped[str] = mapped_column(String(20), default="INSTANT", nullable=False)  # INSTANT, SCHEDULED, SPLIT
    distribution_split_immediate_percentage: Mapped[int] = mapped_column(Integer, default=100, nullable=False)  # 0-100
    distribution_delay_min_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # e.g., 1440 for 24h
    distribution_delay_max_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # e.g., 2880 for 48h
    distribution_winners_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Campaign Type
    type: Mapped[str] = mapped_column(String(20), default="STANDARD", nullable=False)  # STANDARD, SPINNER

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="campaigns")
    participants: Mapped[List["Participant"]] = relationship("Participant", back_populates="campaign", cascade="all, delete-orphan")
    rewards: Mapped[List["SpinnerReward"]] = relationship("SpinnerReward", back_populates="campaign", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Campaign(id={self.id}, slug='{self.slug}')>"


class SpinnerReward(Base):
    """A reward available in a campaign spinner."""
    __tablename__ = "spinner_rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    reward_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "airtime", "cash", "coupon", etc.
    reward_value: Mapped[str] = mapped_column(String(255), nullable=False)  # "100" for ₦100 airtime, or coupon code
    quantity_available: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quantity_claimed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    probability: Mapped[float] = mapped_column(Float, default=0.1, nullable=False)  # 0.0 to 1.0
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="rewards")
    spin_results: Mapped[List["SpinResult"]] = relationship("SpinResult", back_populates="reward")

    @property
    def is_available(self) -> bool:
        return self.quantity_claimed < self.quantity_available

    def __repr__(self) -> str:
        return f"<SpinnerReward(id={self.id}, type='{self.reward_type}', value='{self.reward_value}')>"
