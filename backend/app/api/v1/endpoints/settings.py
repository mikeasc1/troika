"""
Settings API endpoints - Manage user credentials for Apify and VTU.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.db import get_db
from app.models import ApifyCredential, VTUCredential


router = APIRouter(prefix="/settings", tags=["Settings"])


# ============= Schemas =============

class ApifySave(BaseModel):
    api_key: str = Field(..., min_length=1, max_length=255)
    label: str | None = None


class VTUSave(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=255)
    label: str | None = None


class CredentialInfo(BaseModel):
    id: int
    label: str | None
    is_active: bool
    masked_value: str  # e.g. "apify_api_***xxxx"


class CredentialsResponse(BaseModel):
    apify: list[CredentialInfo]
    vtu: list[CredentialInfo]


# ============= Helpers =============

def _mask(value: str, show_last: int = 4) -> str:
    """Mask a string, showing only the last N characters."""
    if len(value) <= show_last:
        return "***"
    return "***" + value[-show_last:]


# ============= Endpoints =============

@router.get("/credentials", response_model=CredentialsResponse)
def get_credentials(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CredentialsResponse:
    """Get all credentials for the current user (masked)."""
    apify_creds = db.query(ApifyCredential).filter(
        ApifyCredential.user_id == user.id
    ).order_by(ApifyCredential.priority).all()

    vtu_creds = db.query(VTUCredential).filter(
        VTUCredential.user_id == user.id
    ).order_by(VTUCredential.priority).all()

    return CredentialsResponse(
        apify=[
            CredentialInfo(
                id=c.id,
                label=c.label,
                is_active=c.is_active,
                masked_value=_mask(c.api_key),
            )
            for c in apify_creds
        ],
        vtu=[
            CredentialInfo(
                id=c.id,
                label=c.label,
                is_active=c.is_active,
                masked_value=_mask(c.username),
            )
            for c in vtu_creds
        ],
    )


@router.put("/apify")
def save_apify_key(
    data: ApifySave,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Upsert Apify API key for the current user."""
    # Check if user already has an active credential
    existing = db.query(ApifyCredential).filter(
        ApifyCredential.user_id == user.id,
        ApifyCredential.is_active == True,
    ).first()

    if existing:
        existing.api_key = data.api_key
        if data.label:
            existing.label = data.label
    else:
        cred = ApifyCredential(
            user_id=user.id,
            api_key=data.api_key,
            label=data.label or "Default",
            is_active=True,
        )
        db.add(cred)

    db.commit()
    return {"message": "Apify API Key saved successfully"}


@router.post("/apify")
def create_apify_key(
    data: ApifySave,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Add a new Apify API key for the current user."""
    cred = ApifyCredential(
        user_id=user.id,
        api_key=data.api_key,
        label=data.label or "Additional Key",
        is_active=True,
    )
    db.add(cred)
    db.commit()
    return {"message": "Apify API Key added successfully"}


@router.delete("/apify/{key_id}")
def delete_apify_key(
    key_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Delete an Apify API key."""
    cred = db.query(ApifyCredential).filter(
        ApifyCredential.id == key_id,
        ApifyCredential.user_id == user.id,
    ).first()

    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found",
        )

    db.delete(cred)
    db.commit()
    return {"message": "Apify API Key deleted successfully"}


@router.put("/vtu")
def save_vtu_credentials(
    data: VTUSave,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Upsert VTU.ng credentials for the current user."""
    existing = db.query(VTUCredential).filter(
        VTUCredential.user_id == user.id,
        VTUCredential.is_active == True,
    ).first()

    if existing:
        existing.username = data.username
        existing.password_encrypted = data.password  # In production, encrypt this
        if data.label:
            existing.label = data.label
    else:
        cred = VTUCredential(
            user_id=user.id,
            username=data.username,
            password_encrypted=data.password,  # In production, encrypt this
            label=data.label or "Default",
            is_active=True,
        )
        db.add(cred)

    db.commit()
    return {"message": "VTU credentials saved successfully"}
