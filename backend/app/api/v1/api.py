from fastapi import APIRouter

from app.api.v1.endpoints import auth, campaigns, join, settings, logs

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(campaigns.router)
api_router.include_router(join.router)
api_router.include_router(settings.router)
api_router.include_router(logs.router)
