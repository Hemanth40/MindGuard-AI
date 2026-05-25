from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.models.database import get_db, MoodEntry
from app.schemas.schemas import MoodCreate, MoodOut
from app.routers.deps import get_current_user
from app.models.database import User
from app.ml.predictor import get_predictor
from typing import List, Optional

router = APIRouter(prefix="/api/mood", tags=["mood"])

@router.post("", response_model=MoodOut)
def create_mood_entry(mood_data: MoodCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Run stress prediction
    predictor = get_predictor()
    text = mood_data.journal_text or f"I feel {mood_data.anxiety_level} anxiety, mood is {mood_data.mood_score}/10."
    prediction = predictor.predict(text, mood_data.mood_score, mood_data.sleep_hours, mood_data.anxiety_level, mood_data.activity_level)
    
    entry = MoodEntry(
        user_id=current_user.id,
        mood_score=mood_data.mood_score,
        sleep_hours=mood_data.sleep_hours,
        anxiety_level=mood_data.anxiety_level,
        activity_level=mood_data.activity_level,
        journal_text=mood_data.journal_text or "",
        stress_level=prediction["stress_level"],
        stress_confidence=prediction["confidence"],
        stress_explanation=prediction["explanation"]
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.get("/today", response_model=Optional[MoodOut])
def get_today_mood(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    entry = db.query(MoodEntry).filter(
        MoodEntry.user_id == current_user.id,
        MoodEntry.created_at >= datetime.combine(today, datetime.min.time())
    ).first()
    return entry

@router.get("/recent", response_model=List[MoodOut])
def get_recent_moods(limit: int = 7, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MoodEntry).filter(MoodEntry.user_id == current_user.id).order_by(MoodEntry.created_at.desc()).limit(limit).all()
