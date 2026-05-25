import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from app.core.config import settings

# Only create local data dir for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    os.makedirs("data", exist_ok=True)
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL on Render — no check_same_thread needed
    engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True)
    email           = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at      = Column(DateTime, default=datetime.utcnow)
    mood_entries    = relationship("MoodEntry",  back_populates="user")
    chat_messages   = relationship("ChatMessage", back_populates="user")


class MoodEntry(Base):
    __tablename__ = "mood_entries"
    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id"))
    mood_score         = Column(Float)
    sleep_hours        = Column(Float)
    anxiety_level      = Column(String)
    activity_level     = Column(String)
    journal_text       = Column(Text,   default="")
    stress_level       = Column(String, default="")
    stress_confidence  = Column(Float,  default=0.0)
    stress_explanation = Column(Text,   default="")
    created_at         = Column(DateTime, default=datetime.utcnow)
    user               = relationship("User", back_populates="mood_entries")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"))
    user_message   = Column(Text)
    ai_response    = Column(Text)
    stress_context = Column(String, default="")
    created_at     = Column(DateTime, default=datetime.utcnow)
    user           = relationship("User", back_populates="chat_messages")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
