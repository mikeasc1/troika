"""
Participant models - Campaign participants with referrals and verification.
"""

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.campaign import Campaign, SpinnerReward


class Participant(Base):
    """A user who joined a campaign."""
    __tablename__ = "participants"
    __table_args__ = (
        UniqueConstraint("campaign_id", "twitter_username", name="uq_participant_campaign_twitter"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    twitter_username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    twitter_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    account_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_verified_follower: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    referral_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="participants")
    spin_results: Mapped[List["SpinResult"]] = relationship("SpinResult", back_populates="participant", cascade="all, delete-orphan")
    verification_logs: Mapped[List["VerificationLog"]] = relationship("VerificationLog", back_populates="participant", cascade="all, delete-orphan")
    
    # Referral relationships
    referrals_made: Mapped[List["Referral"]] = relationship("Referral", foreign_keys="Referral.referrer_id", back_populates="referrer", cascade="all, delete-orphan")
    referred_by_rel: Mapped[Optional["Referral"]] = relationship("Referral", foreign_keys="Referral.referred_id", back_populates="referred", uselist=False)

    def __repr__(self) -> str:
        return f"<Participant(id={self.id}, twitter='{self.twitter_username}')>"


class Referral(Base):
    """Tracks who referred whom."""
    __tablename__ = "referrals"
    __table_args__ = (
        UniqueConstraint("referred_id", name="uq_referral_referred"),  # Each participant can only be referred once
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    referrer_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    referred_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    referrer: Mapped["Participant"] = relationship("Participant", foreign_keys=[referrer_id], back_populates="referrals_made")
    referred: Mapped["Participant"] = relationship("Participant", foreign_keys=[referred_id], back_populates="referred_by_rel")

    def __repr__(self) -> str:
        return f"<Referral(referrer={self.referrer_id}, referred={self.referred_id})>"


class SpinResult(Base):
    """Records a participant's spin result with split delivery tracking."""
    __tablename__ = "spin_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    participant_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    reward_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("spinner_rewards.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Total reward value (for airtime: the amount)
    total_value: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Phase 1: 50% delivered 5 minutes after follow verification
    phase1_delivered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phase1_value: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    phase1_delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    phase1_scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Phase 2: 50% delivered randomly between 24-48 hours
    phase2_delivered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phase2_value: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    phase2_delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    phase2_scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Retry tracking
    phase1_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    phase2_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    
    # Legacy/convenience
    is_delivered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # True when both phases done
    delivery_details: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    spun_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # When fully delivered

    # Relationships
    participant: Mapped["Participant"] = relationship("Participant", back_populates="spin_results")
    reward: Mapped[Optional["SpinnerReward"]] = relationship("SpinnerReward", back_populates="spin_results")

    @property
    def fully_delivered(self) -> bool:
        """Check if both phases are delivered."""
        return self.phase1_delivered and self.phase2_delivered

    def __repr__(self) -> str:
        return f"<SpinResult(id={self.id}, p1={self.phase1_delivered}, p2={self.phase2_delivered})>"


class VerificationLog(Base):
    """Audit log for follower verification checks."""
    __tablename__ = "verification_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    participant_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    was_following: Mapped[bool] = mapped_column(Boolean, nullable=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    participant: Mapped["Participant"] = relationship("Participant", back_populates="verification_logs")

    def __repr__(self) -> str:
        return f"<VerificationLog(participant={self.participant_id}, following={self.was_following})>"


class DeliveryLog(Base):
    """Audit log for reward deliveries (successes and failures)."""
    __tablename__ = "delivery_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    spin_result_id: Mapped[int] = mapped_column(Integer, ForeignKey("spin_results.id", ondelete="CASCADE"), nullable=False, index=True)
    phase: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 or 2
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    reward_type: Mapped[str] = mapped_column(String(50), nullable=False)
    recipient: Mapped[str] = mapped_column(String(50), nullable=False)  # Phone number or account
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    transaction_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # VTU transaction ID
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        status = "SUCCESS" if self.success else "FAILED"
        return f"<DeliveryLog(id={self.id}, phase={self.phase}, {status})>"
