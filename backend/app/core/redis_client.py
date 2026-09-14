import json
import logging
from typing import Optional, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Optional[httpx.Client] = None

def get_client() -> Optional[httpx.Client]:
    global _client
    if not settings.UPSTASH_REDIS_REST_URL or not settings.UPSTASH_REDIS_REST_TOKEN:
        return None
    if _client is None or _client.is_closed:
        _client = httpx.Client(
            base_url=settings.UPSTASH_REDIS_REST_URL.rstrip("/"),
            headers={"Authorization": f"Bearer {settings.UPSTASH_REDIS_REST_TOKEN}"},
            timeout=3.0
        )
    return _client


def redis_get(key: str) -> Optional[str]:
    """Retrieve string from Upstash Redis. Returns None if key missing or on error."""
    client = get_client()
    if not client:
        return None
    try:
        res = client.post("/", json=["GET", str(key)])
        if res.status_code == 200:
            return res.json().get("result")
    except Exception as e:
        logger.debug(f"Redis GET error for key '{key}': {e}")
    return None


def redis_set(key: str, value: Any, ex_seconds: Optional[int] = 3600) -> bool:
    """Store value in Upstash Redis with optional expiration in seconds."""
    client = get_client()
    if not client:
        return False
    try:
        val_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
        cmd = ["SET", str(key), val_str]
        if ex_seconds and ex_seconds > 0:
            cmd.extend(["EX", int(ex_seconds)])
        res = client.post("/", json=cmd)
        return res.status_code == 200 and res.json().get("result") == "OK"
    except Exception as e:
        logger.debug(f"Redis SET error for key '{key}': {e}")
    return False


def redis_delete(key: str) -> bool:
    """Delete a key from Upstash Redis."""
    client = get_client()
    if not client:
        return False
    try:
        res = client.post("/", json=["DEL", str(key)])
        return res.status_code == 200
    except Exception as e:
        logger.debug(f"Redis DEL error for key '{key}': {e}")
    return False
