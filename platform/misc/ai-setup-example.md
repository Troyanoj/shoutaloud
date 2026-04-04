# AI Legal Analyzer - Setup and Usage Guide

## 🚀 Quick Start

### Requirements

- Python 3.8+
- CUDA-capable GPU (recommended) or CPU
- 16GB+ RAM (32GB recommended for larger models)
- 50GB+ disk space for models

### Installation

```bash
# Clone the repository
cd backend/ai

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy models for text processing
python -m spacy download es_core_news_sm
python -m spacy download en_core_web_sm
python -m spacy download pt_core_news_sm
```

### Requirements File (requirements.txt)

```txt
torch>=2.0.0
transformers>=4.35.0
accelerate>=0.24.0
bitsandbytes>=0.41.0
langchain>=0.0.340
spacy>=3.7.0
langdetect>=1.0.9
textstat>=0.7.3
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.4.0
redis>=5.0.0
aiofiles>=23.2.0
aiohttp>=3.9.0
huggingface-hub>=0.19.0
sentencepiece>=0.1.99
protobuf>=4.24.0
numpy>=1.24.0
```

## 🤖 Available Models

The system supports multiple language models optimized for legal text analysis:

1. **LLaMA 2 Spanish** (Default)
   - Best for Spanish legal documents
   - 7B parameters, quantized to int8
   - ~7GB memory usage

2. **Mistral 7B**
   - Multilingual support
   - Better context length (8K tokens)
   - ~7GB memory usage

3. **Mixtral 8x7B**
   - Best quality, slowest
   - Requires 24GB+ GPU memory
   - int4 quantization available

## 💻 Usage Examples

### Basic Usage

```python
from backend.ai import LegalAnalyzer

# Initialize analyzer
analyzer = LegalAnalyzer(model_name="llama2-spanish")

# Example legal text
legal_text = """
DECRETO por el que se reforman y adicionan diversas disposiciones de la Ley General de Salud, 
en materia de atención médica gratuita.

Artículo 1. Se establece que todos los ciudadanos mexicanos tendrán derecho a recibir 
atención médica gratuita en las instituciones públicas de salud, incluyendo medicamentos 
y tratamientos necesarios.

Artículo 2. El gobierno federal destinará el 15% del presupuesto anual para garantizar 
la cobertura universal de salud.

Artículo 3. Las empresas con más de 50 empleados deberán contribuir con el 2% de su 
nómina al fondo de salud pública.
"""

# Analyze document
result = await analyzer.analyze_document(
    text=legal_text,
    metadata={
        "title": "Reforma de Salud",
        "type": "decree",
        "location": "México",
        "date": "2024-01-15"
    },
    user_context={
        "location": "Ciudad de México",
        "demographic": "trabajador"
    }
)

# Print results
print("=== ANÁLISIS CIUDADANO ===\n")

print("📋 RESUMEN:")
print(result["summary"]["brief"])

print("\n👤 ¿CÓMO ME AFECTA?")
for impact in result["personal_impact"]["how_it_affects_you"]:
    print(f"• {impact}")

print("\n🎯 ¿QUIÉN SE BENEFICIA?")
for beneficiary, percentage in result["beneficiaries"]["benefit_distribution"].items():
    print(f"• {beneficiary}: {percentage*100:.1f}%")

print("\n⚖️ ¿ES JUSTO?")
print(f"Evaluación: {result['fairness_assessment']['is_it_fair']}")
print(f"Razón: {result['fairness_assessment']['reasons'][0]}")

print("\n🗳️ RECOMENDACIÓN DE VOTO:")
vote_rec = result["recommendation"]["vote_suggestion"]
if vote_rec == "positive":
    print("✅ RECOMENDADO - Esta propuesta beneficia a los ciudadanos")
elif vote_rec == "negative":
    print("❌ NO RECOMENDADO - Esta propuesta tiene problemas significativos")
else:
    print("🤔 NEUTRAL - Requiere más consideración")
```

### API Usage

```python
import requests

# Start the API server
# python -m backend.ai.api

# Send analysis request
response = requests.post(
    "http://localhost:8000/analyze",
    json={
        "text": legal_text,
        "metadata": {
            "title": "Reforma Educativa",
            "type": "law",
            "location": "México"
        },
        "user_context": {
            "location": "Guadalajara",
            "demographic": "estudiante"
        }
    }
)

analysis = response.json()["analysis"]
```

### Batch Processing

```python
# Analyze multiple documents
documents = [
    {
        "id": "doc1",
        "text": "Primera ley...",
        "metadata": {"type": "law"}
    },
    {
        "id": "doc2", 
        "text": "Segunda propuesta...",
        "metadata": {"type": "proposal"}
    }
]

results = await analyzer.analyze_batch(documents)

for result in results:
    if result["status"] == "success":
        print(f"Document {result['document_id']}: Analyzed successfully")
        print(f"Summary: {result['analysis']['summary']['brief']}")
```

## 📊 Example Output

```json
{
  "summary": {
    "brief": "Esta reforma establece atención médica gratuita universal para todos los mexicanos, financiada con 15% del presupuesto federal y contribuciones del 2% de empresas grandes.",
    "key_points": [
      "Atención médica gratuita para todos los ciudadanos",
      "15% del presupuesto federal destinado a salud",
      "Empresas con más de 50 empleados contribuyen 2% de nómina"
    ]
  },
  "personal_impact": {
    "how_it_affects_you": [
      "Tendrás acceso gratuito a médicos y medicinas en hospitales públicos",
      "No pagarás por tratamientos médicos necesarios",
      "Tu empresa podría descontar 2% adicional si tiene más de 50 empleados"
    ],
    "immediate_effects": [
      "Acceso inmediato a servicios de salud sin costo"
    ],
    "long_term_effects": [
      "Mejor cobertura de salud a largo plazo",
      "Posible aumento en tiempos de espera por mayor demanda"
    ]
  },
  "beneficiaries": {
    "who_benefits": {
      "citizens": 0.7,
      "government": 0.1,
      "businesses": 0.2
    },
    "potential_losers": ["businesses"]
  },
  "fairness_assessment": {
    "is_it_fair": "fair",
    "fairness_score": 0.85,
    "reasons": [
      "Beneficia a todos los ciudadanos por igual",
      "La carga se distribuye proporcionalmente"
    ],
    "recommendations": [
      "Incluir apoyo para pequeñas empresas",
      "Establecer mecanismos de transparencia en el uso de fondos"
    ]
  },
  "recommendation": {
    "vote_suggestion": "positive",
    "confidence": 0.82,
    "reasoning": "La propuesta es justa y beneficia principalmente a los ciudadanos"
  }
}
```

## 🔧 Configuration

### Model Selection

```python
# Use different models based on needs
analyzer = LegalAnalyzer(model_name="mistral-7b")  # Better for mixed languages
analyzer = LegalAnalyzer(model_name="llama2-13b")  # Higher quality, more resources
```

### Performance Tuning

```python
# Adjust for CPU-only systems
analyzer = LegalAnalyzer(
    model_name="llama2-7b",
    device="cpu"  # Force CPU usage
)

# Enable/disable caching
analyzer = LegalAnalyzer(
    model_name="llama2-spanish",
    enable_cache=True  # Cache results for repeated documents
)
```

### Custom Prompts

```python
from backend.ai.prompts import PromptTemplates

# Customize prompts for specific needs
templates = PromptTemplates()
templates.templates["es"]["summary"] = """
Tu prompt personalizado aquí...
"""
```

## 🚀 Production Deployment

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download models during build
RUN python -c "from transformers import AutoModel; AutoModel.from_pretrained('meta-llama/Llama-2-7b-chat-hf')"

# Copy application
COPY . .

# Run API
CMD ["uvicorn", "backend.ai.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```bash
# Model configuration
export AI_MODEL_NAME="llama2-spanish"
export AI_DEVICE="cuda"
export AI_QUANTIZATION="int8"

# Cache configuration
export AI_CACHE_ENABLED="true"
export AI_CACHE_TTL="86400"
export REDIS_URL="redis://localhost:6379"

# API configuration
export API_HOST="0.0.0.0"
export API_PORT="8000"
export API_WORKERS="4"
```

### Scaling Considerations

1. **GPU Scaling**: Use multiple GPUs for parallel processing
2. **Model Sharding**: Split large models across GPUs
3. **Caching**: Use Redis for distributed caching
4. **Load Balancing**: Deploy multiple API instances
5. **Queue System**: Use Celery/RabbitMQ for async processing

## 📈 Monitoring

### Metrics to Track

- Analysis time per document
- Model inference latency
- Cache hit rate
- Memory usage
- GPU utilization
- API response times

### Logging

```python
import logging

# Configure detailed logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_analyzer.log'),
        logging.StreamHandler()
    ]
)
```

## 🔍 Troubleshooting

### Common Issues

1. **Out of Memory**
   - Use smaller model or increase quantization
   - Reduce batch size
   - Enable CPU offloading

2. **Slow Performance**
   - Enable GPU acceleration
   - Use model quantization
   - Implement caching

3. **Poor Quality Results**
   - Use larger model
   - Adjust temperature settings
   - Improve prompts

### Debug Mode

```python
# Enable debug logging
analyzer = LegalAnalyzer(
    model_name="llama2-spanish",
    device="cuda"
)

# Set debug level
import logging
logging.getLogger("ai_analyzer").setLevel(logging.DEBUG)
```

## 🤝 Contributing

To add support for new models or languages:

1. Add model configuration to `config.py`
2. Create language-specific prompts in `prompts.py`
3. Add language detection logic in `utils.py`
4. Test thoroughly with legal documents
5. Submit pull request with examples

---

**Remember**: This AI system is designed to help citizens understand legal documents, not to provide legal advice. Always consult with legal professionals for official interpretations.