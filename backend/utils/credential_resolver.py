"""
Credential resolver: fetches API credentials from the database for a campaign owner,
falling back to environment variables when DB credentials aren't available.

Priority order:
1. Database credentials (saved via Settings UI)
2. Environment variables (from .env / config.py)
"""

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import Campaign, ApifyCredential, VTUCredential


def get_apify_keys_for_campaign(campaign_id: int) -> list[str]:
    """
    Get Apify API keys for the campaign owner.
    Falls back to environment variables if no DB credentials exist.
    """
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign and campaign.user_id:
            db_creds = db.query(ApifyCredential).filter(
                ApifyCredential.user_id == campaign.user_id,
                ApifyCredential.is_active == True,
            ).order_by(ApifyCredential.priority).all()

            if db_creds:
                keys = [c.api_key for c in db_creds if c.api_key]
                if keys:
                    return keys

        # Fallback to env vars
        return settings.get_apify_keys()
    finally:
        db.close()


def get_vtu_credentials_for_campaign(campaign_id: int) -> list[tuple[str, str]]:
    """
    Get VTU credentials for the campaign owner.
    Falls back to environment variables if no DB credentials exist.
    """
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign and campaign.user_id:
            db_creds = db.query(VTUCredential).filter(
                VTUCredential.user_id == campaign.user_id,
                VTUCredential.is_active == True,
            ).order_by(VTUCredential.priority).all()

            if db_creds:
                creds = [
                    (c.username, c.password_encrypted)
                    for c in db_creds
                    if c.username and c.password_encrypted
                ]
                if creds:
                    return creds

        # Fallback to env vars
        return settings.get_vtu_credentials()
    finally:
        db.close()
