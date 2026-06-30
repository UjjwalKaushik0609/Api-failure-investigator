from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from auth.auth_handler import create_access_token
from auth.dependencies import bearer_scheme, blacklist_token, get_current_user
from auth.password_handler import hash_password, verify_password
from config import get_settings
from db.database import User, get_db
from models.schemas import Token, UserCreate, UserLogin, UserProfile


router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register")
def register(payload: UserCreate, db: Session = Depends(get_db)) -> dict[str, str]:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    return {"message": "Account created"}


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return Token(access_token=create_access_token(user.id, user.email))


@router.get("/me", response_model=UserProfile)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict[str, str]:
    ttl = int(timedelta(minutes=settings.access_token_expire_minutes).total_seconds())
    blacklist_token(credentials.credentials, ttl)
    return {"message": "Logged out"}
