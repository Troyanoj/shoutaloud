# backend/ai/legal_analyzer.py
"""
Main AI Legal Document Analyzer
Processes legal texts and provides citizen-friendly analysis
"""

import asyncio
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import logging

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    pipeline
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from .config import (
    MODELS, ANALYSIS_CONFIG, CATEGORIES, 
    BENEFICIARY_KEYWORDS, FAIRNESS_INDICATORS,
    RISK_KEYWORDS, OUTPUT_DIR, CACHE_DIR
)
from .prompts import PromptTemplates
from .models import ModelManager
from .cache import AnalysisCache
from .utils import (
    detect_language, extract_key_points,
    calculate_readability_score, detect_bias
)

logger = logging.getLogger(__name__)


class LegalAnalyzer:
    """
    Analyzes legal documents and provides citizen-friendly explanations
    """
    
    def __init__(
        self,
        model_name: str = "llama2-spanish",
        device: Optional[str] = None,
        enable_cache: bool = True
    ):
        """
        Initialize the Legal Analyzer
        
        Args:
            model_name: Name of the model to use
            device: Device to run on (cuda/cpu/mps)
            enable_cache: Whether to cache analysis results
        """
        self.model_name = model_name
        self.device = device or self._detect_device()
        self.enable_cache = enable_cache
        
        # Initialize components
        self.model_manager = ModelManager(device=self.device)
        self.prompt_templates = PromptTemplates()
        self.cache = AnalysisCache() if enable_cache else None
        
        # Load model
        self.model_config = MODELS[model_name]
        self._load_model()
        
        # Initialize text splitter for long documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=ANALYSIS_CONFIG["chunk_size"],
            chunk_overlap=ANALYSIS_CONFIG["chunk_overlap"],
            separators=["\n\n", "\n", ".", ";", ",", " "]
        )
        
        logger.info(f"Legal Analyzer initialized with model: {model_name}")
    
    def _detect_device(self) -> str:
        """Detect available device"""
        if torch.cuda.is_available():
            return "cuda"
        elif torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"
    
    def _load_model(self):
        """Load the AI model"""
        try:
            self.model, self.tokenizer = self.model_manager.load_model(
                self.model_config
            )
            logger.info(f"Model loaded successfully: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise
    
    async def analyze_document(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a legal document and provide citizen-friendly explanation
        
        Args:
            text: The legal document text
            metadata: Document metadata (title, type, location, etc.)
            user_context: User context (location, demographic, etc.)
            
        Returns:
            Analysis results with explanations
        """
        start_time = datetime.now()
        
        # Generate document hash for caching
        doc_hash = self._generate_doc_hash(text, metadata)
        
        # Check cache
        if self.cache and self.enable_cache:
            cached_result = await self.cache.get(doc_hash)
            if cached_result:
                logger.info(f"Returning cached analysis for document: {doc_hash}")
                return cached_result
        
        # Detect language
        language = detect_language(text)
        
        # Pre-process document
        processed_text = self._preprocess_text(text)
        
        # Split long documents
        chunks = self._split_document(processed_text)
        
        # Analyze each chunk
        chunk_analyses = []
        for i, chunk in enumerate(chunks):
            logger.info(f"Analyzing chunk {i+1}/{len(chunks)}")
            chunk_analysis = await self._analyze_chunk(
                chunk, metadata, user_context, language
            )
            chunk_analyses.append(chunk_analysis)
        
        # Combine analyses
        combined_analysis = self._combine_chunk_analyses(chunk_analyses)
        
        # Generate final analysis
        final_analysis = await self._generate_final_analysis(
            combined_analysis, processed_text, metadata, user_context, language
        )
        
        # Add metadata
        final_analysis["metadata"] = {
            "document_hash": doc_hash,
            "analysis_date": datetime.now().isoformat(),
            "model_used": self.model_name,
            "language": language,
            "processing_time": (datetime.now() - start_time).total_seconds(),
            "document_length": len(text),
            "readability_score": calculate_readability_score(text, language)
        }
        
        # Cache result
        if self.cache and self.enable_cache:
            await self.cache.set(doc_hash, final_analysis)
        
        # Save to file
        await self._save_analysis(final_analysis, doc_hash)
        
        return final_analysis
    
    async def _analyze_chunk(
        self,
        chunk: str,
        metadata: Optional[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]],
        language: str
    ) -> Dict[str, Any]:
        """Analyze a single chunk of text"""
        
        # Prepare prompts
        prompts = {
            "summary": self.prompt_templates.get_summary_prompt(chunk, language),
            "personal_impact": self.prompt_templates.get_personal_impact_prompt(
                chunk, user_context, language
            ),
            "beneficiaries": self.prompt_templates.get_beneficiaries_prompt(chunk, language),
            "fairness": self.prompt_templates.get_fairness_prompt(chunk, language),
            "risks": self.prompt_templates.get_risks_prompt(chunk, language)
        }
        
        # Run analyses
        results = {}
        for analysis_type, prompt in prompts.items():
            try:
                response = await self._generate_response(prompt)
                results[analysis_type] = self._parse_response(response, analysis_type)
            except Exception as e:
                logger.error(f"Error in {analysis_type} analysis: {str(e)}")
                results[analysis_type] = None
        
        # Extract key information
        results["key_points"] = extract_key_points(chunk, language)
        results["category"] = self._categorize_content(chunk, language)
        results["detected_beneficiaries"] = self._detect_beneficiaries(chunk, language)
        
        return results
    
    async def _generate_response(self, prompt: str) -> str:
        """Generate response from the model"""
        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=self.model_config.context_length
            ).to(self.device)
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=self.model_config.max_tokens,
                    temperature=self.model_config.temperature,
                    do_sample=True,
                    top_p=0.9,
                    repetition_penalty=1.1
                )
            
            response = self.tokenizer.decode(
                outputs[0][inputs.input_ids.shape[1]:],
                skip_special_tokens=True
            )
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise
    
    async def _generate_final_analysis(
        self,
        combined_analysis: Dict[str, Any],
        full_text: str,
        metadata: Optional[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]],
        language: str
    ) -> Dict[str, Any]:
        """Generate the final comprehensive analysis"""
        
        # Create final summary prompt
        final_prompt = self.prompt_templates.get_final_analysis_prompt(
            combined_analysis, metadata, user_context, language
        )
        
        # Generate comprehensive explanation
        final_explanation = await self._generate_response(final_prompt)
        
        # Structure the final analysis
        analysis = {
            "summary": {
                "brief": combined_analysis.get("summary", ""),
                "detailed": final_explanation,
                "key_points": combined_analysis.get("key_points", [])
            },
            "personal_impact": {
                "how_it_affects_you": combined_analysis.get("personal_impact", []),
                "immediate_effects": self._extract_immediate_effects(combined_analysis),
                "long_term_effects": self._extract_long_term_effects(combined_analysis),
                "action_required": self._determine_required_actions(combined_analysis)
            },
            "beneficiaries": {
                "who_benefits": combined_analysis.get("detected_beneficiaries", {}),
                "benefit_distribution": self._analyze_benefit_distribution(combined_analysis),
                "potential_losers": self._identify_potential_losers(combined_analysis)
            },
            "fairness_assessment": {
                "is_it_fair": combined_analysis.get("fairness", {}).get("assessment", "neutral"),
                "fairness_score": combined_analysis.get("fairness", {}).get("score", 0.5),
                "reasons": combined_analysis.get("fairness", {}).get("reasons", []),
                "bias_detected": detect_bias(full_text, language),
                "recommendations": self._generate_fairness_recommendations(combined_analysis)
            },
            "risks_and_concerns": {
                "identified_risks": combined_analysis.get("risks", []),
                "risk_level": self._determine_risk_level(combined_analysis),
                "mitigation_suggestions": self._suggest_mitigations(combined_analysis)
            },
            "category": combined_analysis.get("category", "general"),
            "recommendation": {
                "vote_suggestion": self._generate_vote_recommendation(combined_analysis),
                "confidence": self._calculate_recommendation_confidence(combined_analysis),
                "reasoning": self._explain_recommendation(combined_analysis)
            }
        }
        
        return analysis
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess legal text for analysis"""
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Remove legal formatting artifacts
        text = text.replace('ARTICULO', 'Artículo')
        text = text.replace('SECCION', 'Sección')
        
        # Normalize quotes and punctuation
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        return text
    
    def _split_document(self, text: str) -> List[str]:
        """Split document into analyzable chunks"""
        if len(text) <= ANALYSIS_CONFIG["chunk_size"]:
            return [text]
        
        chunks = self.text_splitter.split_text(text)
        logger.info(f"Document split into {len(chunks)} chunks")
        return chunks
    
    def _combine_chunk_analyses(self, chunk_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine analyses from multiple chunks"""
        combined = {
            "summary": "",
            "personal_impact": [],
            "beneficiaries": {},
            "fairness": {"assessment": "neutral", "score": 0.5, "reasons": []},
            "risks": [],
            "key_points": [],
            "category": "general",
            "detected_beneficiaries": {}
        }
        
        # Combine summaries
        summaries = [a.get("summary", "") for a in chunk_analyses if a.get("summary")]
        if summaries:
            combined["summary"] = " ".join(summaries)
        
        # Combine personal impacts (deduplicate)
        all_impacts = []
        for analysis in chunk_analyses:
            if analysis.get("personal_impact"):
                all_impacts.extend(analysis["personal_impact"])
        combined["personal_impact"] = list(set(all_impacts))
        
        # Combine beneficiaries
        for analysis in chunk_analyses:
            if analysis.get("detected_beneficiaries"):
                for beneficiary, count in analysis["detected_beneficiaries"].items():
                    combined["detected_beneficiaries"][beneficiary] = \
                        combined["detected_beneficiaries"].get(beneficiary, 0) + count
        
        # Average fairness scores
        fairness_scores = [
            a.get("fairness", {}).get("score", 0.5) 
            for a in chunk_analyses 
            if a.get("fairness")
        ]
        if fairness_scores:
            combined["fairness"]["score"] = sum(fairness_scores) / len(fairness_scores)
        
        # Combine risks
        for analysis in chunk_analyses:
            if analysis.get("risks"):
                combined["risks"].extend(analysis["risks"])
        
        # Combine key points
        for analysis in chunk_analyses:
            if analysis.get("key_points"):
                combined["key_points"].extend(analysis["key_points"])
        
        # Determine overall category
        categories = [a.get("category") for a in chunk_analyses if a.get("category")]
        if categories:
            # Get most common category
            combined["category"] = max(set(categories), key=categories.count)
        
        return combined
    
    def _categorize_content(self, text: str, language: str) -> str:
        """Categorize the document content"""
        text_lower = text.lower()
        category_scores = {}
        
        for category, keywords in CATEGORIES.items():
            if language in keywords:
                score = sum(1 for keyword in keywords[language] if keyword in text_lower)
                if score > 0:
                    category_scores[category] = score
        
        if category_scores:
            return max(category_scores, key=category_scores.get)
        return "general"
    
    def _detect_beneficiaries(self, text: str, language: str) -> Dict[str, int]:
        """Detect who benefits from the document"""
        text_lower = text.lower()
        beneficiaries = {}
        
        for beneficiary, keywords in BENEFICIARY_KEYWORDS.items():
            if language in keywords:
                count = sum(text_lower.count(keyword) for keyword in keywords[language])
                if count > 0:
                    beneficiaries[beneficiary] = count
        
        return beneficiaries
    
    def _parse_response(self, response: str, analysis_type: str) -> Any:
        """Parse model response based on analysis type"""
        if analysis_type == "summary":
            return response.strip()
        
        elif analysis_type == "personal_impact":
            # Extract bullet points
            impacts = []
            for line in response.split('\n'):
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line.startswith('*')):
                    impacts.append(line.lstrip('-•* '))
            return impacts
        
        elif analysis_type == "beneficiaries":
            # Parse beneficiary analysis
            return response.strip()
        
        elif analysis_type == "fairness":
            # Determine fairness assessment
            response_lower = response.lower()
            
            score = 0.5  # neutral
            if any(word in response_lower for words in FAIRNESS_INDICATORS["positive"].values() for word in words):
                score = 0.8
                assessment = "fair"
            elif any(word in response_lower for words in FAIRNESS_INDICATORS["negative"].values() for word in words):
                score = 0.2
                assessment = "unfair"
            else:
                assessment = "neutral"
            
            return {
                "assessment": assessment,
                "score": score,
                "reasons": [response.strip()]
            }
        
        elif analysis_type == "risks":
            # Extract risk points
            risks = []
            for line in response.split('\n'):
                line = line.strip()
                if line and len(line) > 10:
                    risks.append(line)
            return risks
        
        return response.strip()
    
    def _extract_immediate_effects(self, analysis: Dict[str, Any]) -> List[str]:
        """Extract immediate effects from analysis"""
        effects = []
        
        if "personal_impact" in analysis:
            for impact in analysis["personal_impact"]:
                if any(word in impact.lower() for word in ["inmediato", "ahora", "pronto", "immediate", "now", "soon"]):
                    effects.append(impact)
        
        return effects
    
    def _extract_long_term_effects(self, analysis: Dict[str, Any]) -> List[str]:
        """Extract long-term effects from analysis"""
        effects = []
        
        if "personal_impact" in analysis:
            for impact in analysis["personal_impact"]:
                if any(word in impact.lower() for word in ["futuro", "largo plazo", "años", "future", "long term", "years"]):
                    effects.append(impact)
        
        return effects
    
    def _determine_required_actions(self, analysis: Dict[str, Any]) -> List[str]:
        """Determine if any action is required from citizens"""
        actions = []
        
        keywords = ["debe", "obligatorio", "requerido", "necesario", "must", "required", "mandatory"]
        
        if "personal_impact" in analysis:
            for impact in analysis["personal_impact"]:
                if any(keyword in impact.lower() for keyword in keywords):
                    actions.append(impact)
        
        return actions
    
    def _analyze_benefit_distribution(self, analysis: Dict[str, Any]) -> Dict[str, float]:
        """Analyze how benefits are distributed"""
        distribution = {}
        total_mentions = sum(analysis.get("detected_beneficiaries", {}).values())
        
        if total_mentions > 0:
            for beneficiary, count in analysis.get("detected_beneficiaries", {}).items():
                distribution[beneficiary] = count / total_mentions
        
        return distribution
    
    def _identify_potential_losers(self, analysis: Dict[str, Any]) -> List[str]:
        """Identify who might be negatively affected"""
        losers = []
        
        # Look for negative impact indicators
        if "risks" in analysis:
            for risk in analysis["risks"]:
                # Extract affected groups from risk descriptions
                for beneficiary in BENEFICIARY_KEYWORDS.keys():
                    if beneficiary in risk.lower():
                        losers.append(beneficiary)
        
        return list(set(losers))
    
    def _determine_risk_level(self, analysis: Dict[str, Any]) -> str:
        """Determine overall risk level"""
        risk_count = len(analysis.get("risks", []))
        
        if risk_count == 0:
            return "low"
        elif risk_count <= 2:
            return "medium"
        else:
            return "high"
    
    def _suggest_mitigations(self, analysis: Dict[str, Any]) -> List[str]:
        """Suggest risk mitigation strategies"""
        suggestions = []
        
        for risk in analysis.get("risks", []):
            # Generate contextual suggestions based on risk type
            if "economic" in risk.lower() or "económico" in risk.lower():
                suggestions.append("Buscar asesoría financiera si te afecta económicamente")
            elif "legal" in risk.lower() or "jurídico" in risk.lower():
                suggestions.append("Consultar con un abogado si tienes dudas legales")
            elif "health" in risk.lower() or "salud" in risk.lower():
                suggestions.append("Consultar con profesionales de salud si te afecta")
        
        return suggestions
    
    def _generate_vote_recommendation(self, analysis: Dict[str, Any]) -> str:
        """Generate voting recommendation"""
        fairness_score = analysis.get("fairness", {}).get("score", 0.5)
        risk_level = self._determine_risk_level(analysis)
        benefit_distribution = self._analyze_benefit_distribution(analysis)
        
        # Check if citizens benefit significantly
        citizen_benefit = benefit_distribution.get("citizens", 0)
        
        if fairness_score > 0.7 and citizen_benefit > 0.5 and risk_level != "high":
            return "positive"
        elif fairness_score < 0.3 or risk_level == "high":
            return "negative"
        else:
            return "neutral"
    
    def _calculate_recommendation_confidence(self, analysis: Dict[str, Any]) -> float:
        """Calculate confidence in recommendation"""
        # Base confidence on completeness of analysis
        confidence = 0.0
        total_components = 0
        
        if analysis.get("summary"):
            confidence += 0.2
            total_components += 1
        
        if analysis.get("fairness", {}).get("score") is not None:
            confidence += 0.2
            total_components += 1
        
        if analysis.get("risks"):
            confidence += 0.2
            total_components += 1
        
        # Adjust based on data quality
        if total_components > 0:
            confidence = confidence / total_components
        
        return min(confidence, 0.95)  # Cap at 95% confidence
    
    def _explain_recommendation(self, analysis: Dict[str, Any]) -> str:
        """Explain the reasoning behind the recommendation"""
        fairness_score = analysis.get("fairness", {}).get("score", 0.5)
        risk_level = self._determine_risk_level(analysis)
        benefit_distribution = self._analyze_benefit_distribution(analysis)
        
        reasons = []
        
        # Fairness reasoning
        if fairness_score > 0.7:
            reasons.append("La propuesta es justa y equitativa")
        elif fairness_score < 0.3:
            reasons.append("La propuesta presenta problemas de equidad")
        
        # Benefit reasoning
        citizen_benefit = benefit_distribution.get("citizens", 0)
        if citizen_benefit > 0.5:
            reasons.append("Beneficia principalmente a los ciudadanos")
        elif citizen_benefit < 0.2:
            reasons.append("Los ciudadanos no son los principales beneficiarios")
        
        # Risk reasoning
        if risk_level == "high":
            reasons.append("Presenta riesgos significativos")
        elif risk_level == "low":
            reasons.append("Los riesgos son mínimos")
        
        return " ".join(reasons)
    
    def _generate_fairness_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations to improve fairness"""
        recommendations = []
        fairness_score = analysis.get("fairness", {}).get("score", 0.5)
        
        if fairness_score < 0.5:
            recommendations.extend([
                "Considerar medidas compensatorias para grupos afectados",
                "Incluir mecanismos de transparencia y rendición de cuentas",
                "Asegurar participación ciudadana en la implementación"
            ])
        
        return recommendations
    
    def _generate_doc_hash(self, text: str, metadata: Optional[Dict[str, Any]]) -> str:
        """Generate unique hash for document"""
        content = text
        if metadata:
            content += json.dumps(metadata, sort_keys=True)
        
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    async def _save_analysis(self, analysis: Dict[str, Any], doc_hash: str):
        """Save analysis to file"""
        try:
            filename = f"{doc_hash}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            filepath = OUTPUT_DIR / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(analysis, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Analysis saved to: {filepath}")
        except Exception as e:
            logger.error(f"Failed to save analysis: {str(e)}")
    
    async def analyze_batch(
        self,
        documents: List[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Analyze multiple documents in batch
        
        Args:
            documents: List of documents with 'text' and 'metadata' keys
            user_context: User context for analysis
            
        Returns:
            List of analysis results
        """
        results = []
        total = len(documents)
        
        for i, doc in enumerate(documents):
            logger.info(f"Analyzing document {i+1}/{total}")
            
            try:
                analysis = await self.analyze_document(
                    doc['text'],
                    doc.get('metadata'),
                    user_context
                )
                results.append({
                    'document_id': doc.get('id', i),
                    'analysis': analysis,
                    'status': 'success'
                })
            except Exception as e:
                logger.error(f"Failed to analyze document {i}: {str(e)}")
                results.append({
                    'document_id': doc.get('id', i),
                    'error': str(e),
                    'status': 'failed'
                })
        
        return results
    
    def cleanup(self):
        """Clean up resources"""
        if hasattr(self, 'model'):
            del self.model
        if hasattr(self, 'tokenizer'):
            del self.tokenizer
        torch.cuda.empty_cache()
        logger.info("Resources cleaned up")


# backend/ai/models.py
"""
Model management for AI analyzer
"""

import os
import logging
from typing import Tuple, Optional
from pathlib import Path

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    PreTrainedModel,
    PreTrainedTokenizer
)
from huggingface_hub import snapshot_download

from .config import ModelConfig, MODEL_DIR

logger = logging.getLogger(__name__)


class ModelManager:
    """Manages AI model loading and optimization"""
    
    def __init__(self, device: str = "cuda"):
        self.device = device
        self.loaded_models = {}
    
    def load_model(
        self,
        config: ModelConfig
    ) -> Tuple[PreTrainedModel, PreTrainedTokenizer]:
        """
        Load and optimize model for inference
        
        Args:
            config: Model configuration
            
        Returns:
            Tuple of (model, tokenizer)
        """
        model_key = f"{config.name}_{config.quantization}"
        
        # Check if already loaded
        if model_key in self.loaded_models:
            logger.info(f"Using cached model: {model_key}")
            return self.loaded_models[model_key]
        
        logger.info(f"Loading model: {config.name}")
        
        # Download model if not exists
        model_path = self._download_model(config)
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            use_fast=True,
            padding_side="left"
        )
        
        # Set padding token if not exists
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Configure quantization
        quantization_config = self._get_quantization_config(config)
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=quantization_config,
            device_map="auto" if self.device == "cuda" else None,
            torch_dtype=torch.float16 if self.device in ["cuda", "mps"] else torch.float32,
            low_cpu_mem_usage=True,
            trust_remote_code=True
        )
        
        # Move to device if not using device_map
        if self.device != "cuda":
            model = model.to(self.device)
        
        # Set to evaluation mode
        model.eval()
        
        # Cache the model
        self.loaded_models[model_key] = (model, tokenizer)
        
        logger.info(f"Model loaded successfully: {config.name}")
        return model, tokenizer
    
    def _download_model(self, config: ModelConfig) -> Path:
        """Download model if not exists locally"""
        local_path = MODEL_DIR / config.name
        
        if not local_path.exists():
            logger.info(f"Downloading model {config.name} from HuggingFace...")
            
            try:
                snapshot_download(
                    repo_id=config.path,
                    local_dir=local_path,
                    local_dir_use_symlinks=False,
                    resume_download=True
                )
                logger.info(f"Model downloaded to: {local_path}")
            except Exception as e:
                logger.error(f"Failed to download model: {str(e)}")
                raise
        else:
            logger.info(f"Using local model from: {local_path}")
        
        return local_path
    
    def _get_quantization_config(
        self,
        config: ModelConfig
    ) -> Optional[BitsAndBytesConfig]:
        """Get quantization configuration"""
        if config.quantization == "none" or self.device != "cuda":
            return None
        
        if config.quantization == "int8":
            return BitsAndBytesConfig(
                load_in_8bit=True,
                bnb_8bit_compute_dtype=torch.float16,
                bnb_8bit_use_double_quant=True,
                bnb_8bit_quant_type="nf4"
            )
        elif config.quantization == "int4":
            return BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )
        else:
            return None
    
    def unload_model(self, model_name: str):
        """Unload model from memory"""
        keys_to_remove = [k for k in self.loaded_models.keys() if k.startswith(model_name)]
        
        for key in keys_to_remove:
            if key in self.loaded_models:
                del self.loaded_models[key]
                logger.info(f"Unloaded model: {key}")
        
        # Clear GPU cache
        if self.device == "cuda":
            torch.cuda.empty_cache()
        elif self.device == "mps":
            torch.mps.empty_cache()


# backend/ai/prompts.py
"""
Prompt templates for legal document analysis
"""

from typing import Optional, Dict, Any


class PromptTemplates:
    """Manages prompts for different analysis tasks"""
    
    def __init__(self):
        self.templates = {
            "es": self._load_spanish_templates(),
            "en": self._load_english_templates(),
            "pt": self._load_portuguese_templates()
        }
    
    def _load_spanish_templates(self) -> Dict[str, str]:
        """Load Spanish prompt templates"""
        return {
            "summary": """Eres un experto legal que ayuda a ciudadanos a entender documentos legales.
            
Documento legal:
{document}

Proporciona un resumen claro y simple de este documento legal en español, explicando:
1. ¿De qué trata este documento?
2. ¿Cuál es su propósito principal?
3. ¿Qué cambios o regulaciones establece?

Usa lenguaje simple que cualquier ciudadano pueda entender. Evita jerga legal.

Resumen:""",

            "personal_impact": """Analiza cómo este documento legal afecta directamente a los ciudadanos.

Documento:
{document}

Contexto del usuario:
- Ubicación: {location}
- Grupo demográfico: {demographic}

Explica específicamente:
- ¿Cómo me afecta esto en mi vida diaria?
- ¿Qué cambios debo esperar?
- ¿Necesito tomar alguna acción?

Proporciona puntos específicos y prácticos. Usa "tú" o "usted" para dirigirte al ciudadano.

Impacto personal:""",

            "beneficiaries": """Identifica quiénes se benefician de este documento legal.

Documento:
{document}

Analiza y explica:
- ¿Quiénes son los principales beneficiarios?
- ¿Cómo se distribuyen los beneficios?
- ¿Hay grupos que podrían verse perjudicados?

Sé específico sobre los grupos afectados (ciudadanos, empresas, gobierno, etc.).

Análisis de beneficiarios:""",

            "fairness": """Evalúa la justicia y equidad de este documento legal.

Documento:
{document}

Considera:
- ¿Es justo para todos los ciudadanos?
- ¿Hay algún sesgo o discriminación?
- ¿Los beneficios y cargas están distribuidos equitativamente?

Proporciona una evaluación honesta y objetiva.

Evaluación de justicia:""",

            "risks": """Identifica riesgos y preocupaciones potenciales en este documento legal.

Documento:
{document}

Señala:
- Riesgos potenciales para los ciudadanos
- Posibles consecuencias no deseadas
- Áreas de preocupación o ambigüedad

Sé claro sobre la gravedad de cada riesgo.

Análisis de riesgos:""",

            "final_analysis": """Basándote en el análisis completo, proporciona una explicación final para el ciudadano.

Resumen del análisis:
{analysis_summary}

Información del documento:
- Tipo: {doc_type}
- Categoría: {category}
- Ubicación: {location}

Proporciona:
1. Una explicación clara y completa de lo que significa este documento
2. Cómo afecta específicamente al ciudadano
3. Una recomendación sobre si apoyar o no esta propuesta
4. Los puntos más importantes a considerar

Usa un tono amigable y accesible. Concluye con una recomendación clara.

Análisis final:"""
        }
    
    def _load_english_templates(self) -> Dict[str, str]:
        """Load English prompt templates"""
        return {
            "summary": """You are a legal expert helping citizens understand legal documents.

Legal document:
{document}

Provide a clear and simple summary of this legal document in English, explaining:
1. What is this document about?
2. What is its main purpose?
3. What changes or regulations does it establish?

Use simple language that any citizen can understand. Avoid legal jargon.

Summary:""",
            # ... other English templates
        }
    
    def _load_portuguese_templates(self) -> Dict[str, str]:
        """Load Portuguese prompt templates"""
        return {
            "summary": """Você é um especialista jurídico ajudando cidadãos a entender documentos legais.

Documento legal:
{document}

Forneça um resumo claro e simples deste documento legal em português, explicando:
1. Do que trata este documento?
2. Qual é seu objetivo principal?
3. Que mudanças ou regulamentos estabelece?

Use linguagem simples que qualquer cidadão possa entender. Evite jargão jurídico.

Resumo:""",
            # ... other Portuguese templates
        }
    
    def get_summary_prompt(self, document: str, language: str = "es") -> str:
        """Get summary prompt for document"""
        template = self.templates.get(language, self.templates["es"])["summary"]
        return template.format(document=document)
    
    def get_personal_impact_prompt(
        self,
        document: str,
        user_context: Optional[Dict[str, Any]] = None,
        language: str = "es"
    ) -> str:
        """Get personal impact analysis prompt"""
        template = self.templates.get(language, self.templates["es"])["personal_impact"]
        
        location = "No especificada"
        demographic = "General"
        
        if user_context:
            location = user_context.get("location", location)
            demographic = user_context.get("demographic", demographic)
        
        return template.format(
            document=document,
            location=location,
            demographic=demographic
        )
    
    def get_beneficiaries_prompt(self, document: str, language: str = "es") -> str:
        """Get beneficiaries analysis prompt"""
        template = self.templates.get(language, self.templates["es"])["beneficiaries"]
        return template.format(document=document)
    
    def get_fairness_prompt(self, document: str, language: str = "es") -> str:
        """Get fairness evaluation prompt"""
        template = self.templates.get(language, self.templates["es"])["fairness"]
        return template.format(document=document)
    
    def get_risks_prompt(self, document: str, language: str = "es") -> str:
        """Get risk analysis prompt"""
        template = self.templates.get(language, self.templates["es"])["risks"]
        return template.format(document=document)
    
    def get_final_analysis_prompt(
        self,
        analysis_summary: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
        user_context: Optional[Dict[str, Any]] = None,
        language: str = "es"
    ) -> str:
        """Get final comprehensive analysis prompt"""
        template = self.templates.get(language, self.templates["es"])["final_analysis"]
        
        # Format analysis summary
        summary_text = self._format_analysis_summary(analysis_summary)
        
        # Extract metadata
        doc_type = "Documento legal"
        category = "General"
        location = "No especificada"
        
        if metadata:
            doc_type = metadata.get("type", doc_type)
            category = metadata.get("category", category)
            location = metadata.get("location", location)
        
        return template.format(
            analysis_summary=summary_text,
            doc_type=doc_type,
            category=category,
            location=location
        )
    
    def _format_analysis_summary(self, analysis: Dict[str, Any]) -> str:
        """Format analysis summary for final prompt"""
        summary_parts = []
        
        if analysis.get("summary"):
            summary_parts.append(f"Resumen: {analysis['summary']}")
        
        if analysis.get("personal_impact"):
            impacts = "\n".join(f"- {impact}" for impact in analysis["personal_impact"][:3])
            summary_parts.append(f"Impactos principales:\n{impacts}")
        
        if analysis.get("detected_beneficiaries"):
            beneficiaries = ", ".join(analysis["detected_beneficiaries"].keys())
            summary_parts.append(f"Beneficiarios: {beneficiaries}")
        
        if analysis.get("fairness"):
            fairness = analysis["fairness"].get("assessment", "neutral")
            summary_parts.append(f"Evaluación de justicia: {fairness}")
        
        return "\n\n".join(summary_parts)0.2
            total_components += 1
        
        if analysis.get("personal_impact"):
            confidence += 0.2
            total_components += 1
        
        if analysis.get("detected_beneficiaries"):
            confidence += 