from fastapi import APIRouter, Depends
from app.schemas.schemas import PredictRequest, PredictResponse
from app.ml.predictor import get_predictor
from app.routers.deps import get_current_user
from app.models.database import User

router = APIRouter(prefix="/api/predict", tags=["predict"])

@router.post("", response_model=PredictResponse)
def predict_stress(request: PredictRequest, current_user: User = Depends(get_current_user)):
    predictor = get_predictor()
    result = predictor.predict(
        text=request.journal_text or "",
        mood_score=request.mood_score,
        sleep_hours=request.sleep_hours,
        anxiety_level=request.anxiety_level,
        activity_level=request.activity_level
    )
    return PredictResponse(
        stress_level=result["stress_level"],
        confidence=result["confidence"],
        explanation=result["explanation"],
        model_scores=result["model_scores"],
        recommendations=result["recommendations"]
    )
