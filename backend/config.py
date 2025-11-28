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
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # Model settings
    transcription_model: str = "whisper-large-v3"
    summarization_model: str = "llama-3.3-70b-versatile"
    context_window: int = 32768
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [x.strip() for x in self.cors_origins.split(',')]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

# Ensure storage directory exists
settings.storage_path.mkdir(parents=True, exist_ok=True)

