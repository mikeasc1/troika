"""
Pydantic schemas for campaigns.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    """Schema for creating a campaign."""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    twitter_account_to_follow: str = Field(..., min_length=1, max_length=50)
    start_date: datetime | None = None
    end_date: datetime | None = None

    # Airtime Reward Configuration
    reward_amount: float | None = None  # Amount per participant (Standard)
    currency: str = "NGN"

    # Prize Pool (Spinner campaigns)
    prize_pool_amount: float = 0.0

    # Distribution Strategy
    distribution_strategy: str = "INSTANT"  # INSTANT, SCHEDULED, SPLIT
    distribution_split_immediate_percentage: int = 100  # 0-100
    distribution_delay_min_minutes: int | None = None  # e.g., 1440 for 24h
    distribution_delay_max_minutes: int | None = None  # e.g., 2880 for 48h
    distribution_winners_count: int = 1

    # Type
    type: str = "STANDARD"


class CampaignResponse(BaseModel):
    """Campaign response schema."""
    id: int
    slug: str
    name: str
    twitter_account_to_follow: str
    is_active: bool
    start_date: datetime | None = None
    end_date: datetime | None = None
    
    # Airtime Reward Configuration
    reward_amount: float | None = None
    currency: str = "NGN"

    # Prize Pool (Spinner)
    prize_pool_amount: float = 0.0

    # Distribution
    distribution_strategy: str = "INSTANT"
    distribution_split_immediate_percentage: int = 100
    distribution_delay_min_minutes: int | None = None
    distribution_delay_max_minutes: int | None = None
    distribution_winners_count: int = 1
    type: str = "STANDARD"

    created_at: datetime

    model_config = {"from_attributes": True}


class ParticipantJoin(BaseModel):
    """Schema for joining a campaign."""
    twitter_username: str = Field(..., min_length=1, max_length=50)
    phone_number: str = Field(..., min_length=10, max_length=20)
    referrer_twitter: str | None = None


class ParticipantResponse(BaseModel):
    """Participant response schema."""
    id: int
    twitter_username: str
    is_verified_follower: bool
    referral_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class JoinStatusResponse(BaseModel):
    """Status response for participant."""
    is_following: bool
    twitter_account_to_follow: str
    message: str
