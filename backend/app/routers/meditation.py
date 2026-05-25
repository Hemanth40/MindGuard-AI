from fastapi import APIRouter, Depends
from app.routers.deps import get_current_user
from app.models.database import User
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/meditation", tags=["meditation"])

class MeditationExercise(BaseModel):
    id: str
    name: str
    duration: int  # seconds
    type: str
    description: str
    icon: str
    color: str
    steps: List[str]
    inhale: int
    hold: int
    exhale: int
    hold2: int

EXERCISES = [
    {
        "id": "box", "name": "Box Breathing", "duration": 240, "type": "Breathing",
        "description": "Used by Navy SEALs to stay calm under pressure. Perfect for acute stress.",
        "icon": "square-outline", "color": "#7C3AED",
        "inhale": 4, "hold": 4, "exhale": 4, "hold2": 4,
        "steps": ["Find a comfortable seated position", "Inhale slowly for 4 counts", "Hold your breath for 4 counts", "Exhale slowly for 4 counts", "Hold empty for 4 counts", "Repeat the cycle 4-6 times"]
    },
    {
        "id": "478", "name": "4-7-8 Breathing", "duration": 300, "type": "Relaxation",
        "description": "Dr. Weil's natural tranquilizer for the nervous system. Reduces anxiety fast.",
        "icon": "leaf-outline", "color": "#06B6D4",
        "inhale": 4, "hold": 7, "exhale": 8, "hold2": 0,
        "steps": ["Exhale completely through your mouth", "Close mouth and inhale through nose for 4 counts", "Hold breath for 7 counts", "Exhale completely through mouth for 8 counts", "This is one breath — repeat 3 more times"]
    },
    {
        "id": "calm", "name": "Calm Breathing", "duration": 180, "type": "Beginner",
        "description": "Simple, gentle breathing for beginners. Great for daily practice.",
        "icon": "flower-outline", "color": "#EC4899",
        "inhale": 5, "hold": 2, "exhale": 5, "hold2": 2,
        "steps": ["Sit or lie comfortably", "Breathe in through your nose for 5 counts", "Hold gently for 2 counts", "Breathe out through your mouth for 5 counts", "Pause for 2 counts", "Continue for at least 5 minutes"]
    },
    {
        "id": "energy", "name": "Energizing Breath", "duration": 120, "type": "Energy",
        "description": "Increase alertness and energy with this invigorating breathing pattern.",
        "icon": "flash-outline", "color": "#F59E0B",
        "inhale": 3, "hold": 1, "exhale": 3, "hold2": 1,
        "steps": ["Sit up straight with good posture", "Take a sharp inhale through the nose for 3 counts", "Hold briefly", "Sharp exhale through the mouth for 3 counts", "Increase pace gradually", "Repeat for 2 minutes"]
    },
    {
        "id": "sleep", "name": "Sleep Preparation", "duration": 600, "type": "Sleep",
        "description": "Wind down your nervous system before sleep. Reduces insomnia and racing thoughts.",
        "icon": "moon-outline", "color": "#6366F1",
        "inhale": 6, "hold": 3, "exhale": 9, "hold2": 3,
        "steps": ["Lie in bed or sit comfortably", "Close your eyes and relax your jaw", "Inhale deeply for 6 counts", "Hold softly for 3 counts", "Exhale very slowly for 9 counts", "Let go of all thoughts — just breathe"]
    }
]

@router.get("/exercises", response_model=List[MeditationExercise])
def get_exercises(current_user: User = Depends(get_current_user)):
    return [MeditationExercise(**e) for e in EXERCISES]

@router.get("/{exercise_id}", response_model=MeditationExercise)
def get_exercise(exercise_id: str, current_user: User = Depends(get_current_user)):
    for ex in EXERCISES:
        if ex["id"] == exercise_id:
            return MeditationExercise(**ex)
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Exercise not found")
