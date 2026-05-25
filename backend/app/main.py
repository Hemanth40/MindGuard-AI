from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import init_db
from app.routers import auth, mood, predict, chat, wellness, meditation, history
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MindGuard AI API",
    description="Mental Health Support API with 4-model stress prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    logger.info("Starting MindGuard AI API...")
    init_db()
    logger.info("Database initialized")
    # Pre-load ML models in background
    import threading
    from app.ml.predictor import get_predictor
    threading.Thread(target=get_predictor, daemon=True).start()
    logger.info("ML models loading in background...")

app.include_router(auth.router)
app.include_router(mood.router)
app.include_router(predict.router)
app.include_router(chat.router)
app.include_router(wellness.router)
app.include_router(meditation.router)
app.include_router(history.router)

@app.get("/")
def root():
    return {"message": "MindGuard AI API", "status": "running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
