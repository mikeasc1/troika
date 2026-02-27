from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "TwitterOS Backend"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./twitteros.db"

    # Apify - supports multiple keys (comma-separated)
    APIFY_KEY: Optional[str] = None  # Single key (legacy)
    APIFY_KEYS: Optional[str] = None  # Multiple keys, comma-separated

    # VTU.ng API credentials - supports multiple (comma-separated username:password pairs)
    VTU_USERNAME: Optional[str] = None  # Single credential (legacy)
    VTU_PASSWORD: Optional[str] = None
    VTU_CREDENTIALS: Optional[str] = None  # Multiple: "user1:pass1,user2:pass2"
    VTU_BASE_URL: str = "https://vtu.ng/wp-json"

    # JWT Authentication
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Redis (for Celery)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS - include all local development origins
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,http://localhost:8001,http://127.0.0.1:8001"

    # Environment: local or production
    ENVIRONMENT: str = "local"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    def get_apify_keys(self) -> list[str]:
        """Get list of Apify keys, combining single and multiple key sources."""
        keys = []
        if self.APIFY_KEYS:
            keys.extend([k.strip() for k in self.APIFY_KEYS.split(",") if k.strip()])
        if self.APIFY_KEY and self.APIFY_KEY not in keys:
            keys.append(self.APIFY_KEY)
        return keys

    def get_vtu_credentials(self) -> list[tuple[str, str]]:
        """Get list of VTU credentials as (username, password) tuples."""
        creds = []
        # Parse multi-credential format: "user1:pass1,user2:pass2"
        if self.VTU_CREDENTIALS:
            for pair in self.VTU_CREDENTIALS.split(","):
                pair = pair.strip()
                if ":" in pair:
                    username, password = pair.split(":", 1)
                    creds.append((username.strip(), password.strip()))
        # Add single credential if not already in list
        if self.VTU_USERNAME and self.VTU_PASSWORD:
            single = (self.VTU_USERNAME, self.VTU_PASSWORD)
            if single not in creds:
                creds.append(single)
        return creds


settings = Settings()

