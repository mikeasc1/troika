"""
Pydantic schemas for authentication.
"""

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str
    full_name: str | None = None
    twitter_username: str | None = None


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str | None = None


class UserResponse(BaseModel):
    """User response schema (excludes password)."""
    id: int
    email: str
    full_name: str | None = None
    twitter_username: str | None = None

    model_config = {"from_attributes": True}
