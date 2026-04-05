"""Authentication router."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import JWTError, jwt
import bcrypt
import httpx
import os

from core.database import get_db
from models.user import User
from crud.user_crud import UserCRUD
from schemas.user import UserCreate, UserLogin, UserResponse, UserProfile, Token

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
WORLD_APP_ID = os.getenv("WORLD_APP_ID", "app_0xe446214402fd8f70e43adaaf0cde8244782933d8fc4a67b434e16bbcde665180")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = UserCRUD.get_user(db, user_id=user_id)
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if UserCRUD.get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_dict = user_data.model_dump(exclude={"password", "biometric_data"})
    user_dict["hashed_password"] = get_password_hash(user_data.password)
    user_dict["identity_commitment"] = get_password_hash(user_data.email + str(datetime.utcnow()))

    db_user = UserCRUD.create_user(db, user_dict)

    access_token = create_access_token(
        data={"sub": db_user.id}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(db_user)
    }


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = None
    if login_data.email and login_data.password:
        user = UserCRUD.get_user_by_email(db, login_data.email)
        if user and user.hashed_password and not verify_password(login_data.password, user.hashed_password):
            user = None
    elif login_data.did:
        user = UserCRUD.get_user_by_did(db, login_data.did)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")

    UserCRUD.update_last_login(db, user.id)

    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


@router.post("/verify")
async def verify_token(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = UserCRUD.get_user(db, user_id=user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return {
        "valid": True,
        "user_id": user.id,
        "did": user.did,
        "is_verified": user.is_verified,
    }


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserProfile.model_validate(current_user)


# ==================== World ID Authentication ====================

class WorldIDRequest(BaseModel):
    nullifier_hash: str
    merkle_root: str
    proof: str
    verification_level: str
    action: str


@router.post("/world-id", response_model=Token)
async def world_id_login(request: WorldIDRequest, db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"World ID request received: action={request.action}, app_id={WORLD_APP_ID}")
    
    if not WORLD_APP_ID or WORLD_APP_ID == "dev-world-app-id":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="WORLD_APP_ID not configured in environment",
        )

    # Verify the proof with Worldcoin's verify endpoint
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://developer.worldcoin.org/api/v2/verify",
                json={
                    "app_id": WORLD_APP_ID,
                    "action": request.action,
                    "signal": request.action.replace("shoutaloud-", ""),
                    "proof": request.proof,
                    "merkle_root": request.merkle_root,
                    "nullifier_hash": request.nullifier_hash,
                },
                timeout=30.0,
            )
            result = response.json()
            logger.info(f"Worldcoin API response: {result}")

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"World ID verification failed: {result.get('detail', result.get('code', 'Unknown error'))}",
            )
    except httpx.RequestError as e:
        logger.error(f"Worldcoin API request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not reach Worldcoin API: {str(e)}",
        )

    # Check if user exists by nullifier_hash (stored as DID)
    did = f"did:world:{request.nullifier_hash}"
    user = UserCRUD.get_user_by_did(db, did)

    if not user:
        # Create new user
        user_dict = {
            "did": did,
            "identity_commitment": did,
            "is_verified": True,
            "is_active": True,
        }
        user = UserCRUD.create_user(db, user_dict)
        logger.info(f"New user created with DID: {did}")

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    UserCRUD.update_last_login(db, user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }
