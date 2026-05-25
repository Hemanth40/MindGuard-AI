from fastapi import APIRouter, Depends
from app.routers.deps import get_current_user
from app.models.database import User
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/wellness", tags=["wellness"])

class WellnessTip(BaseModel):
    category: str
    title: str
    description: str
    icon: str

class WellnessResponse(BaseModel):
    stress_level: str
    tips: List[WellnessTip]
    affirmation: str

WELLNESS_DATA = {
    "HIGH": {
        "affirmation": "You are stronger than your stress. Every storm runs out of rain. 💜",
        "tips": [
            {"category": "Breathing", "title": "4-7-8 Breathing", "description": "Inhale 4 counts, hold 7, exhale 8. Repeat 4 times to activate your parasympathetic nervous system.", "icon": "leaf"},
            {"category": "Movement", "title": "5-Minute Walk", "description": "Step outside for fresh air. Even a short walk reduces cortisol levels significantly.", "icon": "walk"},
            {"category": "Sleep", "title": "Wind-Down Routine", "description": "No screens 1 hour before bed. Dim lights and play soft music to prepare your nervous system.", "icon": "moon"},
            {"category": "Connection", "title": "Reach Out", "description": "Text or call someone you trust. Social connection is one of the most powerful stress relievers.", "icon": "people"},
            {"category": "Mindfulness", "title": "Body Scan", "description": "Lie down and mentally scan from head to toe, consciously relaxing each muscle group.", "icon": "heart"}
        ]
    },
    "MODERATE": {
        "affirmation": "You are making progress every single day. Keep going! 🌟",
        "tips": [
            {"category": "Hydration", "title": "Drink Water", "description": "Dehydration amplifies stress. Drink a full glass of water right now.", "icon": "water"},
            {"category": "Breathing", "title": "Box Breathing", "description": "4 counts in, 4 hold, 4 out, 4 hold. Repeat 5 times for quick calm.", "icon": "leaf"},
            {"category": "Productivity", "title": "Break Tasks Down", "description": "Overwhelm comes from big tasks. Break your to-do list into 15-minute chunks.", "icon": "checkmark-circle"},
            {"category": "Nutrition", "title": "Eat Mindfully", "description": "Avoid skipping meals. Have a healthy snack to stabilize blood sugar and mood.", "icon": "nutrition"},
            {"category": "Gratitude", "title": "3 Good Things", "description": "Write down 3 things you're grateful for. Shifts focus from stress to abundance.", "icon": "star"}
        ]
    },
    "LOW": {
        "affirmation": "You're thriving! Your mental wellness is your superpower. ✨",
        "tips": [
            {"category": "Growth", "title": "Learn Something New", "description": "Your mind is open and ready. Try a new skill, read an article, or watch an educational video.", "icon": "school"},
            {"category": "Connection", "title": "Spread Positivity", "description": "Your good energy is contagious. Reach out to a friend or leave a kind note.", "icon": "heart"},
            {"category": "Exercise", "title": "Push Your Limits", "description": "In this positive state, try a slightly more challenging workout to build resilience.", "icon": "fitness"},
            {"category": "Creativity", "title": "Creative Expression", "description": "Paint, draw, write, or cook something new. Creative flow deepens your well-being.", "icon": "color-palette"},
            {"category": "Sleep", "title": "Maintain Your Routine", "description": "Your sleep is working! Keep the same bedtime to preserve your excellent energy.", "icon": "moon"}
        ]
    }
}

@router.get("/{stress_level}", response_model=WellnessResponse)
def get_wellness_tips(stress_level: str, current_user: User = Depends(get_current_user)):
    level = stress_level.upper()
    if level not in WELLNESS_DATA:
        level = "MODERATE"
    data = WELLNESS_DATA[level]
    return WellnessResponse(
        stress_level=level,
        tips=[WellnessTip(**t) for t in data["tips"]],
        affirmation=data["affirmation"]
    )
