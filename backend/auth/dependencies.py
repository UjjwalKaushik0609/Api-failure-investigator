from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from redis import Redis
from sqlalchemy.orm import Session

from auth.auth_handler import decode_token
from config import get_settings
from db.database import User, get_db


bearer_scheme = HTTPBearer()
settings = get_settings()
redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        is_blacklisted = redis_client.get(f"blacklist:{token}")
    except Exception:
        is_blacklisted = False
    if is_blacklisted:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

    user = db.get(User, UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or missing user")
    return user


def blacklist_token(token: str, seconds: int) -> None:
    try:
        redis_client.setex(f"blacklist:{token}", seconds, "1")
    except Exception:
        return
