"""Database connection and session management."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from config import settings
from models import Base

# Create async engine
# Automatically use the correct driver based on DATABASE_URL
engine = create_async_engine(
    settings.async_database_url,  # Use the async-converted URL
    echo=False,  # Set to True for SQL query logging
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency for getting database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()





