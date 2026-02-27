"""
Follower verification background tasks.

Cost-effective approach: Fetches followers once per campaign, then batch-checks all participants.
"""

import sys
from pathlib import Path

# Ensure backend dir is in sys.path for Celery worker processes
_backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import random
from datetime import datetime

from app.core.celery_app import celery_app
from app.core.db import SessionLocal
from app.models import Campaign, Participant, SpinResult, VerificationLog


@celery_app.task(name="app.tasks.verification.verify_all_campaigns")
def verify_all_campaigns() -> dict:
    """
    Verify followers for all active campaigns (cost-effective batch approach).
    
    Runs hourly. Fetches followers ONCE per campaign, then checks all participants.
    """
    db = SessionLocal()
    try:
        campaigns = db.query(Campaign).filter(Campaign.is_active == True).all()
        
        results = {
            "campaigns_checked": 0,
            "participants_verified": 0,
            "newly_verified": 0,
            "unfollowed": 0,
        }
        
        for campaign in campaigns:
            result = verify_campaign_followers.delay(campaign.id)
            results["campaigns_checked"] += 1
            
            # Rate limiting: wait between campaign checks
            import time
            time.sleep(random.uniform(2, 5))
        
        return results
    finally:
        db.close()


@celery_app.task(name="app.tasks.verification.verify_campaign_followers")
def verify_campaign_followers(campaign_id: int) -> dict:
    """
    Verify followers for a specific campaign (single API call, batch participant check).
    Uses DB credentials if available, falls back to env vars.
    """
    import sys as _sys
    from pathlib import Path as _Path
    _bd = str(_Path(__file__).resolve().parent.parent.parent)
    if _bd not in _sys.path:
        _sys.path.insert(0, _bd)
    
    from utils.twitter import get_followers, get_followers_with_keys
    from utils.credential_resolver import get_apify_keys_for_campaign
    from app.tasks.delivery import schedule_reward_delivery
    
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return {"error": "Campaign not found"}
        
        # Resolve Apify keys: DB first, then env vars
        apify_keys = get_apify_keys_for_campaign(campaign_id)
        
        # COST-EFFECTIVE: Single API call to get all followers
        try:
            if apify_keys:
                followers = get_followers_with_keys(campaign.twitter_account_to_follow, apify_keys)
            else:
                followers = get_followers(campaign.twitter_account_to_follow)
            follower_usernames = {
                (f.get("username") or f.get("screen_name") or f.get("screenName", "")).lower()
                for f in followers
                if f.get("username") or f.get("screen_name") or f.get("screenName")
            }
        except Exception as e:
            return {"error": f"Failed to fetch followers: {e}"}
        
        # Get all unverified participants (focus on new ones for cost-effectiveness)
        participants = db.query(Participant).filter(
            Participant.campaign_id == campaign_id,
            Participant.is_active == True,
        ).all()
        
        result = {
            "checked": 0,
            "newly_verified": 0,
            "unfollowed": 0,
            "rewards_scheduled": 0,
        }
        
        for participant in participants:
            was_following_before = participant.is_verified_follower
            is_following_now = participant.twitter_username.lower() in follower_usernames
            
            # Determine if this is the first check for this participant
            is_first_check = participant.last_verified_at is None

            participant.is_verified_follower = is_following_now
            participant.last_verified_at = datetime.utcnow()
            
            # Log verification ONLY if status changed or it's the first check
            if is_first_check or (is_following_now != was_following_before):
                log = VerificationLog(
                    participant_id=participant.id,
                    was_following=is_following_now,
                )
                db.add(log)
            
            result["checked"] += 1
            
            # NEWLY VERIFIED: Schedule split reward delivery
            if is_following_now and not was_following_before:
                result["newly_verified"] += 1
                
                # Check if participant has a pending spin result
                spin_result = db.query(SpinResult).filter(
                    SpinResult.participant_id == participant.id,
                    SpinResult.phase1_scheduled_at.is_(None),  # Not yet scheduled
                ).first()
                
                if spin_result:
                    db.commit()  # Commit participant changes first
                    schedule_reward_delivery.delay(spin_result.id)
                    result["rewards_scheduled"] += 1
            
            elif not is_following_now and was_following_before:
                result["unfollowed"] += 1
        
        db.commit()
        return result
        
    finally:
        db.close()
