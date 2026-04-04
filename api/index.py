"""
ShoutAloud Backend API - Vercel Serverless
Complete API with all modules connected to Neon PostgreSQL.
"""
import os
import sys
import math
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, text, func, or_, and_, desc, Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint, Index, MetaData
from sqlalchemy.orm import sessionmaker, Session, declarative_base, relationship
from pydantic import BaseModel, EmailStr
from pydantic import ConfigDict
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import hashlib

# ==================== Configuration ====================
DATABASE_URL = os.getenv("SHOUTALOUD_DATABASE_URL", os.getenv("DATABASE_URL"))
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# ==================== Database ====================
if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    engine = None
    SessionLocal = None

Base = declarative_base()

# ==================== Models ====================
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    did = Column(String(255), unique=True, nullable=False, index=True)
    identity_commitment = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    username = Column(String(50), unique=True, nullable=True, index=True)
    full_name = Column(String(100))
    municipality_code = Column(Integer, nullable=False, index=True, default=0)
    state_code = Column(Integer, nullable=False, index=True, default=0)
    country_code = Column(String(3), default="MX", nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_official = Column(Boolean, default=False)
    verification_date = Column(DateTime, nullable=True)
    reputation_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    @classmethod
    def generate_did(cls, email: str) -> str:
        timestamp = str(int(datetime.utcnow().timestamp()))
        data = f"{email}:{timestamp}:{secrets.token_hex(16)}"
        hash_value = hashlib.sha256(data.encode()).hexdigest()
        return f"did:shout:{hash_value[:32]}"


class Proposal(Base):
    __tablename__ = "proposals"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    scope = Column(String(50), nullable=False, index=True)
    municipality_code = Column(Integer, nullable=True, index=True)
    state_code = Column(Integer, nullable=True, index=True)
    country_code = Column(String(3), default="MX", nullable=False)
    status = Column(String(50), default="active", nullable=False, index=True)
    source_url = Column(Text, nullable=True)
    author = Column(String(255), nullable=True)
    author_institution = Column(String(255), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    official_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    budget = Column(Float, default=0.0)
    vote_count = Column(Integer, default=0)
    support_count = Column(Integer, default=0)
    rejection_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    attachment_url = Column(String(500))
    ipfs_hash = Column(String(100))
    blockchain_tx = Column(String(100))
    deadline = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime)
    closed_at = Column(DateTime)
    ai_analysis = Column(JSON, nullable=True)
    analysis_updated_at = Column(DateTime, nullable=True)


class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vote_value = Column(Integer, nullable=False)
    nullifier_hash = Column(String(255), unique=True, nullable=False, index=True)
    vote_commitment = Column(String(255), nullable=False)
    zk_proof = Column(JSON, nullable=True)
    municipality_code = Column(Integer, nullable=False, index=True, default=0)
    state_code = Column(Integer, nullable=False, index=True, default=0)
    country_code = Column(String(3), default="MX", nullable=False)
    weight = Column(Float, default=1.0)
    justification = Column(Text)
    ipfs_hash = Column(String(100))
    blockchain_tx = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ip_hash = Column(String(255), nullable=True)
    __table_args__ = (
        UniqueConstraint('proposal_id', 'user_id', name='unique_vote_per_user_per_proposal'),
    )


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    is_edited = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Official(Base):
    __tablename__ = "officials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    position = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False, index=True)
    municipality_code = Column(Integer, nullable=True, index=True)
    state_code = Column(Integer, nullable=True, index=True)
    country_code = Column(String(3), default="MX", nullable=False)
    party = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    photo_url = Column(String(255), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    biography = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    weight = Column(Float, default=1.0, nullable=False)
    description = Column(Text, nullable=True)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Rating(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True, index=True)
    official_id = Column(Integer, ForeignKey("officials.id"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    municipality_code = Column(Integer, nullable=False, index=True, default=0)
    state_code = Column(Integer, nullable=False, index=True, default=0)
    country_code = Column(String(3), default="MX", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    __table_args__ = (
        UniqueConstraint('official_id', 'user_id', name='unique_rating_per_user_per_official'),
    )


class ModerationReport(Base):
    __tablename__ = "moderation_reports"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_type = Column(String(50), nullable=False)
    content_id = Column(Integer, nullable=False)
    reason = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending", index=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReputationScore(Base):
    __tablename__ = "reputation_scores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    official_id = Column(Integer, ForeignKey("officials.id"), nullable=True, index=True)
    scope = Column(String(20), default="global", index=True)
    participation_score = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    verification_score = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (
        UniqueConstraint('user_id', 'official_id', 'scope', name='unique_reputation'),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    event_data = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


# ==================== Schemas ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    full_name: Optional[str] = None
    municipality_code: int = 0
    state_code: int = 0
    country_code: str = "MX"

class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    did: Optional[str] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    did: str
    email: Optional[str] = None
    username: Optional[str] = None
    municipality_code: int
    state_code: int
    is_active: bool
    is_verified: bool
    created_at: datetime

class UserProfile(UserResponse):
    full_name: Optional[str] = None
    verification_date: Optional[datetime] = None
    reputation_score: float = 0.0
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProposalCreate(BaseModel):
    title: str
    summary: str
    content: str
    category: str
    scope: str
    municipality_code: Optional[int] = None
    state_code: Optional[int] = None
    author: Optional[str] = None
    source_url: Optional[str] = None
    deadline: Optional[datetime] = None

class ProposalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    summary: str
    content: str
    category: str
    scope: str
    status: str
    author: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    vote_count: int = 0
    support_count: int = 0
    comment_count: int = 0
    ai_analysis: Optional[Dict[str, Any]] = None

class ProposalList(BaseModel):
    results: List[ProposalResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class VoteCreate(BaseModel):
    vote: int
    nullifier_hash: str
    vote_commitment: str
    zk_proof: Optional[Dict[str, Any]] = None
    justification: Optional[str] = None

class VoteResults(BaseModel):
    proposal_id: int
    yes_votes: int
    no_votes: int
    abstain_votes: int
    total_votes: int
    yes_percentage: float
    no_percentage: float
    abstain_percentage: float

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content: str
    author_id: int
    proposal_id: int
    parent_id: Optional[int] = None
    upvotes: int
    downvotes: int
    created_at: datetime

class OfficialCreate(BaseModel):
    name: str
    position: str
    level: str
    municipality_code: Optional[int] = None
    state_code: Optional[int] = None
    party: Optional[str] = None
    biography: Optional[str] = None

class OfficialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    position: str
    level: str
    party: Optional[str] = None
    is_active: bool
    created_at: datetime

class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    category: str
    weight: float
    description: Optional[str] = None

class RatingCreate(BaseModel):
    official_id: int
    tag_id: int

class RatingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    official_id: int
    tag_id: int
    created_at: datetime
    tag: Optional[TagResponse] = None

class OfficialRatingSummary(BaseModel):
    official_id: int
    total_ratings: int
    tag_summary: Dict[str, Dict[str, Any]]

class ModerationReportCreate(BaseModel):
    content_type: str
    content_id: int
    reason: str
    description: Optional[str] = None

class ModerationReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content_type: str
    content_id: int
    reason: str
    status: str
    created_at: datetime

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

class ReputationResponse(BaseModel):
    user_id: int
    overall_score: float
    participation_score: float
    quality_score: float
    verification_score: float
    consistency_score: float
    level: str

class PlatformStats(BaseModel):
    total_users: int
    total_proposals: int
    active_proposals: int
    total_votes: int
    total_officials: int
    total_ratings: int
    recent_votes_30d: int
    recent_users_30d: int
    participation_rate: float

class AIAnalysisRequest(BaseModel):
    text: str
    analysis_type: Optional[str] = "comprehensive"

class AIAnalysisResponse(BaseModel):
    personal_impact: str
    beneficiaries: List[str]
    fairness_score: float
    recommendation: str
    confidence: float
    summary: Optional[str] = None

# ==================== App ====================
app = FastAPI(
    title="ShoutAloud API",
    description="Decentralized Citizen Governance Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== Helpers ====================
def get_db():
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="Database not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_tables():
    """Create all tables if they don't exist."""
    if engine:
        Base.metadata.create_all(bind=engine)
        seed_default_tags()

def seed_default_tags():
    """Insert default tags if table is empty."""
    if not SessionLocal:
        return
    db = SessionLocal()
    try:
        if db.query(Tag).count() == 0:
            default_tags = [
                Tag(name="ético", category="positive", weight=1.2, description="Actúa con integridad"),
                Tag(name="transparente", category="positive", weight=1.1, description="Información clara"),
                Tag(name="eficiente", category="positive", weight=1.0, description="Resultados óptimos"),
                Tag(name="cumple_promesas", category="positive", weight=1.3, description="Ejecuta lo prometido"),
                Tag(name="corrupto", category="negative", weight=-1.5, description="Actos de corrupción"),
                Tag(name="mentiroso", category="negative", weight=-1.3, description="Falta a la verdad"),
                Tag(name="ineficiente", category="negative", weight=-1.0, description="Sin resultados"),
                Tag(name="autoritario", category="negative", weight=-1.2, description="Impone decisiones"),
                Tag(name="nuevo", category="neutral", weight=0.0, description="Primera vez en cargo"),
                Tag(name="veterano", category="neutral", weight=0.0, description="Experiencia extensa"),
            ]
            for tag in default_tags:
                db.add(tag)
            db.commit()
    finally:
        db.close()

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_reputation_level(score: float) -> str:
    if score >= 80: return "Guardián"
    if score >= 60: return "Líder"
    if score >= 40: return "Activista"
    if score >= 20: return "Ciudadano"
    return "Nuevo"

# ==================== Health & Root ====================
@app.get("/")
async def root():
    return {"message": "ShoutAloud API v2.0.0", "status": "online", "docs": "/docs"}

@app.get("/health")
async def health():
    db_status = "not_configured"
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception:
            db_status = "error"
    return {"status": "healthy", "service": "ShoutAloud Backend", "version": "2.0.0", "database": db_status}

@app.post("/api/db/init")
async def init_database():
    """Initialize database tables. Call once after deployment."""
    if not engine:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        init_tables()
        metadata = MetaData()
        metadata.reflect(bind=engine)
        tables = list(metadata.tables.keys())
        return {"status": "ok", "tables": tables, "count": len(tables)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Auth ====================
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_dict = user_data.model_dump()
    user_dict["did"] = User.generate_did(user_data.email)
    user_dict["hashed_password"] = hash_password(user_data.pop("password"))
    user_dict["identity_commitment"] = hash_password(user_data["email"] + str(datetime.utcnow()))
    db_user = User(**user_dict)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    token = create_access_token(data={"sub": db_user.id})
    return {"access_token": token, "token_type": "bearer", "user": UserResponse.model_validate(db_user)}

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = None
    if login_data.email and login_data.password:
        user = db.query(User).filter(User.email == login_data.email).first()
        if user and user.hashed_password and not verify_password(login_data.password, user.hashed_password):
            user = None
    elif login_data.did:
        user = db.query(User).filter(User.did == login_data.did).first()
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_access_token(data={"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": UserResponse.model_validate(user)}

@app.get("/api/auth/me", response_model=UserProfile)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserProfile.model_validate(current_user)

# ==================== Proposals ====================
@app.get("/api/proposals", response_model=ProposalList)
async def list_proposals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    scope: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Proposal)
    if scope: q = q.filter(Proposal.scope == scope)
    if category: q = q.filter(Proposal.category == category)
    if status: q = q.filter(Proposal.status == status)
    if search:
        q = q.filter(or_(Proposal.title.ilike(f"%{search}%"), Proposal.summary.ilike(f"%{search}%")))
    total = q.count()
    proposals = q.order_by(desc(Proposal.created_at)).offset(skip).limit(limit).all()
    return ProposalList(
        results=[ProposalResponse.model_validate(p) for p in proposals],
        total=total, page=(skip // limit) + 1, per_page=limit,
        total_pages=math.ceil(total / limit) if total > 0 else 0
    )

@app.post("/api/proposals", response_model=ProposalResponse, status_code=201)
async def create_proposal(proposal: ProposalCreate, db: Session = Depends(get_db)):
    db_proposal = Proposal(**proposal.model_dump())
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    return ProposalResponse.model_validate(db_proposal)

@app.get("/api/proposals/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    p = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return ProposalResponse.model_validate(p)

@app.put("/api/proposals/{proposal_id}", response_model=ProposalResponse)
async def update_proposal(proposal_id: int, proposal: ProposalCreate, db: Session = Depends(get_db)):
    p = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    for k, v in proposal.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return ProposalResponse.model_validate(p)

@app.delete("/api/proposals/{proposal_id}")
async def delete_proposal(proposal_id: int, db: Session = Depends(get_db)):
    p = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    db.delete(p)
    db.commit()
    return {"message": "Proposal deleted"}

# ==================== Voting ====================
@app.post("/api/voting/{proposal_id}", response_model=dict, status_code=201)
async def cast_vote(proposal_id: int, vote: VoteCreate, db: Session = Depends(get_db)):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    existing = db.query(Vote).filter(
        Vote.proposal_id == proposal_id,
        Vote.nullifier_hash == vote.nullifier_hash
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already voted")
    db_vote = Vote(
        proposal_id=proposal_id, user_id=0, vote_value=vote.vote,
        nullifier_hash=vote.nullifier_hash, vote_commitment=vote.vote_commitment,
        zk_proof=vote.zk_proof, justification=vote.justification
    )
    db.add(db_vote)
    if vote.vote == 1: proposal.support_count += 1
    elif vote.vote == 2: proposal.rejection_count += 1
    proposal.vote_count += 1
    db.commit()
    return {"message": "Vote recorded", "proposal_id": proposal_id, "vote": vote.vote}

@app.get("/api/voting/{proposal_id}/results", response_model=VoteResults)
async def get_vote_results(proposal_id: int, db: Session = Depends(get_db)):
    results = db.query(Vote.vote_value, func.count(Vote.id)).filter(
        Vote.proposal_id == proposal_id
    ).group_by(Vote.vote_value).all()
    counts = {1: 0, 2: 0, 3: 0}
    for v, c in results:
        counts[v] = c
    total = sum(counts.values())
    return VoteResults(
        proposal_id=proposal_id, yes_votes=counts[1], no_votes=counts[2], abstain_votes=counts[3],
        total_votes=total,
        yes_percentage=(counts[1]/total*100) if total > 0 else 0,
        no_percentage=(counts[2]/total*100) if total > 0 else 0,
        abstain_percentage=(counts[3]/total*100) if total > 0 else 0,
    )

# ==================== Comments ====================
@app.get("/api/proposals/{proposal_id}/comments", response_model=List[CommentResponse])
async def get_comments(proposal_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.proposal_id == proposal_id, Comment.is_hidden == False).order_by(Comment.created_at).all()
    return [CommentResponse.model_validate(c) for c in comments]

@app.post("/api/proposals/{proposal_id}/comments", response_model=CommentResponse, status_code=201)
async def add_comment(proposal_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    db_comment = Comment(
        content=comment.content, author_id=0, proposal_id=proposal_id, parent_id=comment.parent_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return CommentResponse.model_validate(db_comment)

# ==================== Officials ====================
@app.get("/api/officials", response_model=List[OfficialResponse])
async def list_officials(
    skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
    level: Optional[str] = None, db: Session = Depends(get_db)
):
    q = db.query(Official).filter(Official.is_active == True)
    if level: q = q.filter(Official.level == level)
    return [OfficialResponse.model_validate(o) for o in q.order_by(Official.name).offset(skip).limit(limit).all()]

@app.get("/api/officials/{official_id}", response_model=OfficialResponse)
async def get_official(official_id: int, db: Session = Depends(get_db)):
    o = db.query(Official).filter(Official.id == official_id).first()
    if not o: raise HTTPException(status_code=404, detail="Official not found")
    return OfficialResponse.model_validate(o)

# ==================== Ratings & Tags ====================
@app.get("/api/tags", response_model=List[TagResponse])
async def list_tags(db: Session = Depends(get_db)):
    return [TagResponse.model_validate(t) for t in db.query(Tag).filter(Tag.is_active == True).all()]

@app.post("/api/ratings", response_model=RatingResponse, status_code=201)
async def rate_official(rating: RatingCreate, db: Session = Depends(get_db)):
    existing = db.query(Rating).filter(Rating.official_id == rating.official_id, Rating.user_id == 0).first()
    if existing:
        existing.tag_id = rating.tag_id
        db.commit()
        db.refresh(existing)
        return RatingResponse.model_validate(existing)
    db_rating = Rating(official_id=rating.official_id, tag_id=rating.tag_id, user_id=0)
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    return RatingResponse.model_validate(db_rating)

@app.get("/api/officials/{official_id}/ratings/summary", response_model=OfficialRatingSummary)
async def get_official_ratings_summary(official_id: int, db: Session = Depends(get_db)):
    ratings = db.query(Rating, Tag).join(Tag).filter(Rating.official_id == official_id).all()
    tag_counts = {}
    for r, t in ratings:
        if t.name not in tag_counts:
            tag_counts[t.name] = {"count": 0, "category": t.category, "weight": t.weight}
        tag_counts[t.name]["count"] += 1
    total = len(ratings)
    for td in tag_counts.values():
        td["percentage"] = (td["count"] / total * 100) if total > 0 else 0
    return OfficialRatingSummary(official_id=official_id, total_ratings=total, tag_summary=tag_counts)

# ==================== Moderation ====================
@app.post("/api/moderation/reports", response_model=ModerationReportResponse, status_code=201)
async def create_report(report: ModerationReportCreate, db: Session = Depends(get_db)):
    db_report = ModerationReport(
        reporter_id=0, content_type=report.content_type, content_id=report.content_id,
        reason=report.reason, description=report.description
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return ModerationReportResponse.model_validate(db_report)

@app.get("/api/moderation/reports", response_model=List[ModerationReportResponse])
async def list_reports(status_filter: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(ModerationReport)
    if status_filter: q = q.filter(ModerationReport.status == status_filter)
    return [ModerationReportResponse.model_validate(r) for r in q.order_by(desc(ModerationReport.created_at)).all()]

@app.put("/api/moderation/reports/{report_id}/resolve", response_model=ModerationReportResponse)
async def resolve_report(report_id: int, resolution: str, db: Session = Depends(get_db)):
    r = db.query(ModerationReport).filter(ModerationReport.id == report_id).first()
    if not r: raise HTTPException(status_code=404, detail="Report not found")
    r.status = "resolved"
    r.resolution = resolution
    r.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return ModerationReportResponse.model_validate(r)

@app.post("/api/moderation/auto-check", response_model=dict)
async def auto_moderation_check(content: dict, db: Session = Depends(get_db)):
    text = content.get("text", "")
    flags = []
    spam_keywords = ["compra ahora", "oferta limitada", "click aquí", "gratis"]
    for kw in spam_keywords:
        if kw.lower() in text.lower():
            flags.append({"type": "spam", "keyword": kw})
    return {"flags": flags, "clean": len(flags) == 0, "message": "Auto-moderation check complete"}

# ==================== Notifications ====================
@app.get("/api/notifications", response_model=List[NotificationResponse])
async def get_notifications(user_id: int = Query(0), db: Session = Depends(get_db)):
    return [NotificationResponse.model_validate(n) for n in
            db.query(Notification).filter(Notification.user_id == user_id).order_by(desc(Notification.created_at)).limit(50).all()]

@app.put("/api/notifications/{notification_id}/read", response_model=dict)
async def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n: raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@app.get("/api/notifications/achievements", response_model=dict)
async def get_achievements(user_id: int = Query(0), db: Session = Depends(get_db)):
    vote_count = db.query(Vote).filter(Vote.user_id == user_id).count()
    proposal_count = db.query(Proposal).filter(Proposal.author_id == user_id).count()
    achievements = []
    if vote_count >= 1: achievements.append({"id": "first_vote", "name": "Primer Voto", "unlocked": True})
    if vote_count >= 10: achievements.append({"id": "active_voter", "name": "Votador Activo", "unlocked": True})
    if proposal_count >= 1: achievements.append({"id": "first_proposal", "name": "Primera Propuesta", "unlocked": True})
    return {"user_id": user_id, "achievements": achievements}

# ==================== Reputation ====================
@app.get("/api/reputation/{user_id}", response_model=ReputationResponse)
async def get_reputation(user_id: int, db: Session = Depends(get_db)):
    score = db.query(ReputationScore).filter(ReputationScore.user_id == user_id, ReputationScore.scope == "global").first()
    if not score:
        votes = db.query(Vote).filter(Vote.user_id == user_id).count()
        proposals = db.query(Proposal).filter(Proposal.author_id == user_id).count()
        overall = min(100, votes * 2 + proposals * 10)
        score = ReputationResponse(
            user_id=user_id, overall_score=overall,
            participation_score=min(100, votes * 5), quality_score=min(100, proposals * 20),
            verification_score=0.0, consistency_score=min(100, votes),
            level=get_reputation_level(overall)
        )
    else:
        score = ReputationResponse(
            user_id=score.user_id, overall_score=score.overall_score,
            participation_score=score.participation_score, quality_score=score.quality_score,
            verification_score=score.verification_score, consistency_score=score.consistency_score,
            level=get_reputation_level(score.overall_score)
        )
    return score

@app.get("/api/reputation/{user_id}/badges", response_model=dict)
async def get_badges(user_id: int, db: Session = Depends(get_db)):
    rep = await get_reputation(user_id, db)
    badges = []
    if rep.overall_score >= 20: badges.append({"name": "Ciudadano", "icon": "🏛️"})
    if rep.overall_score >= 40: badges.append({"name": "Activista", "icon": "✊"})
    if rep.overall_score >= 60: badges.append({"name": "Líder", "icon": "⭐"})
    if rep.overall_score >= 80: badges.append({"name": "Guardián", "icon": "🛡️"})
    return {"user_id": user_id, "badges": badges}

@app.get("/api/reputation/officials/{official_id}", response_model=dict)
async def get_official_reputation(official_id: int, db: Session = Depends(get_db)):
    summary = await get_official_ratings_summary(official_id, db)
    official = db.query(Official).filter(Official.id == official_id).first()
    if not official:
        raise HTTPException(status_code=404, detail="Official not found")
    positive = sum(v["count"] for v in summary.tag_summary.values() if v.get("category") == "positive")
    negative = sum(v["count"] for v in summary.tag_summary.values() if v.get("category") == "negative")
    total = summary.total_ratings
    score = ((positive - negative) / total * 50 + 50) if total > 0 else 50
    return {"official_id": official_id, "name": official.name, "score": score, "total_ratings": total, "tag_summary": summary.tag_summary}

# ==================== Analytics ====================
@app.get("/api/analytics/overview", response_model=PlatformStats)
async def get_platform_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_proposals = db.query(Proposal).count()
    active_proposals = db.query(Proposal).filter(Proposal.status == "active").count()
    total_votes = db.query(Vote).count()
    total_officials = db.query(Official).filter(Official.is_active == True).count()
    total_ratings = db.query(Rating).count()
    thirty_days = datetime.utcnow() - timedelta(days=30)
    recent_votes = db.query(Vote).filter(Vote.created_at >= thirty_days).count()
    recent_users = db.query(User).filter(User.created_at >= thirty_days).count()
    return PlatformStats(
        total_users=total_users, total_proposals=total_proposals, active_proposals=active_proposals,
        total_votes=total_votes, total_officials=total_officials, total_ratings=total_ratings,
        recent_votes_30d=recent_votes, recent_users_30d=recent_users,
        participation_rate=(total_votes / total_users * 100) if total_users > 0 else 0
    )

@app.get("/api/analytics/proposals", response_model=dict)
async def get_proposal_stats(db: Session = Depends(get_db)):
    by_scope = db.query(Proposal.scope, func.count(Proposal.id)).group_by(Proposal.scope).all()
    by_category = db.query(Proposal.category, func.count(Proposal.id)).group_by(Proposal.category).all()
    by_status = db.query(Proposal.status, func.count(Proposal.id)).group_by(Proposal.status).all()
    return {"by_scope": dict(by_scope), "by_category": dict(by_category), "by_status": dict(by_status)}

@app.get("/api/analytics/voting", response_model=dict)
async def get_voting_stats(db: Session = Depends(get_db)):
    by_value = db.query(Vote.vote_value, func.count(Vote.id)).group_by(Vote.vote_value).all()
    total = sum(c for _, c in by_value)
    vote_labels = {1: "yes", 2: "no", 3: "abstain"}
    return {"total_votes": total, "by_value": {vote_labels.get(v, str(v)): c for v, c in by_value}}

# ==================== AI Analysis ====================
@app.post("/api/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_text(request: AIAnalysisRequest, db: Session = Depends(get_db)):
    return AIAnalysisResponse(
        personal_impact="Análisis pendiente de integración con modelo AI",
        beneficiaries=["Ciudadanos en general"],
        fairness_score=0.5, recommendation="Se requiere integración con LLM",
        confidence=0.0, summary="AI module ready, awaiting model connection"
    )

# ==================== Startup ====================
@app.on_event("startup")
def startup():
    if engine:
        init_tables()
