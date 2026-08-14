"""
MindGuard AI — HuggingFace Inference API Predictor
====================================================
Uses HuggingFace's hosted Inference API — same 4 models, no local GPU/RAM needed.
Works perfectly on Render's free tier (< 200MB RAM).

Models used (all free on HF Inference API):
  1. cardiffnlp/twitter-roberta-base-sentiment-latest
  2. SamLowe/roberta-base-go_emotions
  3. j-hartmann/emotion-english-distilroberta-base
  4. cross-encoder/nli-deberta-v3-small
"""

import time
import asyncio
import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

HF_API_BASE = "https://api-inference.huggingface.co/models"

MODELS = {
    "sentiment": "cardiffnlp/twitter-roberta-base-sentiment-latest",
    "goemo":     "SamLowe/roberta-base-go_emotions",
    "emotion7":  "j-hartmann/emotion-english-distilroberta-base",
    "zero_shot": "cross-encoder/nli-deberta-v3-small",
}


def _hf_post(model_id: str, payload: dict, retries: int = 2) -> Optional[dict]:
    """POST to HuggingFace Inference API with automatic retry on 503 (model loading)."""
    url = f"{HF_API_BASE}/{model_id}"
    headers = {"Authorization": f"Bearer {settings.HF_API_KEY}"}

    for attempt in range(retries):
        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(url, json=payload, headers=headers)

            if resp.status_code == 200:
                return resp.json()

            if resp.status_code == 503:
                # Model is loading on HF side — wait and retry
                wait = 10 + (attempt * 10)
                logger.warning(f"HF model {model_id} loading, retrying in {wait}s...")
                time.sleep(wait)
                continue

            logger.error(f"HF API error {resp.status_code} for {model_id}: {resp.text[:200]}")
            return None

        except Exception as e:
            logger.error(f"HF API request failed for {model_id}: {e}")
            if attempt < retries - 1:
                time.sleep(1)

    return None


async def _hf_post_async(client: httpx.AsyncClient, model_id: str, payload: dict, retries: int = 2) -> Optional[dict]:
    """Async POST to HuggingFace Inference API with non-blocking retry."""
    url = f"{HF_API_BASE}/{model_id}"
    headers = {"Authorization": f"Bearer {settings.HF_API_KEY}"}

    for attempt in range(retries):
        try:
            resp = await client.post(url, json=payload, headers=headers)

            if resp.status_code == 200:
                return resp.json()

            if resp.status_code == 503:
                wait = 10 + (attempt * 10)
                logger.warning(f"HF model {model_id} loading, retrying in {wait}s...")
                await asyncio.sleep(wait)
                continue

            logger.error(f"HF API error {resp.status_code} for {model_id}: {resp.text[:200]}")
            return None

        except Exception as e:
            logger.error(f"HF API async request failed for {model_id}: {e}")
            if attempt < retries - 1:
                await asyncio.sleep(2)

    return None


class StressPredictor:
    """
    4-Model HuggingFace Ensemble Stress Predictor.
    Supports both high-concurrency parallel async inference and synchronous calls.
    """

    def __init__(self, load_async: bool = True):
        self.models_loaded = True   # Always ready — API is stateless
        self._load_error   = None
        self._loaded_count = 4
        logger.info("✅ MindGuard HF Inference API Predictor ready (4 models via HF API)")

    # ──────────────────────────────────────────────────
    # Individual model parsing helpers
    # ──────────────────────────────────────────────────

    def _parse_sentiment(self, result: Optional[dict]) -> float:
        if not result:
            return 0.5
        try:
            items = result[0] if isinstance(result[0], list) else result
            for item in items:
                label = item["label"].lower()
                score = item["score"]
                if "negative" in label:
                    return score
                elif "neutral" in label:
                    return 0.5 * score
            return 0.1  # positive
        except Exception as e:
            logger.warning(f"Sentiment parse error: {e}")
            return 0.5

    def _parse_goemo(self, result: Optional[dict]) -> tuple:
        stress_weights = {
            "fear": 0.95, "grief": 0.95, "remorse": 0.88,
            "sadness": 0.90, "nervousness": 0.92, "embarrassment": 0.80,
            "disgust": 0.75, "anger": 0.72, "annoyance": 0.65,
            "disapproval": 0.60, "disappointment": 0.70, "confusion": 0.55,
            "surprise": 0.35, "realization": 0.30, "curiosity": 0.25,
            "neutral": 0.20, "approval": 0.15, "caring": 0.10,
            "relief": 0.10, "amusement": 0.08, "excitement": 0.10,
            "gratitude": 0.05, "joy": 0.05, "love": 0.05,
            "admiration": 0.05, "desire": 0.20, "optimism": 0.08, "pride": 0.07,
        }
        if not result:
            return 0.5, "neutral"
        try:
            items = result[0] if isinstance(result[0], list) else result
            weighted  = sum(stress_weights.get(i["label"].lower(), 0.3) * i["score"] for i in items)
            dominant  = max(items, key=lambda x: x["score"])["label"].lower()
            return min(weighted, 1.0), dominant
        except Exception as e:
            logger.warning(f"GoEmo parse error: {e}")
            return 0.5, "neutral"

    def _parse_emotion7(self, result: Optional[dict]) -> tuple:
        stress_weights = {
            "fear": 0.95, "sadness": 0.90, "disgust": 0.75,
            "anger": 0.72, "surprise": 0.35, "neutral": 0.20, "joy": 0.05,
        }
        if not result:
            return 0.5, "neutral"
        try:
            items = result[0] if isinstance(result[0], list) else result
            weighted = sum(stress_weights.get(i["label"].lower(), 0.3) * i["score"] for i in items)
            dominant = max(items, key=lambda x: x["score"])["label"].lower()
            return min(weighted, 1.0), dominant
        except Exception as e:
            logger.warning(f"Emotion7 parse error: {e}")
            return 0.5, "neutral"

    def _parse_zero_shot(self, result: Optional[dict]) -> float:
        stress_labels = [
            "highly stressed and overwhelmed",
            "anxious and worried",
            "mentally exhausted and burned out",
            "depressed and hopeless",
        ]
        if not result:
            return 0.5
        try:
            scores = dict(zip(result["labels"], result["scores"]))
            return min(sum(scores.get(l, 0) for l in stress_labels), 1.0)
        except Exception as e:
            logger.warning(f"Zero-shot parse error: {e}")
            return 0.5

    # ──────────────────────────────────────────────────
    # Individual model sync calls
    # ──────────────────────────────────────────────────

    def _sentiment_score(self, text: str) -> float:
        result = _hf_post(MODELS["sentiment"], {"inputs": text[:512]})
        return self._parse_sentiment(result)

    def _goemo_score(self, text: str) -> tuple:
        result = _hf_post(MODELS["goemo"], {"inputs": text[:512]})
        return self._parse_goemo(result)

    def _emotion7_score(self, text: str) -> tuple:
        result = _hf_post(MODELS["emotion7"], {"inputs": text[:512]})
        return self._parse_emotion7(result)

    def _zero_shot_score(self, text: str) -> float:
        all_labels = [
            "highly stressed and overwhelmed",
            "anxious and worried",
            "mentally exhausted and burned out",
            "depressed and hopeless",
            "calm and peaceful",
            "happy and content",
            "relaxed and at ease",
        ]
        result = _hf_post(MODELS["zero_shot"], {
            "inputs": text[:512],
            "parameters": {"candidate_labels": all_labels, "multi_label": False},
        })
        return self._parse_zero_shot(result)

    # ──────────────────────────────────────────────────
    # Individual model async calls
    # ──────────────────────────────────────────────────

    async def _sentiment_score_async(self, client: httpx.AsyncClient, text: str) -> float:
        result = await _hf_post_async(client, MODELS["sentiment"], {"inputs": text[:512]})
        return self._parse_sentiment(result)

    async def _goemo_score_async(self, client: httpx.AsyncClient, text: str) -> tuple:
        result = await _hf_post_async(client, MODELS["goemo"], {"inputs": text[:512]})
        return self._parse_goemo(result)

    async def _emotion7_score_async(self, client: httpx.AsyncClient, text: str) -> tuple:
        result = await _hf_post_async(client, MODELS["emotion7"], {"inputs": text[:512]})
        return self._parse_emotion7(result)

    async def _zero_shot_score_async(self, client: httpx.AsyncClient, text: str) -> float:
        all_labels = [
            "highly stressed and overwhelmed",
            "anxious and worried",
            "mentally exhausted and burned out",
            "depressed and hopeless",
            "calm and peaceful",
            "happy and content",
            "relaxed and at ease",
        ]
        result = await _hf_post_async(client, MODELS["zero_shot"], {
            "inputs": text[:512],
            "parameters": {"candidate_labels": all_labels, "multi_label": False},
        })
        return self._parse_zero_shot(result)

    def _form_score(self, mood_score: float, sleep_hours: float,
                    anxiety_level: str, activity_level: str) -> float:
        """Evidence-based score from check-in form data."""
        mood_stress     = 1.0 - (mood_score / 10.0)
        sleep_stress    = (0.95 if sleep_hours <= 4 else 0.80 if sleep_hours <= 5
                          else 0.60 if sleep_hours <= 6 else 0.30 if sleep_hours <= 7
                          else 0.10 if sleep_hours <= 8 else 0.20)
        anxiety_stress  = {"low": 0.10, "medium": 0.55, "high": 0.92}.get(anxiety_level.lower(), 0.50)
        activity_stress = {"none": 0.75, "light": 0.40, "moderate": 0.15, "high": 0.05}.get(activity_level.lower(), 0.40)
        return round(max(0.0, min(1.0,
            mood_stress * 0.35 + sleep_stress * 0.28 +
            anxiety_stress * 0.27 + activity_stress * 0.10
        )), 3)

    # ──────────────────────────────────────────────────
    # Ensemble calculations
    # ──────────────────────────────────────────────────

    def _calculate_ensemble_result(self, s1: float, s2: float, em_goemo: str,
                                   s3: float, em7: str, s4: float, s5: float,
                                   text: str, mood_score: float, sleep_hours: float,
                                   anxiety_level: str, has_hf_key: bool) -> dict:
        words = len(text.split())
        if words > 8 and has_hf_key:
            combined = s1*0.15 + s2*0.22 + s3*0.22 + s4*0.21 + s5*0.20
        elif words > 3 and has_hf_key:
            combined = s1*0.10 + s2*0.12 + s3*0.12 + s4*0.16 + s5*0.50
        else:
            combined = s5

        combined = round(max(0.0, min(1.0, combined)), 3)

        if combined >= 0.65:
            stress_level = "HIGH"
            confidence   = combined
        elif combined >= 0.35:
            stress_level = "MODERATE"
            confidence   = 1.0 - abs(combined - 0.5) * 2
        else:
            stress_level = "LOW"
            confidence   = 1.0 - combined

        confidence = round(max(0.55, min(0.98, confidence)), 3)

        explanation   = self._explain(stress_level, em_goemo, em7, mood_score, sleep_hours, anxiety_level)
        recommendations = self._recommend(stress_level)

        return {
            "stress_level":  stress_level,
            "confidence":    confidence,
            "explanation":   explanation,
            "model_scores":  {
                "sentiment_score":  round(float(s1), 3),
                "goemo_score":      round(float(s2), 3),
                "goemo_label":      em_goemo,
                "emotion7_score":   round(float(s3), 3),
                "emotion7_label":   em7,
                "zero_shot_score":  round(float(s4), 3),
                "form_score":       round(float(s5), 3),
                "combined_score":   combined,
                "models_active":    has_hf_key,
                "predictor_type":   "hf-inference-api",
            },
            "recommendations": recommendations,
        }

    # ──────────────────────────────────────────────────
    # Async predict (Parallel Execution)
    # ──────────────────────────────────────────────────

    async def predict_async(self, text: str, mood_score: float, sleep_hours: float,
                            anxiety_level: str, activity_level: str) -> dict:
        has_hf_key = bool(settings.HF_API_KEY and settings.HF_API_KEY.startswith("hf_"))

        if not text or len(text.strip()) < 5:
            text = f"I feel {anxiety_level} anxiety. My mood today is {mood_score} out of 10."

        s5 = self._form_score(mood_score, sleep_hours, anxiety_level, activity_level)

        if has_hf_key:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res1, res2, res3, res4 = await asyncio.gather(
                    self._sentiment_score_async(client, text),
                    self._goemo_score_async(client, text),
                    self._emotion7_score_async(client, text),
                    self._zero_shot_score_async(client, text),
                    return_exceptions=True
                )
                s1 = res1 if isinstance(res1, (int, float)) else 0.5
                s2, em_goemo = res2 if (isinstance(res2, tuple) and len(res2) == 2) else (0.5, "neutral")
                s3, em7      = res3 if (isinstance(res3, tuple) and len(res3) == 2) else (0.5, "neutral")
                s4 = res4 if isinstance(res4, (int, float)) else 0.5
        else:
            logger.warning("HF_API_KEY not set — using form-only scoring")
            s1, s2, s3, s4 = s5, s5, s5, s5
            em_goemo, em7  = "neutral", "neutral"

        return self._calculate_ensemble_result(
            s1, s2, em_goemo, s3, em7, s4, s5,
            text, mood_score, sleep_hours, anxiety_level, has_hf_key
        )

    # ──────────────────────────────────────────────────
    # Synchronous predict (Fallback wrapper)
    # ──────────────────────────────────────────────────

    def predict(self, text: str, mood_score: float, sleep_hours: float,
                anxiety_level: str, activity_level: str) -> dict:
        has_hf_key = bool(settings.HF_API_KEY and settings.HF_API_KEY.startswith("hf_"))

        if not text or len(text.strip()) < 5:
            text = f"I feel {anxiety_level} anxiety. My mood today is {mood_score} out of 10."

        s5 = self._form_score(mood_score, sleep_hours, anxiety_level, activity_level)

        if has_hf_key:
            s1           = self._sentiment_score(text)
            s2, em_goemo = self._goemo_score(text)
            s3, em7      = self._emotion7_score(text)
            s4           = self._zero_shot_score(text)
        else:
            logger.warning("HF_API_KEY not set — using form-only scoring")
            s1, s2, s3, s4 = s5, s5, s5, s5
            em_goemo, em7  = "neutral", "neutral"

        return self._calculate_ensemble_result(
            s1, s2, em_goemo, s3, em7, s4, s5,
            text, mood_score, sleep_hours, anxiety_level, has_hf_key
        )

    def _explain(self, stress_level, em_goemo, em7, mood_score, sleep_hours, anxiety_level) -> str:
        sleep_note = (f"only {sleep_hours}h of sleep" if sleep_hours < 7
                      else f"{sleep_hours}h of good sleep")
        if stress_level == "HIGH":
            return (f"High stress detected — emotional patterns show {em7}/{em_goemo} tendencies. "
                    f"Mood {mood_score}/10, {anxiety_level} anxiety, and {sleep_note} "
                    f"are all contributing. Immediate self-care is recommended.")
        elif stress_level == "MODERATE":
            return (f"Moderate stress indicated — AI detected {em7} emotional patterns. "
                    f"Mood {mood_score}/10 with {anxiety_level} anxiety and {sleep_note}. "
                    f"Mindful breaks and wellness activities would help right now.")
        else:
            return (f"Low stress — great! AI detected {em7} emotional tone. "
                    f"Mood {mood_score}/10 with {sleep_note} looks positive. Keep it up! 🌟")

    def _recommend(self, stress_level: str) -> list:
        return {
            "HIGH": [
                "Try the 4-7-8 breathing technique right now — inhale 4, hold 7, exhale 8",
                "Step away from screens for 20 minutes and go for a short walk",
                "Call or text someone you trust — connection reduces cortisol",
                "Write down what's weighing on you most — externalizing thoughts helps",
                "Practice the Body Scan meditation in your Breathing Sanctuary",
            ],
            "MODERATE": [
                "Do a 5-minute Box Breathing session (4-4-4-4 pattern)",
                "Take a short break every 90 minutes — stand up and stretch",
                "Stay hydrated — drink a full glass of water right now",
                "Write down 3 things you're grateful for tonight",
                "Try a short 10-minute walk — it significantly lowers stress hormones",
            ],
            "LOW": [
                "Great work maintaining your mental wellness! 🌱 Keep your positive habits",
                "Your sleep routine is working — maintain it consistently",
                "Share your positive energy with someone around you today",
                "Try a new creative activity or enjoyable hobby this week",
                "Celebrate your emotional well-being — you earned it! ✨",
            ],
        }.get(stress_level, [])

    @property
    def status(self) -> dict:
        return {
            "models_loaded": True,
            "loaded_count":  4,
            "predictor_type": "hf-inference-api",
            "hf_key_set":    bool(settings.HF_API_KEY and settings.HF_API_KEY.startswith("hf_")),
            "models": list(MODELS.values()),
        }


# ── Global singleton ──
_predictor: Optional[StressPredictor] = None


def get_predictor() -> StressPredictor:
    global _predictor
    if _predictor is None:
        _predictor = StressPredictor(load_async=False)
    return _predictor

