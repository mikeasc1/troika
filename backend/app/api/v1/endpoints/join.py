"""
Public join endpoints - Campaign participation flow.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Campaign, Participant, Referral
from app.schemas.campaign import JoinStatusResponse, ParticipantJoin, ParticipantResponse

router = APIRouter(prefix="/join", tags=["Join"])


@router.get("/{slug}")
def get_campaign_info(
    slug: str,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Get campaign info for join page (public endpoint)."""
    campaign = db.query(Campaign).filter(
        Campaign.slug == slug,
        Campaign.is_active == True,
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found or inactive",
        )

    return {
        "name": campaign.name,
        "twitter_account_to_follow": campaign.twitter_account_to_follow,
        "slug": campaign.slug,
    }


@router.post("/{slug}", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED)
def join_campaign(
    slug: str,
    participant_in: ParticipantJoin,
    db: Annotated[Session, Depends(get_db)],
) -> Participant:
    """Join a campaign as participant."""
    campaign = db.query(Campaign).filter(
        Campaign.slug == slug,
        Campaign.is_active == True,
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found or inactive",
        )

    # Check if already joined
    existing = db.query(Participant).filter(
        Participant.campaign_id == campaign.id,
        Participant.twitter_username == participant_in.twitter_username,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already joined this campaign",
        )

    # Create participant
    participant = Participant(
        campaign_id=campaign.id,
        twitter_username=participant_in.twitter_username,
        phone_number=participant_in.phone_number,
    )
    db.add(participant)
    db.flush()  # Get participant ID

    # Handle referral
    if participant_in.referrer_twitter:
        referrer = db.query(Participant).filter(
            Participant.campaign_id == campaign.id,
            Participant.twitter_username == participant_in.referrer_twitter,
        ).first()

        if referrer and referrer.id != participant.id:
            referral = Referral(
                referrer_id=referrer.id,
                referred_id=participant.id,
            )
            db.add(referral)
            referrer.referral_count += 1

    db.commit()
    db.refresh(participant)

    return participant


@router.get("/{slug}/status/{twitter_username}", response_model=JoinStatusResponse)
def check_status(
    slug: str,
    twitter_username: str,
    db: Annotated[Session, Depends(get_db)],
) -> JoinStatusResponse:
    """Check participant's follow verification status."""
    campaign = db.query(Campaign).filter(Campaign.slug == slug).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    participant = db.query(Participant).filter(
        Participant.campaign_id == campaign.id,
        Participant.twitter_username == twitter_username,
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )

    if participant.is_verified_follower:
        message = "Congratulations! You are verified as a follower."
    else:
        message = f"Please follow @{campaign.twitter_account_to_follow} to complete verification."

    return JoinStatusResponse(
        is_following=participant.is_verified_follower,
        twitter_account_to_follow=campaign.twitter_account_to_follow,
        message=message,
    )
