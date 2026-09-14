from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    HF_API_KEY: str = ""          # HuggingFace Inference API token (hf_...)
    SECRET_KEY: str = "mindguard-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    # SQLite locally, PostgreSQL on Render (set via env var DATABASE_URL)
    DATABASE_URL: str = "sqlite:///./data/mindguard.db"

    # Upstash Redis for caching & fast session state
    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
