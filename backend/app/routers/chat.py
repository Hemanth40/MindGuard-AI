from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import google.generativeai as genai
from app.schemas.schemas import ChatRequest, ChatResponse, ChatHistoryItem
from app.models.database import get_db, ChatMessage, User, MoodEntry
from app.routers.deps import get_current_user
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = """
You are MindGuard — a warm, deeply empathetic, and highly intelligent AI mental wellness companion, powered by Gemini. You behave like a world-class therapist and life coach combined.

━━━ CONTEXT BLOCK ━━━
At the start of every message you receive a [USER WELLNESS CONTEXT] block with the user's real app data:
- HAS_CHECKIN: whether they completed today's mood check-in
- Their name, mood score (1-10), sleep hours, anxiety level, activity level, journal text, ML-predicted stress level

━━━ RULE 1 — NO CHECK-IN YET ━━━
If HAS_CHECKIN = NO:
- Do NOT give any WHAT TO DO / WHAT TO AVOID advice yet
- Warmly greet them and gently explain that MindGuard works best when it knows how they're actually feeling today
- Encourage them to tap "Mood Check-In" on the Home screen first so you can give truly personalized guidance
- Say something like: "Before I can give you advice that's really tailored to YOU today, let's see how you're actually feeling. Could you do a quick check-in first? It only takes 2 minutes and it helps me understand your mood, sleep, and stress levels so I can actually help. 💜"
- Keep the conversation warm and inviting — do NOT just be an FAQ bot

━━━ RULE 2 — CHECK-IN EXISTS ━━━
If HAS_CHECKIN = YES — you have their full profile. Use it deeply:

1. PERSONALIZE every single response to their exact numbers:
   - Mood score: reference the exact number (e.g., "a 4/10 mood tells me you're really struggling")
   - Sleep: if < 6h say "only X hours of sleep is a big stress amplifier", if 7-8h acknowledge good sleep
   - Anxiety: LOW/MEDIUM/HIGH — shape your tone accordingly
   - Activity: NONE means extra stress risk, HIGH means protective factor
   - Journal: quote or paraphrase what they wrote
   - Stress level: HIGH/MODERATE/LOW from ML — anchor your advice here

2. WHAT TO DO and WHAT TO AVOID must be 100% personalized:
   - Tailor each point to their EXACT profile (not generic "drink water" or "exercise" advice)
   - E.g., if sleep < 6h: "Avoid caffeine after 2pm — with only 5h last night, it will spike your cortisol further"
   - E.g., if anxiety = HIGH and mood = 3: "Avoid scrolling social media right now — your anxious mind will catastrophize everything it sees"
   - E.g., if activity = NONE: "A 10-minute walk right now — even slow — will reduce your cortisol by ~26% within 20 minutes"

3. When stress = HIGH:
   - Acknowledge the difficulty first (2-3 warm sentences)
   - Then give WHAT TO DO (3 actions, each specifically matched to their data)
   - Then give WHAT TO AVOID (2-3 things, each specifically matched to their data)
   - End with a caring follow-up question

4. When stress = MODERATE:
   - Acknowledge and normalize
   - Give 2-3 targeted, personalized action steps
   - Ask what's weighing on them most

5. When stress = LOW:
   - Celebrate their positive state genuinely
   - Reinforce what's working (reference their actual sleep/mood/activity)
   - Suggest something to maintain or deepen their wellness

━━━ GENERAL RULES ━━━
- NEVER repeat the same advice twice in one conversation
- NEVER give generic filler like "stay hydrated" unless it's actually relevant to their profile
- Always vary tone and phrasing — feel like a real human who cares
- If user asks non-wellness questions, answer knowledgeably and helpfully
- Use warm emojis naturally — not excessively
- Keep responses concise but rich — no walls of text, no endless bullet lists
- Always end with either a question or an invitation to share more
"""


def build_gemini_history(history: list) -> list:
    """Convert DB history to Gemini format."""
    gemini_history = []
    for msg in history:
        gemini_history.append({"role": "user", "parts": [msg['user']]})
        gemini_history.append({"role": "model", "parts": [msg['ai']]})
    return gemini_history


def get_gemini_response(user_message: str, context_block: str, history: list) -> str:
    """Get AI response using Gemini 2.5 Flash as primary model."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.error("Gemini API key not configured!")
        return "I'm having trouble connecting right now. Please ensure the backend is properly configured."

    genai.configure(api_key=settings.GEMINI_API_KEY)
    gemini_history = build_gemini_history(history)
    full_message = f"{context_block}\n{user_message}" if context_block else user_message

    errors = []
    for model_name in ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']:
        try:
            logger.info(f"Calling {model_name}...")
            model = genai.GenerativeModel(model_name, system_instruction=SYSTEM_PROMPT)
            chat = model.start_chat(history=gemini_history)
            response = chat.send_message(full_message)
            logger.info(f"Success with {model_name}")
            return response.text
        except Exception as e:
            err_msg = f"{model_name} failed: {type(e).__name__}: {str(e)[:120]}"
            logger.warning(err_msg)
            errors.append(err_msg)
            continue

    logger.error("All models failed: " + "; ".join(errors))
    return f"I'm having trouble reaching the AI. (Error: {errors[-1] if errors else 'Unknown'}) 💙"


def build_context_block(user: User, latest_mood: MoodEntry | None) -> str:
    """Build rich user context block — injected into every Gemini message."""
    if latest_mood:
        mood_label = (
            "Awful (extremely low)" if latest_mood.mood_score <= 2 else
            "Bad (struggling)"      if latest_mood.mood_score <= 4 else
            "Okay (moderate)"       if latest_mood.mood_score <= 6 else
            "Good"                  if latest_mood.mood_score <= 8 else
            "Excellent"
        )
        sleep_risk = (
            "CRITICAL sleep deprivation" if latest_mood.sleep_hours < 5 else
            "Low sleep (stress amplifier)" if latest_mood.sleep_hours < 7 else
            "Adequate sleep"
        )
        activity_note = (
            "No physical activity (increases stress risk)" if latest_mood.activity_level.lower() == 'none' else
            f"{latest_mood.activity_level.upper()} physical activity"
        )
        journal = latest_mood.journal_text.strip() if latest_mood.journal_text else "No journal entry written."

        return (
            f"[USER WELLNESS CONTEXT]\n"
            f"HAS_CHECKIN: YES\n"
            f"Name: {user.username}\n"
            f"Mood Score: {latest_mood.mood_score}/10 — {mood_label}\n"
            f"Sleep Last Night: {latest_mood.sleep_hours} hours — {sleep_risk}\n"
            f"Anxiety Level: {latest_mood.anxiety_level.upper()}\n"
            f"Physical Activity: {activity_note}\n"
            f"Journal / Mind Dump: \"{journal}\"\n"
            f"ML Predicted Stress: {latest_mood.stress_level} stress "
            f"(confidence: {int(latest_mood.stress_confidence * 100)}%)\n"
            f"ML Analysis: {latest_mood.stress_explanation or 'N/A'}\n"
            f"[END CONTEXT]\n"
            f"INSTRUCTION: Use every field above to give deeply personalized advice. "
            f"Reference exact numbers. WHAT TO DO and WHAT TO AVOID must be specific to this profile — not generic."
        )
    else:
        return (
            f"[USER WELLNESS CONTEXT]\n"
            f"HAS_CHECKIN: NO\n"
            f"Name: {user.username}\n"
            f"No mood check-in recorded today.\n"
            f"[END CONTEXT]\n"
            f"INSTRUCTION: Do NOT give WHAT TO DO / WHAT TO AVOID advice yet. "
            f"Warmly encourage {user.username} to do their daily Mood Check-In on the Home screen first "
            f"so you can understand their current state. Tell them after the check-in you'll be able to "
            f"give truly personalized guidance. Keep it warm, friendly, and brief."
        )


@router.post("", response_model=ChatResponse)
def send_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get last 20 messages for memory
    recent = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc()).limit(20).all()
    history = [{'user': m.user_message, 'ai': m.ai_response} for m in reversed(recent)]

    # Get latest mood check-in
    latest_mood = db.query(MoodEntry).filter(
        MoodEntry.user_id == current_user.id
    ).order_by(MoodEntry.created_at.desc()).first()

    context_block = build_context_block(current_user, latest_mood)
    ai_response = get_gemini_response(request.message, context_block, history)

    # Save to DB
    db.add(ChatMessage(
        user_id=current_user.id,
        user_message=request.message,
        ai_response=ai_response,
        stress_context=request.stress_context or ""
    ))
    db.commit()

    return ChatResponse(response=ai_response, timestamp=datetime.utcnow())


@router.get("/history", response_model=List[ChatHistoryItem])
def get_chat_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc()).limit(limit).all()


@router.delete("/clear")
def clear_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear all chat history for this user — start fresh."""
    deleted = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.commit()
    logger.info(f"Cleared {deleted} messages for user {current_user.id}")
    return {"status": "success", "deleted": deleted, "message": "Chat history cleared"}
