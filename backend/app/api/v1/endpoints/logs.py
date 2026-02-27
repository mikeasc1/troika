"""
API endpoints for retrieving verification and delivery logs (Performance page).
"""

from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api import deps
from app.models import DeliveryLog, Participant, SpinResult, User, VerificationLog, Campaign

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("/verification", response_model=List[dict[str, Any]])
def get_verification_logs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    campaign_slug: str | None = Query(None),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get verification logs for campaigns owned by the current user.
    Optionally filter by campaign slug.
    """
    # Join: VerificationLog -> Participant -> Campaign (filter by user_id)
    query = (
        db.query(VerificationLog, Participant.twitter_username, Campaign.name)
        .join(Participant, VerificationLog.participant_id == Participant.id)
        .join(Campaign, Participant.campaign_id == Campaign.id)
        .filter(Campaign.user_id == current_user.id)
    )

    if campaign_slug:
        query = query.filter(Campaign.slug == campaign_slug)

    logs = (
        query.order_by(desc(VerificationLog.checked_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for log, username, campaign_name in logs:
        result.append({
            "id": log.id,
            "campaign": campaign_name,
            "participant": username,
            "was_following": log.was_following,
            "checked_at": log.checked_at,
        })

    return result


@router.get("/delivery", response_model=List[dict[str, Any]])
def get_delivery_logs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    campaign_slug: str | None = Query(None),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get delivery logs for campaigns owned by the current user.
    Optionally filter by campaign slug.
    """
    # Join: DeliveryLog -> SpinResult -> Participant -> Campaign (filter by user_id)
    query = (
        db.query(DeliveryLog, SpinResult, Participant.twitter_username, Campaign.name)
        .join(SpinResult, DeliveryLog.spin_result_id == SpinResult.id)
        .join(Participant, SpinResult.participant_id == Participant.id)
        .join(Campaign, Participant.campaign_id == Campaign.id)
        .filter(Campaign.user_id == current_user.id)
    )

    if campaign_slug:
        query = query.filter(Campaign.slug == campaign_slug)

    logs = (
        query.order_by(desc(DeliveryLog.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for log, _, username, campaign_name in logs:
        result.append({
            "id": log.id,
            "campaign": campaign_name,
            "participant": username,
            "phase": log.phase,
            "success": log.success,
            "amount": log.amount,
            "reward_type": log.reward_type,
            "recipient": log.recipient,
            "error_message": log.error_message,
            "transaction_ref": log.transaction_ref,
            "curr_attempt": log.attempt_number,
            "created_at": log.created_at,
        })

    return result
