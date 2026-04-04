"""AI Analysis router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from crud.proposal_crud import ProposalCRUD
from schemas.user import AIAnalysisRequest, AIAnalysisResponse

router = APIRouter()


@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_text(request: AIAnalysisRequest, db: Session = Depends(get_db)):
    return AIAnalysisResponse(
        personal_impact="Análisis pendiente de implementación con modelo AI",
        beneficiaries=["Ciudadanos en general"],
        fairness_score=0.5,
        recommendation="Se requiere integración con modelo de lenguaje",
        confidence=0.0,
        summary="AI analysis module not yet connected to a language model",
        benefits=[],
        risks=[]
    )


@router.post("/proposal/{proposal_id}", response_model=AIAnalysisResponse)
async def analyze_proposal(proposal_id: int, db: Session = Depends(get_db)):
    proposal = ProposalCRUD.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if proposal.ai_analysis:
        return AIAnalysisResponse(**proposal.ai_analysis)

    return AIAnalysisResponse(
        personal_impact=[],
        beneficiaries=[],
        fairness_score=0.0,
        recommendation="Pending analysis",
        confidence=0.0,
        summary="No analysis available yet",
        benefits=[],
        risks=[]
    )
