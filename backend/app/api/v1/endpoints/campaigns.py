"""
Campaign CRUD endpoints.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.db import get_db
from app.models import Campaign
from app.schemas.campaign import CampaignCreate, CampaignResponse

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_in: CampaignCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Campaign:
    """Create a new campaign."""
    # Check if slug already exists
    existing = db.query(Campaign).filter(Campaign.slug == campaign_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign slug already exists",
        )

    campaign = Campaign(
        user_id=current_user.id,
        slug=campaign_in.slug,
        name=campaign_in.name,
        twitter_account_to_follow=campaign_in.twitter_account_to_follow,
        start_date=campaign_in.start_date,
        end_date=campaign_in.end_date,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return campaign


@router.get("/", response_model=list[CampaignResponse])
def list_campaigns(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[Campaign]:
    """List current user's campaigns."""
    return db.query(Campaign).filter(Campaign.user_id == current_user.id).all()


@router.get("/{slug}", response_model=CampaignResponse)
def get_campaign(
    slug: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Campaign:
    """Get a specific campaign by slug."""
    campaign = db.query(Campaign).filter(
        Campaign.slug == slug,
        Campaign.user_id == current_user.id,
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    return campaign


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    slug: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a campaign."""
    campaign = db.query(Campaign).filter(
        Campaign.slug == slug,
        Campaign.user_id == current_user.id,
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    db.delete(campaign)
    db.commit()
