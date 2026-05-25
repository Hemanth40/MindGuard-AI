from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Mood
class MoodCreate(BaseModel):
    mood_score: float
    sleep_hours: float
    anxiety_level: str
    activity_level: str
    journal_text: Optional[str] = ""

class MoodOut(BaseModel):
    id: int
    mood_score: float
    sleep_hours: float
    anxiety_level: str
    activity_level: str
    journal_text: Optional[str]
    stress_level: Optional[str]
    stress_confidence: Optional[float]
    stress_explanation: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# Predict
class PredictRequest(BaseModel):
    mood_score: float
    sleep_hours: float
    anxiety_level: str
    activity_level: str
    journal_text: Optional[str] = "I am feeling this way today."

class PredictResponse(BaseModel):
    model_config = {'protected_namespaces': ()}
    stress_level: str
    confidence: float
    explanation: str
    model_scores: dict
    recommendations: List[str]

# Chat
class ChatRequest(BaseModel):
    message: str
    stress_context: Optional[str] = "UNKNOWN"

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

class ChatHistoryItem(BaseModel):
    id: int
    user_message: str
    ai_response: str
    stress_context: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# History
class HistoryPoint(BaseModel):
    date: str
    mood_score: float
    stress_level: str

class HistoryStats(BaseModel):
    avg_mood: float
    total_entries: int
    streak: int
    stress_distribution: dict
    weekly_mood: List[dict]
