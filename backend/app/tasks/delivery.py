"""
Reward delivery background tasks with retry logic and logging.

Phase 1: 50% delivered 5 minutes after follow verification
Phase 2: 50% delivered randomly between 24-48 hours after verification

Failed deliveries are requeued (up to max_retries).
Successful deliveries are logged to DeliveryLog.
"""

import sys
from pathlib import Path

# Ensure backend dir is in sys.path for Celery worker processes
_backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import random
from datetime import datetime, timedelta

from app.core.celery_app import celery_app
from app.core.db import SessionLocal
from app.models import SpinResult, DeliveryLog


@celery_app.task(name="app.tasks.delivery.deliver_pending_rewards")
def deliver_pending_rewards() -> dict:
    """
    Process pending deliveries for both phases.
    
    - Delivers scheduled rewards that are due
    - Retries failed deliveries (requeues them with delay)
    - Logs all attempts to DeliveryLog
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        results = {
            "phase1_delivered": 0,
            "phase2_delivered": 0,
            "requeued": 0,
            "max_retries_exceeded": 0,
        }
        
        # Phase 1: Deliver rewards scheduled for now or earlier
        phase1_pending = db.query(SpinResult).filter(
            SpinResult.phase1_delivered == False,
            SpinResult.phase1_scheduled_at.isnot(None),
            SpinResult.phase1_scheduled_at <= now,
            SpinResult.phase1_value > 0,
            SpinResult.phase1_attempts < SpinResult.max_retries,
        ).limit(50).all()
        
        for spin_result in phase1_pending:
            result = _deliver_phase(db, spin_result, phase=1)
            if result.get("success"):
                results["phase1_delivered"] += 1
            elif result.get("requeued"):
                results["requeued"] += 1
            else:
                results["max_retries_exceeded"] += 1
        
        # Phase 2: Deliver rewards scheduled for now or earlier
        phase2_pending = db.query(SpinResult).filter(
            SpinResult.phase2_delivered == False,
            SpinResult.phase2_scheduled_at.isnot(None),
            SpinResult.phase2_scheduled_at <= now,
            SpinResult.phase2_value > 0,
            SpinResult.phase2_attempts < SpinResult.max_retries,
        ).limit(50).all()
        
        for spin_result in phase2_pending:
            result = _deliver_phase(db, spin_result, phase=2)
            if result.get("success"):
                results["phase2_delivered"] += 1
            elif result.get("requeued"):
                results["requeued"] += 1
            else:
                results["max_retries_exceeded"] += 1
        
        return results
    finally:
        db.close()


def _deliver_phase(db, spin_result: SpinResult, phase: int) -> dict:
    """
    Deliver a specific phase of the reward.
    Uses DB credentials if available, falls back to env vars.
    
    On success: marks delivered, logs to DeliveryLog
    On failure: increments attempts, requeues with exponential backoff
    """
    import asyncio
    from utils.vtu import VTUClient, VTUError
    from utils.credential_resolver import get_vtu_credentials_for_campaign
    
    participant = spin_result.participant
    reward = spin_result.reward
    
    if not participant or not reward:
        return {"success": False, "error": "Missing data"}
    
    phone = participant.phone_number
    if not phone:
        return {"success": False, "error": "No phone number"}
    
    value = spin_result.phase1_value if phase == 1 else spin_result.phase2_value
    attempts = spin_result.phase1_attempts if phase == 1 else spin_result.phase2_attempts
    
    # Increment attempt counter
    if phase == 1:
        spin_result.phase1_attempts += 1
    else:
        spin_result.phase2_attempts += 1
    
    current_attempt = attempts + 1
    
    # Resolve VTU credentials: DB first, then env vars
    vtu_creds = get_vtu_credentials_for_campaign(participant.campaign_id)
    
    if reward.reward_type == "airtime":
        try:
            async def send_airtime():
                async with VTUClient(credentials=vtu_creds if vtu_creds else None) as client:
                    return await client.buy_airtime("mtn", value, phone)
            
            vtu_result = asyncio.run(send_airtime())
            
            # SUCCESS: Mark as delivered
            now = datetime.utcnow()
            if phase == 1:
                spin_result.phase1_delivered = True
                spin_result.phase1_delivered_at = now
            else:
                spin_result.phase2_delivered = True
                spin_result.phase2_delivered_at = now
            
            # Check if fully delivered
            if spin_result.phase1_delivered and spin_result.phase2_delivered:
                spin_result.is_delivered = True
                spin_result.delivered_at = now
            
            # LOG SUCCESS
            log = DeliveryLog(
                spin_result_id=spin_result.id,
                phase=phase,
                success=True,
                amount=value,
                reward_type=reward.reward_type,
                recipient=phone,
                transaction_ref=str(vtu_result) if vtu_result else None,
                attempt_number=current_attempt,
            )
            db.add(log)
            db.commit()
            
            return {"success": True, "vtu_result": vtu_result}
            
        except VTUError as e:
            # FAILURE: Log and requeue
            log = DeliveryLog(
                spin_result_id=spin_result.id,
                phase=phase,
                success=False,
                amount=value,
                reward_type=reward.reward_type,
                recipient=phone,
                error_message=str(e)[:500],
                attempt_number=current_attempt,
            )
            db.add(log)
            
            # Requeue with exponential backoff (5min, 10min, 20min, 40min, 80min)
            if current_attempt < spin_result.max_retries:
                backoff_minutes = 5 * (2 ** (current_attempt - 1))
                retry_at = datetime.utcnow() + timedelta(minutes=backoff_minutes)
                
                if phase == 1:
                    spin_result.phase1_scheduled_at = retry_at
                else:
                    spin_result.phase2_scheduled_at = retry_at
                
                db.commit()
                return {"success": False, "requeued": True, "retry_at": retry_at.isoformat()}
            else:
                db.commit()
                return {"success": False, "requeued": False, "error": "Max retries exceeded"}
    
    else:
        # Non-airtime: mark as delivered (manual processing), log success
        now = datetime.utcnow()
        if phase == 1:
            spin_result.phase1_delivered = True
            spin_result.phase1_delivered_at = now
        else:
            spin_result.phase2_delivered = True
            spin_result.phase2_delivered_at = now
        
        if spin_result.phase1_delivered and spin_result.phase2_delivered:
            spin_result.is_delivered = True
            spin_result.delivered_at = now
        
        log = DeliveryLog(
            spin_result_id=spin_result.id,
            phase=phase,
            success=True,
            amount=value,
            reward_type=reward.reward_type,
            recipient=phone,
            transaction_ref="manual",
            attempt_number=current_attempt,
        )
        db.add(log)
        db.commit()
        
        return {"success": True, "message": "Marked for manual delivery"}


@celery_app.task(name="app.tasks.delivery.schedule_reward_delivery")
def schedule_reward_delivery(spin_result_id: int) -> dict:
    """
    Schedule reward delivery for a verified participant.
    
    Uses campaign's distribution_strategy and related settings:
    - INSTANT: 100% delivered 5 minutes after verification
    - SPLIT: Uses distribution_split_immediate_percentage and delay window
    """
    db = SessionLocal()
    try:
        spin_result = db.query(SpinResult).filter(SpinResult.id == spin_result_id).first()
        if not spin_result:
            return {"error": "SpinResult not found"}
        
        if not spin_result.reward:
            return {"error": "No reward attached"}
        
        # Get campaign for distribution settings
        participant = spin_result.participant
        if not participant:
            return {"error": "No participant"}
        
        campaign = participant.campaign
        if not campaign:
            return {"error": "No campaign"}
        
        try:
            total_value = int(spin_result.reward.reward_value)
        except ValueError:
            total_value = 0
        
        now = datetime.utcnow()
        strategy = campaign.distribution_strategy or "INSTANT"
        
        if strategy == "INSTANT":
            # 100% delivered after 5 minutes
            spin_result.phase1_scheduled_at = now + timedelta(minutes=5)
            spin_result.phase1_value = total_value
            spin_result.phase2_value = 0
            spin_result.phase2_scheduled_at = None
        
        elif strategy == "SPLIT":
            # Use campaign settings for split
            immediate_pct = campaign.distribution_split_immediate_percentage or 50
            delay_min = campaign.distribution_delay_min_minutes or 1440  # Default 24h
            delay_max = campaign.distribution_delay_max_minutes or 2880  # Default 48h
            
            phase1_value = int(total_value * immediate_pct / 100)
            phase2_value = total_value - phase1_value
            
            spin_result.phase1_scheduled_at = now + timedelta(minutes=5)
            spin_result.phase1_value = phase1_value
            
            if phase2_value > 0:
                random_delay = random.uniform(delay_min, delay_max)
                spin_result.phase2_scheduled_at = now + timedelta(minutes=random_delay)
                spin_result.phase2_value = phase2_value
            else:
                spin_result.phase2_value = 0
                spin_result.phase2_scheduled_at = None
        
        else:
            # SCHEDULED or other: treat as instant for now
            spin_result.phase1_scheduled_at = now + timedelta(minutes=5)
            spin_result.phase1_value = total_value
            spin_result.phase2_value = 0
            spin_result.phase2_scheduled_at = None
        
        spin_result.total_value = total_value
        
        db.commit()
        
        return {
            "scheduled": True,
            "strategy": strategy,
            "phase1_at": spin_result.phase1_scheduled_at.isoformat() if spin_result.phase1_scheduled_at else None,
            "phase2_at": spin_result.phase2_scheduled_at.isoformat() if spin_result.phase2_scheduled_at else None,
        }
    finally:
        db.close()
