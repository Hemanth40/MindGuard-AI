from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from app.models.database import get_db, MoodEntry, User
from app.schemas.schemas import HistoryPoint, HistoryStats
from app.routers.deps import get_current_user
from typing import List
from collections import Counter

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("/mood", response_model=List[HistoryPoint])
def get_mood_history(days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    since = datetime.utcnow() - timedelta(days=days)
    entries = db.query(MoodEntry).filter(
        MoodEntry.user_id == current_user.id,
        MoodEntry.created_at >= since
    ).order_by(MoodEntry.created_at.asc()).all()
    
    return [HistoryPoint(
        date=e.created_at.strftime("%Y-%m-%d"),
        mood_score=e.mood_score,
        stress_level=e.stress_level or "UNKNOWN"
    ) for e in entries]

@router.get("/stats", response_model=HistoryStats)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entries = db.query(MoodEntry).filter(MoodEntry.user_id == current_user.id).order_by(MoodEntry.created_at.desc()).all()
    
    if not entries:
        return HistoryStats(avg_mood=0, total_entries=0, streak=0, stress_distribution={"LOW": 0, "MODERATE": 0, "HIGH": 0}, weekly_mood=[])
    
    avg_mood = sum(e.mood_score for e in entries) / len(entries)
    stress_counts = Counter(e.stress_level for e in entries if e.stress_level)
    
    # Calculate streak
    streak = 0
    current_date = date.today()
    entry_dates = set(e.created_at.date() for e in entries)
    while current_date in entry_dates:
        streak += 1
        current_date -= timedelta(days=1)
    
    # Weekly mood (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        day = date.today() - timedelta(days=i)
        day_entries = [e for e in entries if e.created_at.date() == day]
        avg = sum(e.mood_score for e in day_entries) / len(day_entries) if day_entries else 0
        weekly.append({"day": day.strftime("%a"), "mood": round(avg, 1)})
    
    return HistoryStats(
        avg_mood=round(avg_mood, 1),
        total_entries=len(entries),
        streak=streak,
        stress_distribution={"LOW": stress_counts.get("LOW", 0), "MODERATE": stress_counts.get("MODERATE", 0), "HIGH": stress_counts.get("HIGH", 0)},
        weekly_mood=weekly
    )
