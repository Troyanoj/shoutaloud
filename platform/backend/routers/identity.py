"""Identity router for DID and ZK proof management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.user import User
from crud.user_crud import UserCRUD
from schemas.identity import (
    DIDCreateRequest,
    DIDResponse,
    ZKVerifyRequest,
    ZKVerifyResponse,
    CredentialResponse,
    CredentialList,
)

router = APIRouter()


@router.post("/did", response_model=DIDResponse)
async def create_did(request: DIDCreateRequest, db: Session = Depends(get_db)):
    user = UserCRUD.get_user(db, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.did:
        user.did = User.generate_did(user.email or f"user_{user.id}")
        db.commit()
        db.refresh(user)
    return DIDResponse(
        did=user.did,
        verification_method=request.verification_method,
        created_at=user.created_at,
        status="active" if user.is_verified else "pending",
    )


@router.post("/verify", response_model=ZKVerifyResponse)
async def verify_identity(request: ZKVerifyRequest, db: Session = Depends(get_db)):
    return ZKVerifyResponse(
        valid=False,
        message="ZK proof verification not yet implemented. Requires circom circuits.",
    )


@router.get("/credentials", response_model=CredentialList)
async def get_credentials(db: Session = Depends(get_db)):
    return CredentialList(
        credentials=[],
        total=0,
    )
