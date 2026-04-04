# Governance Ratings System - Documentation

## 🏛️ Overview

The Shout Aloud Governance Ratings System provides a tag-based reputation mechanism for public officials without allowing comments. Citizens can only assign predefined tags (like "corrupt", "ethical", etc.) to officials, with AI suggesting relevant tags based on the official's actions and history.

## 🎯 Key Features

1. **No Comments Policy**
   - Only predefined tags can be assigned
   - Prevents hate speech and personal attacks
   - Maintains constructive feedback

2. **AI-Suggested Tags**
   - Analyzes official's voting record
   - Reviews public actions and statements
   - Suggests relevant tags with confidence scores

3. **Community-Based Reputation**
   - Scores calculated by zone (municipal, state, federal)
   - Visual reputation charts
   - Trend tracking over time

4. **Reputation Components**
   - Ethics Score
   - Efficiency Score
   - Transparency Score
   - Community Score

## 🏗️ System Architecture

```
governance/ratings/
├── __init__.py           # Package initialization
├── models.py             # Database models
├── config.py             # Configuration and predefined tags
├── tag_analyzer.py       # AI tag suggestion system
├── reputation_calculator.py  # Score calculation engine
├── api.py                # REST API endpoints
├── database.py           # Database configuration
└── visualization.py      # React chart components
```

## 📊 Predefined Tags

### Positive Tags (⭐)
- **ético** - Actúa con integridad y valores
- **transparente** - Comparte información abiertamente
- **eficiente** - Cumple objetivos rápidamente
- **cercano** - Escucha a la comunidad
- **trabajador** - Dedicado y constante
- **honesto** - Dice la verdad
- **innovador** - Propone soluciones creativas
- **responsable** - Cumple compromisos
- **justo** - Trata a todos por igual
- **visionario** - Planifica a largo plazo

### Negative Tags (⚠️)
- **corrupto** - Usa el cargo para beneficio personal
- **mentiroso** - No dice la verdad
- **ausente** - No se presenta a trabajar
- **ineficiente** - No cumple objetivos
- **opaco** - Oculta información
- **autoritario** - Abusa del poder
- **negligente** - Descuida responsabilidades
- **conflictivo** - Genera problemas
- **derrochador** - Malgasta recursos públicos
- **incompetente** - No tiene capacidad para el cargo

### Neutral Tags (➖)
- **tradicional** - Sigue métodos establecidos
- **cauteloso** - Actúa con precaución
- **mediático** - Presencia en medios
- **técnico** - Enfoque en detalles técnicos
- **político** - Hábil en negociación política
- **reservado** - Poco comunicativo
- **nuevo** - Recién llegado al cargo
- **experimentado** - Muchos años en política

## 🚀 Installation & Setup

### Requirements
```bash
# Python 3.8+
pip install fastapi uvicorn sqlalchemy psycopg2-binary
pip install numpy pandas redis
pip install pydantic python-multipart
```

### Database Setup
```sql
-- PostgreSQL database
CREATE DATABASE governance_ratings;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE governance_ratings TO your_user;
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/governance_ratings

# Redis (optional for caching)
REDIS_URL=redis://localhost:6379

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

### Run the API
```bash
cd governance/ratings
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 API Usage

### Create an Official
```bash
curl -X POST http://localhost:8000/api/officials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "position": "Alcalde",
    "institution": "Municipio de Guadalajara",
    "municipality_code": 5012,
    "state_code": 5,
    "party": "Independiente"
  }'
```

### Get Tag Suggestions
```bash
curl http://localhost:8000/api/tags/suggestions/1
```

Response:
```json
{
  "suggestions": [
    {
      "tag": {
        "id": 1,
        "name": "trabajador",
        "emoji": "💪",
        "category": "positive"
      },
      "confidence": 0.85,
      "reason": "Participación activa en 45 acciones recientes"
    },
    {
      "tag": {
        "id": 5,
        "name": "transparente",
        "emoji": "🔍",
        "category": "positive"
      },
      "confidence": 0.72,
      "reason": "Comparte información abiertamente en sus propuestas"
    }
  ]
}
```

### Submit a Rating
```bash
curl -X POST http://localhost:8000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{
    "official_id": 1,
    "tag_id": 1,
    "citizen_hash": "abc123def456",
    "verified": true
  }'
```

### Get Reputation
```bash
curl http://localhost:8000/api/reputation/1
```

Response:
```json
{
  "reputation": {
    "comparisons": [
      {
        "zone_type": "municipal",
        "zone_code": 5012,
        "overall_score": 75.5,
        "components": {
          "ethics": 80.0,
          "efficiency": 70.0,
          "transparency": 75.0,
          "community": 77.0
        }
      }
    ],
    "statistics": {
      "average_score": 73.2,
      "highest_score": 75.5,
      "lowest_score": 70.0,
      "consistency": "consistent"
    }
  },
  "top_tags": [
    {
      "tag": {"name": "trabajador", "emoji": "💪"},
      "count": 234,
      "percentage": 35.2
    }
  ]
}
```

### Get Zone Rankings
```bash
curl http://localhost:8000/api/rankings/municipal/5012?limit=10
```

## 🤖 AI Tag Suggestion System

The AI analyzer examines:

1. **Voting Patterns**
   - Alignment with citizen interests
   - Party line voting
   - Controversial votes

2. **Public Actions**
   - Proposals submitted
   - Attendance records
   - Budget decisions
   - Public statements

3. **Pattern Recognition**
   - Consistent behaviors
   - Changes over time
   - Correlation with outcomes

### Example AI Analysis
```python
from governance.ratings import TagAnalyzer

analyzer = TagAnalyzer(db_session)

# Analyze voting patterns
analysis = analyzer.analyze_voting_patterns(official_id=1)

# Output:
{
  "analysis": {
    "total_votes": 150,
    "citizen_aligned": 120,
    "citizen_alignment_rate": 80.0,
    "suggested_tags": ["cercano", "responsable"]
  }
}
```

## 📈 Reputation Calculation

### Overall Score Formula
```
Overall Score = (Ethics × 0.35) + (Efficiency × 0.25) + 
                (Transparency × 0.20) + (Community × 0.20)
```

### Component Calculations
Each component score is calculated based on relevant tags:

```python
score = 50 + ((positive_tags - negative_tags) / total_tags) × 50
```

This gives a range of 0-100 with 50 as neutral.

### Score Ranges
- **80-100**: Excelente (🟢)
- **60-79**: Bueno (🔵)
- **40-59**: Regular (🟡)
- **20-39**: Deficiente (🔴)
- **0-19**: Muy Deficiente (🔴)

## 📊 Frontend Integration

### React Component Usage
```jsx
import ReputationChart from '@/components/governance/ReputationChart';

function OfficialProfile({ officialId }) {
  return (
    <div>
      <h2>Reputación del Funcionario</h2>
      <ReputationChart officialId={officialId} />
    </div>
  );
}
```

### Mobile App Integration
```typescript
// React Native
import { useGovernanceRatings } from '@/hooks/useGovernanceRatings';

function OfficialRatingScreen({ route }) {
  const { officialId } = route.params;
  const { tags, suggestions, submitRating } = useGovernanceRatings(officialId);
  
  const handleTagSelect = async (tagId: number) => {
    await submitRating(tagId);
  };
  
  return (
    <View>
      <Text>Califica sin comentarios</Text>
      <TagGrid 
        tags={tags}
        suggestions={suggestions}
        onSelect={handleTagSelect}
      />
    </View>
  );
}
```

## 🔒 Security & Privacy

1. **Anonymous Ratings**
   - Only citizen hash stored
   - No personal information
   - One tag per citizen per official

2. **Anti-Gaming Measures**
   - Verified citizen requirement
   - Rate limiting
   - Anomaly detection

3. **Data Protection**
   - Encrypted citizen hashes
   - No comment storage
   - GDPR compliant

## 📊 Analytics Dashboard

### Key Metrics
- Total ratings per official
- Tag distribution
- Zone comparison
- Trend analysis
- Participation rates

### Sample Query
```sql
-- Top rated officials by zone
SELECT 
    o.name,
    o.position,
    r.overall_score,
    r.total_ratings
FROM officials o
JOIN reputation_scores r ON o.id = r.official_id
WHERE r.zone_type = 'municipal' 
    AND r.zone_code = 5012
ORDER BY r.overall_score DESC
LIMIT 10;
```

## 🛠️ Maintenance

### Update All Reputations
```bash
# Run daily via cron
curl -X POST http://localhost:8000/api/reputation/update-all
```

### Database Maintenance
```sql
-- Clean old ratings (optional)
DELETE FROM ratings 
WHERE timestamp < NOW() - INTERVAL '2 years';

-- Vacuum database
VACUUM ANALYZE;
```

### Performance Optimization
```python
# Add indexes for common queries
CREATE INDEX idx_ratings_official_timestamp 
ON ratings(official_id, timestamp DESC);

CREATE INDEX idx_reputation_zone_score 
ON reputation_scores(zone_type, zone_code, overall_score DESC);
```

## 🔧 Troubleshooting

### Common Issues

1. **Slow Tag Suggestions**
   - Check official has enough actions
   - Verify database indexes
   - Enable Redis caching

2. **Incorrect Scores**
   - Run reputation recalculation
   - Check tag weights configuration
   - Verify rating data integrity

3. **Missing Officials**
   - Ensure active flag is set
   - Check zone codes are correct
   - Verify data import process

### Debug Mode
```python
# Enable debug logging
import logging
logging.getLogger("governance.ratings").setLevel(logging.DEBUG)
```

## 📱 Best Practices

1. **Regular Updates**
   - Import official actions weekly
   - Recalculate reputations daily
   - Archive old data monthly

2. **User Experience**
   - Show tag descriptions on hover
   - Highlight AI suggestions
   - Display confidence scores

3. **Data Quality**
   - Verify official information
   - Validate action sources
   - Monitor for anomalies

## 🚀 Future Enhancements

1. **Blockchain Integration**
   - Store rating hashes on-chain
   - Immutable reputation records
   - Decentralized verification

2. **Advanced AI**
   - Natural language processing
   - Sentiment analysis of actions
   - Predictive modeling

3. **Gamification**
   - Citizen participation badges
   - Accuracy rewards
   - Community challenges

---

**Note**: This system is designed to provide constructive, fact-based evaluation of public officials while preventing toxic discourse through its no-comments, tags-only approach.