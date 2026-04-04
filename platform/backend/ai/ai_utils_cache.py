# backend/ai/utils.py
"""
Utility functions for AI legal analyzer
"""

import re
import unicodedata
from typing import List, Dict, Any, Tuple
from collections import Counter
import numpy as np
from langdetect import detect
import spacy
from textstat import flesch_reading_ease, flesch_kincaid_grade

# Load spaCy models for different languages
try:
    nlp_es = spacy.load("es_core_news_sm")
except:
    nlp_es = None
    
try:
    nlp_en = spacy.load("en_core_web_sm")
except:
    nlp_en = None
    
try:
    nlp_pt = spacy.load("pt_core_news_sm")
except:
    nlp_pt = None


def detect_language(text: str) -> str:
    """
    Detect the language of the text
    
    Args:
        text: Input text
        
    Returns:
        Language code (es, en, pt)
    """
    try:
        lang = detect(text)
        if lang in ['es', 'en', 'pt']:
            return lang
        # Default to Spanish for Latin American context
        return 'es'
    except:
        # Default to Spanish if detection fails
        return 'es'


def clean_text(text: str) -> str:
    """
    Clean and normalize text
    
    Args:
        text: Input text
        
    Returns:
        Cleaned text
    """
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    # Normalize unicode
    text = unicodedata.normalize('NFKD', text)
    
    # Remove special characters but keep important punctuation
    text = re.sub(r'[^\w\s\-.,;:!?¿¡()áéíóúñÁÉÍÓÚÑàèìòùÀÈÌÒÙãõÃÕâêîôûÂÊÎÔÛ]', ' ', text)
    
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()


def extract_key_points(text: str, language: str = 'es', max_points: int = 5) -> List[str]:
    """
    Extract key points from text using NLP
    
    Args:
        text: Input text
        language: Language code
        max_points: Maximum number of key points
        
    Returns:
        List of key points
    """
    # Select appropriate spaCy model
    nlp = None
    if language == 'es' and nlp_es:
        nlp = nlp_es
    elif language == 'en' and nlp_en:
        nlp = nlp_en
    elif language == 'pt' and nlp_pt:
        nlp = nlp_pt
    
    if not nlp:
        # Fallback to simple sentence extraction
        return extract_sentences_simple(text, max_points)
    
    # Process text
    doc = nlp(text[:1000000])  # Limit text length for processing
    
    # Extract sentences with important entities or noun phrases
    key_sentences = []
    
    for sent in doc.sents:
        # Skip very short or very long sentences
        if len(sent.text.split()) < 5 or len(sent.text.split()) > 50:
            continue
        
        # Check for important entities
        has_important_entity = any(
            ent.label_ in ['ORG', 'LAW', 'MONEY', 'DATE', 'GPE']
            for ent in sent.ents
        )
        
        # Check for important noun phrases
        important_phrases = [
            chunk for chunk in sent.noun_chunks
            if len(chunk.text.split()) > 1
        ]
        
        # Score sentence importance
        score = 0
        if has_important_entity:
            score += 2
        score += len(important_phrases)
        
        # Check for action verbs
        action_verbs = [token for token in sent if token.pos_ == 'VERB']
        score += len(action_verbs) * 0.5
        
        key_sentences.append((score, sent.text.strip()))
    
    # Sort by score and return top sentences
    key_sentences.sort(key=lambda x: x[0], reverse=True)
    
    return [sent for _, sent in key_sentences[:max_points]]


def extract_sentences_simple(text: str, max_sentences: int = 5) -> List[str]:
    """
    Simple sentence extraction fallback
    
    Args:
        text: Input text
        max_sentences: Maximum number of sentences
        
    Returns:
        List of sentences
    """
    # Split into sentences
    sentences = re.split(r'[.!?]\s+', text)
    
    # Filter and clean sentences
    valid_sentences = []
    for sent in sentences:
        sent = sent.strip()
        if len(sent.split()) >= 5 and len(sent.split()) <= 50:
            valid_sentences.append(sent)
    
    # Return first N sentences
    return valid_sentences[:max_sentences]


def calculate_readability_score(text: str, language: str = 'es') -> Dict[str, float]:
    """
    Calculate readability scores for text
    
    Args:
        text: Input text
        language: Language code
        
    Returns:
        Dictionary with readability scores
    """
    try:
        # Calculate basic metrics
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        
        word_count = len(words)
        sentence_count = len([s for s in sentences if s.strip()])
        
        if sentence_count == 0:
            return {"score": 0, "grade_level": 0, "difficulty": "unknown"}
        
        # Average words per sentence
        avg_words_per_sentence = word_count / sentence_count
        
        # Calculate syllables (simplified for Spanish)
        syllable_count = sum(count_syllables(word) for word in words)
        avg_syllables_per_word = syllable_count / word_count if word_count > 0 else 0
        
        # Flesch Reading Ease adapted for Spanish
        # Original formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
        # Spanish adaptation uses different constants
        if language == 'es':
            flesch_score = 206.84 - (0.60 * avg_words_per_sentence) - (102 * avg_syllables_per_word)
        else:
            flesch_score = 206.835 - (1.015 * avg_words_per_sentence) - (84.6 * avg_syllables_per_word)
        
        # Determine difficulty level
        if flesch_score >= 90:
            difficulty = "very_easy"
            grade_level = 5
        elif flesch_score >= 80:
            difficulty = "easy"
            grade_level = 6
        elif flesch_score >= 70:
            difficulty = "fairly_easy"
            grade_level = 7
        elif flesch_score >= 60:
            difficulty = "standard"
            grade_level = 10
        elif flesch_score >= 50:
            difficulty = "fairly_difficult"
            grade_level = 12
        elif flesch_score >= 30:
            difficulty = "difficult"
            grade_level = 15
        else:
            difficulty = "very_difficult"
            grade_level = 18
        
        return {
            "flesch_score": max(0, min(100, flesch_score)),
            "grade_level": grade_level,
            "difficulty": difficulty,
            "avg_words_per_sentence": avg_words_per_sentence,
            "avg_syllables_per_word": avg_syllables_per_word
        }
        
    except Exception as e:
        return {"score": 0, "grade_level": 0, "difficulty": "unknown", "error": str(e)}


def count_syllables(word: str) -> int:
    """
    Count syllables in a word (simplified for Spanish)
    
    Args:
        word: Input word
        
    Returns:
        Number of syllables
    """
    word = word.lower()
    vowels = 'aeiouáéíóúü'
    syllable_count = 0
    previous_was_vowel = False
    
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not previous_was_vowel:
            syllable_count += 1
        previous_was_vowel = is_vowel
    
    # Ensure at least one syllable
    return max(1, syllable_count)


def detect_bias(text: str, language: str = 'es') -> Dict[str, Any]:
    """
    Detect potential bias in text
    
    Args:
        text: Input text
        language: Language code
        
    Returns:
        Bias analysis results
    """
    bias_indicators = {
        'es': {
            'gender': {
                'masculine': ['hombre', 'masculino', 'varón', 'caballero'],
                'feminine': ['mujer', 'femenino', 'dama', 'señora']
            },
            'economic': {
                'wealthy': ['rico', 'adinerado', 'próspero', 'acomodado'],
                'poor': ['pobre', 'necesitado', 'carente', 'desfavorecido']
            },
            'political': {
                'left': ['izquierda', 'progresista', 'liberal', 'socialista'],
                'right': ['derecha', 'conservador', 'tradicional', 'capitalista']
            }
        },
        'en': {
            'gender': {
                'masculine': ['man', 'male', 'masculine', 'gentleman'],
                'feminine': ['woman', 'female', 'feminine', 'lady']
            },
            'economic': {
                'wealthy': ['rich', 'wealthy', 'prosperous', 'affluent'],
                'poor': ['poor', 'needy', 'impoverished', 'disadvantaged']
            },
            'political': {
                'left': ['left', 'progressive', 'liberal', 'socialist'],
                'right': ['right', 'conservative', 'traditional', 'capitalist']
            }
        }
    }
    
    # Get indicators for language
    indicators = bias_indicators.get(language, bias_indicators['es'])
    
    # Count occurrences
    text_lower = text.lower()
    bias_counts = {}
    
    for bias_type, categories in indicators.items():
        bias_counts[bias_type] = {}
        for category, words in categories.items():
            count = sum(text_lower.count(word) for word in words)
            bias_counts[bias_type][category] = count
    
    # Calculate bias scores
    bias_detected = False
    bias_summary = []
    
    for bias_type, counts in bias_counts.items():
        total = sum(counts.values())
        if total > 0:
            # Check for imbalance
            max_category = max(counts, key=counts.get)
            max_count = counts[max_category]
            
            if max_count / total > 0.7:  # 70% threshold
                bias_detected = True
                bias_summary.append({
                    'type': bias_type,
                    'direction': max_category,
                    'strength': max_count / total
                })
    
    return {
        'bias_detected': bias_detected,
        'bias_types': bias_summary,
        'counts': bias_counts
    }


def extract_numbers_and_amounts(text: str) -> List[Dict[str, Any]]:
    """
    Extract numbers, percentages, and monetary amounts from text
    
    Args:
        text: Input text
        
    Returns:
        List of extracted numbers with context
    """
    extractions = []
    
    # Monetary amounts
    money_patterns = [
        (r'\$\s*[\d,]+(?:\.\d{2})?', 'money_usd'),
        (r'[\d,]+(?:\.\d{2})?\s*(?:pesos|MXN)', 'money_mxn'),
        (r'[\d,]+(?:\.\d{2})?\s*(?:dólares|USD)', 'money_usd'),
        (r'[\d,]+(?:\.\d{2})?\s*(?:euros|EUR)', 'money_eur'),
    ]
    
    for pattern, money_type in money_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            extractions.append({
                'type': money_type,
                'value': match.group(),
                'position': match.start(),
                'context': text[max(0, match.start()-50):match.end()+50]
            })
    
    # Percentages
    percentage_pattern = r'[\d,]+(?:\.\d+)?\s*%'
    for match in re.finditer(percentage_pattern, text):
        extractions.append({
            'type': 'percentage',
            'value': match.group(),
            'position': match.start(),
            'context': text[max(0, match.start()-50):match.end()+50]
        })
    
    # General numbers with context
    number_pattern = r'\b\d+(?:[,\.]\d+)*\b'
    for match in re.finditer(number_pattern, text):
        # Skip if already captured as money or percentage
        if not any(match.start() >= e['position'] and match.start() <= e['position'] + len(e['value']) 
                  for e in extractions):
            # Try to determine what the number represents
            context = text[max(0, match.start()-30):match.end()+30].lower()
            
            num_type = 'general'
            if any(word in context for word in ['año', 'años', 'year', 'years']):
                num_type = 'duration_years'
            elif any(word in context for word in ['día', 'días', 'day', 'days']):
                num_type = 'duration_days'
            elif any(word in context for word in ['persona', 'personas', 'people', 'person']):
                num_type = 'people_count'
            
            extractions.append({
                'type': num_type,
                'value': match.group(),
                'position': match.start(),
                'context': context
            })
    
    return extractions


def summarize_impact_by_demographic(
    text: str,
    demographics: List[str],
    language: str = 'es'
) -> Dict[str, List[str]]:
    """
    Analyze impact by demographic group
    
    Args:
        text: Input text
        demographics: List of demographic groups to analyze
        language: Language code
        
    Returns:
        Impact summary by demographic
    """
    demographic_keywords = {
        'es': {
            'youth': ['joven', 'jóvenes', 'juventud', 'estudiante', 'adolescente'],
            'elderly': ['adulto mayor', 'anciano', 'tercera edad', 'pensionado', 'jubilado'],
            'women': ['mujer', 'mujeres', 'femenino', 'género', 'materna'],
            'workers': ['trabajador', 'empleado', 'obrero', 'laboral', 'empleo'],
            'business': ['empresa', 'empresario', 'negocio', 'comercio', 'industria'],
            'students': ['estudiante', 'alumno', 'escolar', 'universitario', 'educación'],
            'families': ['familia', 'hogar', 'hijos', 'padres', 'familiar'],
            'disabled': ['discapacidad', 'discapacitado', 'capacidades diferentes', 'inclusión']
        }
    }
    
    keywords = demographic_keywords.get(language, demographic_keywords['es'])
    text_lower = text.lower()
    
    impact_summary = {}
    
    for demographic in demographics:
        if demographic in keywords:
            # Find sentences mentioning this demographic
            sentences = re.split(r'[.!?]+', text)
            relevant_sentences = []
            
            for sent in sentences:
                sent_lower = sent.lower()
                if any(keyword in sent_lower for keyword in keywords[demographic]):
                    relevant_sentences.append(sent.strip())
            
            impact_summary[demographic] = relevant_sentences[:3]  # Top 3 relevant sentences
    
    return impact_summary


# backend/ai/cache.py
"""
Caching system for AI analysis results
"""

import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any
import aiofiles
import redis.asyncio as redis
from functools import lru_cache

from .config import CACHE_DIR, ANALYSIS_CONFIG


class AnalysisCache:
    """
    Cache system for analysis results
    Supports both file-based and Redis caching
    """
    
    def __init__(self, use_redis: bool = False, redis_url: str = None):
        """
        Initialize cache system
        
        Args:
            use_redis: Whether to use Redis for caching
            redis_url: Redis connection URL
        """
        self.use_redis = use_redis
        self.redis_client = None
        self.cache_dir = CACHE_DIR
        self.ttl = ANALYSIS_CONFIG["cache_ttl"]
        
        if use_redis and redis_url:
            self._init_redis(redis_url)
    
    def _init_redis(self, redis_url: str):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        except Exception as e:
            print(f"Failed to connect to Redis: {e}")
            self.use_redis = False
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached analysis result
        
        Args:
            key: Cache key (document hash)
            
        Returns:
            Cached analysis or None
        """
        if self.use_redis and self.redis_client:
            return await self._get_redis(key)
        else:
            return await self._get_file(key)
    
    async def set(self, key: str, value: Dict[str, Any]):
        """
        Cache analysis result
        
        Args:
            key: Cache key (document hash)
            value: Analysis result to cache
        """
        if self.use_redis and self.redis_client:
            await self._set_redis(key, value)
        else:
            await self._set_file(key, value)
    
    async def _get_redis(self, key: str) -> Optional[Dict[str, Any]]:
        """Get from Redis cache"""
        try:
            data = await self.redis_client.get(f"analysis:{key}")
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Redis get error: {e}")
        return None
    
    async def _set_redis(self, key: str, value: Dict[str, Any]):
        """Set in Redis cache"""
        try:
            await self.redis_client.setex(
                f"analysis:{key}",
                self.ttl,
                json.dumps(value, ensure_ascii=False)
            )
        except Exception as e:
            print(f"Redis set error: {e}")
    
    async def _get_file(self, key: str) -> Optional[Dict[str, Any]]:
        """Get from file cache"""
        cache_file = self.cache_dir / f"{key}.json"
        
        if not cache_file.exists():
            return None
        
        try:
            # Check if cache is expired
            file_age = datetime.now() - datetime.fromtimestamp(cache_file.stat().st_mtime)
            if file_age > timedelta(seconds=self.ttl):
                cache_file.unlink()  # Delete expired cache
                return None
            
            async with aiofiles.open(cache_file, 'r', encoding='utf-8') as f:
                data = await f.read()
                return json.loads(data)
        except Exception as e:
            print(f"File cache get error: {e}")
            return None
    
    async def _set_file(self, key: str, value: Dict[str, Any]):
        """Set in file cache"""
        cache_file = self.cache_dir / f"{key}.json"
        
        try:
            async with aiofiles.open(cache_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(value, ensure_ascii=False, indent=2))
        except Exception as e:
            print(f"File cache set error: {e}")
    
    async def clear(self):
        """Clear all cache"""
        if self.use_redis and self.redis_client:
            # Clear Redis cache
            async for key in self.redis_client.scan_iter("analysis:*"):
                await self.redis_client.delete(key)
        
        # Clear file cache
        for cache_file in self.cache_dir.glob("*.json"):
            cache_file.unlink()
    
    async def close(self):
        """Close cache connections"""
        if self.redis_client:
            await self.redis_client.close()


# backend/ai/api.py
"""
REST API for AI Legal Analyzer
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import logging

from .legal_analyzer import LegalAnalyzer
from .config import MODELS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Shout Aloud AI Legal Analyzer",
    description="AI-powered legal document analysis for citizens",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzer
analyzer = None


class AnalysisRequest(BaseModel):
    """Request model for document analysis"""
    text: str
    metadata: Optional[Dict[str, Any]] = None
    user_context: Optional[Dict[str, Any]] = None


class AnalysisResponse(BaseModel):
    """Response model for document analysis"""
    analysis: Dict[str, Any]
    status: str
    document_id: Optional[str] = None


class BatchAnalysisRequest(BaseModel):
    """Request model for batch analysis"""
    documents: List[Dict[str, Any]]
    user_context: Optional[Dict[str, Any]] = None


@app.on_event("startup")
async def startup_event():
    """Initialize analyzer on startup"""
    global analyzer
    analyzer = LegalAnalyzer(model_name="llama2-spanish")
    logger.info("AI Legal Analyzer initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    if analyzer:
        analyzer.cleanup()
    logger.info("AI Legal Analyzer shut down")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Shout Aloud AI Legal Analyzer",
        "status": "running",
        "available_models": list(MODELS.keys())
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_document(request: AnalysisRequest):
    """
    Analyze a legal document
    
    Args:
        request: Analysis request with document text
        
    Returns:
        Analysis results
    """
    try:
        if not analyzer:
            raise HTTPException(status_code=503, detail="Analyzer not initialized")
        
        # Perform analysis
        analysis = await analyzer.analyze_document(
            request.text,
            request.metadata,
            request.user_context
        )
        
        return AnalysisResponse(
            analysis=analysis,
            status="success",
            document_id=analysis["metadata"]["document_hash"]
        )
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/batch")
async def analyze_batch(
    request: BatchAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze multiple documents in batch
    
    Args:
        request: Batch analysis request
        background_tasks: FastAPI background tasks
        
    Returns:
        Batch ID for tracking
    """
    try:
        if not analyzer:
            raise HTTPException(status_code=503, detail="Analyzer not initialized")
        
        # Generate batch ID
        import uuid
        batch_id = str(uuid.uuid4())
        
        # Start background analysis
        background_tasks.add_task(
            analyzer.analyze_batch,
            request.documents,
            request.user_context
        )
        
        return {
            "batch_id": batch_id,
            "status": "processing",
            "document_count": len(request.documents)
        }
        
    except Exception as e:
        logger.error(f"Batch analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "analyzer_loaded": analyzer is not None
    }


if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )