import logging
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )

# CORS middleware
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
async def startup_event():
    import json
    logger.info(f"API_V1_STR: {settings.API_V1_STR}")
    routes = []
    for route in app.routes:
        if hasattr(route, "path"):
            routes.append(route.path)
        elif hasattr(route, "path_format"):
            routes.append(route.path_format)
            
    # logger.info(f"Registered routes:\n{json.dumps(routes, indent=2)}")


@app.get("/health")
def health_check():
    logger.info("Health check requested")
    return {"status": "ok"}


@app.get("/debug_db")
def debug_db():
    from sqlalchemy import text
    from app.core.db import SessionLocal
    
    logger.info("Testing database connection...")
    try:
        db = SessionLocal()
        # Try a simple query
        db.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Database error: {e}", exc_info=True)
        raise e
    finally:
        db.close()
