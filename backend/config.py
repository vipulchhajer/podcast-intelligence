"""Application configuration."""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    groq_api_key: str
    together_api_key: str = ""
    
    # LLM Provider
    llm_provider: str = "groq"  # or "together"
    
    # App settings
    secret_key: str
    database_url: str = "sqlite+aiosqlite:///./podcast_app.db"
    storage_path: Path = Path("./storage")
    
    # Simple passcode protection (optional)
    app_passcode: str = ""  # Set to enable passcode protection
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # Model settings
    transcription_model: str = "whisper-large-v3"
    summarization_model: str = "llama-3.3-70b-versatile"
    context_window: int = 32768
    
    # Safety limits
    max_episode_duration_minutes: int = 180  # 3 hours max
    max_episodes_per_day: int = 50  # Limit daily processing
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [x.strip() for x in self.cors_origins.split(',')]
    
    @property
    def async_database_url(self) -> str:
        """Convert DATABASE_URL to async format for SQLAlchemy."""
        # Railway provides DATABASE_URL in postgres:// format
        # SQLAlchemy 2.0 async needs postgresql+asyncpg://
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.database_url  # SQLite or already correct format
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

# Ensure storage directory exists
settings.storage_path.mkdir(parents=True, exist_ok=True)

