"""Database models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    episodes = relationship("Episode", back_populates="user")


class Podcast(Base):
    """Podcast feed model."""
    __tablename__ = "podcasts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    rss_url = Column(String, unique=True, nullable=False)
    author = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    slug = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    episodes = relationship("Episode", back_populates="podcast")


class Episode(Base):
    """Episode model."""
    __tablename__ = "episodes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    podcast_id = Column(Integer, ForeignKey("podcasts.id"), nullable=False)
    
    # Episode metadata
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    audio_url = Column(String, nullable=False)
    guid = Column(String, unique=True, index=True)
    published = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # Duration in seconds
    
    # Processing status
    status = Column(String, default="pending")  # pending, downloading, transcribing, summarizing, completed, failed
    error_message = Column(Text, nullable=True)  # Store error details if processing fails
    
    # File paths (relative to storage directory)
    audio_path = Column(String, nullable=True)
    transcript_path = Column(String, nullable=True)
    summary_path = Column(String, nullable=True)
    
    # Content
    transcript_text = Column(Text, nullable=True)
    summary_json = Column(Text, nullable=True)  # JSON string
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="episodes")
    podcast = relationship("Podcast", back_populates="episodes")

