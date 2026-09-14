from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.database import get_db, User
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut, QuickStartRequest
from app.core.security import get_password_hash, verify_password, create_access_token
from app.routers.deps import get_current_user
import re
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/quick-start", response_model=Token)
def quick_start(data: QuickStartRequest, db: Session = Depends(get_db)):
    clean_name = data.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    user = db.query(User).filter(User.username.ilike(clean_name)).first()
    if not user:
        slug = re.sub(r'[^a-zA-Z0-9_]', '', clean_name.lower()) or "user"
        email = f"{slug}@mindguard.app"
        if db.query(User).filter(User.email == email).first():
            email = f"{slug}_{uuid.uuid4().hex[:6]}@mindguard.app"

        user = User(
            username=clean_name,
            email=email,
            hashed_password=get_password_hash("mindguard_secure_pass")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user
