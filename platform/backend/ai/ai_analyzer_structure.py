# backend/ai/__init__.py
"""
AI Legal Document Analyzer for Shout Aloud
Analyzes legal texts and provides citizen-friendly explanations
"""

from .legal_analyzer import LegalAnalyzer
from .models import ModelManager
from .prompts import PromptTemplates

__version__ = "1.0.0"
__all__ = ["LegalAnalyzer", "ModelManager", "PromptTemplates"]


# backend/ai/config.py
"""
Configuration for AI models and analysis
"""

import os
from pathlib import Path
from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class ModelConfig:
    """Configuration for AI models"""
    name: str
    path: str
    context_length: int
    temperature: float
    max_tokens: int
    device: str = "cuda"  # cuda, cpu, or mps (Mac)
    quantization: str = "int8"  # int8, int4, or none
    
    @classmethod
    def from_dict(cls, config: Dict[str, Any]) -> "ModelConfig":
        return cls(**config)


# Model configurations
MODELS = {
    "llama2-7b": ModelConfig(
        name="llama2-7b",
        path="meta-llama/Llama-2-7b-chat-hf",
        context_length=4096,
        temperature=0.3,
        max_tokens=1024,
        quantization="int8"
    ),
    "llama2-13b": ModelConfig(
        name="llama2-13b",
        path="meta-llama/Llama-2-13b-chat-hf",
        context_length=4096,
        temperature=0.3,
        max_tokens=1024,
        quantization="int8"
    ),
    "mistral-7b": ModelConfig(
        name="mistral-7b",
        path="mistralai/Mistral-7B-Instruct-v0.2",
        context_length=8192,
        temperature=0.3,
        max_tokens=1024,
        quantization="int8"
    ),
    "mixtral-8x7b": ModelConfig(
        name="mixtral-8x7b",
        path="mistralai/Mixtral-8x7B-Instruct-v0.1",
        context_length=32768,
        temperature=0.3,
        max_tokens=2048,
        quantization="int4"
    ),
    "llama2-spanish": ModelConfig(
        name="llama2-spanish",
        path="clibrain/Llama-2-7b-ft-instruct-es",
        context_length=4096,
        temperature=0.3,
        max_tokens=1024,
        quantization="int8"
    )
}

# Analysis configuration
ANALYSIS_CONFIG = {
    "chunk_size": 2000,  # Characters per chunk for long documents
    "chunk_overlap": 200,
    "min_confidence": 0.7,
    "languages": ["es", "en", "pt"],
    "cache_ttl": 86400,  # 24 hours
    "batch_size": 4,
    "enable_fact_checking": True,
    "enable_bias_detection": True
}

# Categories and their keywords
CATEGORIES = {
    "infrastructure": {
        "es": ["infraestructura", "obras", "construcción", "carreteras", "puentes", "edificios"],
        "en": ["infrastructure", "construction", "roads", "bridges", "buildings", "public works"]
    },
    "health": {
        "es": ["salud", "hospital", "médico", "sanitario", "enfermedad", "vacuna", "medicamento"],
        "en": ["health", "hospital", "medical", "disease", "vaccine", "medicine", "healthcare"]
    },
    "education": {
        "es": ["educación", "escuela", "universidad", "estudiante", "profesor", "beca"],
        "en": ["education", "school", "university", "student", "teacher", "scholarship"]
    },
    "economy": {
        "es": ["economía", "impuesto", "fiscal", "presupuesto", "finanzas", "dinero"],
        "en": ["economy", "tax", "fiscal", "budget", "finance", "money", "economic"]
    },
    "security": {
        "es": ["seguridad", "policía", "crimen", "delito", "justicia", "protección"],
        "en": ["security", "police", "crime", "justice", "protection", "safety"]
    },
    "environment": {
        "es": ["ambiente", "ambiental", "ecología", "sustentable", "clima", "contaminación"],
        "en": ["environment", "environmental", "ecology", "sustainable", "climate", "pollution"]
    },
    "social": {
        "es": ["social", "bienestar", "apoyo", "programa", "beneficio", "subsidio"],
        "en": ["social", "welfare", "support", "program", "benefit", "subsidy"]
    }
}

# Impact keywords for detecting who benefits
BENEFICIARY_KEYWORDS = {
    "citizens": {
        "es": ["ciudadano", "población", "habitante", "residente", "persona", "gente", "pueblo"],
        "en": ["citizen", "population", "resident", "person", "people", "public"]
    },
    "businesses": {
        "es": ["empresa", "negocio", "corporación", "industria", "comercio", "empresario"],
        "en": ["business", "company", "corporation", "industry", "commerce", "entrepreneur"]
    },
    "government": {
        "es": ["gobierno", "estado", "administración", "autoridad", "institución", "funcionario"],
        "en": ["government", "state", "administration", "authority", "institution", "official"]
    },
    "workers": {
        "es": ["trabajador", "empleado", "obrero", "laboral", "sindicato", "empleo"],
        "en": ["worker", "employee", "labor", "union", "employment", "job"]
    },
    "students": {
        "es": ["estudiante", "alumno", "escolar", "universitario", "educando"],
        "en": ["student", "pupil", "scholar", "university", "learner"]
    },
    "elderly": {
        "es": ["adulto mayor", "anciano", "tercera edad", "pensionado", "jubilado"],
        "en": ["elderly", "senior", "retired", "pensioner", "older adult"]
    }
}

# Fairness indicators
FAIRNESS_INDICATORS = {
    "positive": {
        "es": ["equitativo", "justo", "igualitario", "beneficia a todos", "inclusivo", "transparente"],
        "en": ["equitable", "fair", "equal", "benefits all", "inclusive", "transparent"]
    },
    "negative": {
        "es": ["desigual", "discriminatorio", "favorece", "privilegia", "excluye", "perjudica"],
        "en": ["unequal", "discriminatory", "favors", "privileges", "excludes", "harms"]
    },
    "neutral": {
        "es": ["neutro", "equilibrado", "proporcional", "razonable"],
        "en": ["neutral", "balanced", "proportional", "reasonable"]
    }
}

# Risk indicators
RISK_KEYWORDS = {
    "high": {
        "es": ["peligro", "riesgo alto", "grave", "severo", "crítico", "urgente"],
        "en": ["danger", "high risk", "serious", "severe", "critical", "urgent"]
    },
    "medium": {
        "es": ["precaución", "riesgo moderado", "importante", "considerable"],
        "en": ["caution", "moderate risk", "important", "considerable"]
    },
    "low": {
        "es": ["riesgo bajo", "mínimo", "poco probable", "menor"],
        "en": ["low risk", "minimal", "unlikely", "minor"]
    }
}

# Output paths
OUTPUT_DIR = Path("data/ai_analysis")
CACHE_DIR = Path("data/ai_cache")
MODEL_DIR = Path("models")

# Create directories if they don't exist
for directory in [OUTPUT_DIR, CACHE_DIR, MODEL_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Logging configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        }
    },
    "handlers": {
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "ai_analyzer.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "standard"
        },
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard"
        }
    },
    "loggers": {
        "ai_analyzer": {
            "handlers": ["file", "console"],
            "level": "INFO"
        }
    }
}