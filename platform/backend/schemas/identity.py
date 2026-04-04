"""Identity schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class DIDCreateRequest(BaseModel):
    user_id: int
    verification_method: Optional[str] = "ed25519"


class DIDResponse(BaseModel):
    did: str
    verification_method: str
    created_at: datetime
    status: str


class ZKVerifyRequest(BaseModel):
    proof: Dict[str, Any]
    public_signals: Dict[str, Any]
    verification_type: str


class ZKVerifyResponse(BaseModel):
    valid: bool
    message: str
    identity_commitment: Optional[str] = None


class CredentialResponse(BaseModel):
    id: str
    type: str
    issuer: str
    issued_at: datetime
    expires_at: Optional[datetime] = None
    status: str


class CredentialList(BaseModel):
    credentials: List[CredentialResponse]
    total: int
