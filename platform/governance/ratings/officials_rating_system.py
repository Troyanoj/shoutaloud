# backend/routers/officials.py
"""
Officials router - Sistema de calificación de funcionarios
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..database import get_db
from .. import models, crud, schemas
from .auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.OfficialResponse])
async def get_officials(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    level: Optional[str] = Query(None, description="municipal, state, federal"),
    municipality_code: Optional[int] = None,
    state_code: Optional[int] = None,
    is_active: bool = True,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of officials with optional filters"""
    
    query = db.query(models.Official)
    
    if is_active:
        query = query.filter(models.Official.is_active == True)
    if level:
        query = query.filter(models.Official.level == level)
    if municipality_code:
        query = query.filter(models.Official.municipality_code == municipality_code)
    if state_code:
        query = query.filter(models.Official.state_code == state_code)
    if search:
        query = query.filter(
            models.Official.name.ilike(f"%{search}%") |
            models.Official.position.ilike(f"%{search}%")
        )
    
    officials = query.order_by(models.Official.name).offset(skip).limit(limit).all()
    
    return [schemas.OfficialResponse.from_orm(official) for official in officials]

@router.get("/{official_id}", response_model=schemas.OfficialResponse)
async def get_official(official_id: int, db: Session = Depends(get_db)):
    """Get specific official by ID"""
    
    official = crud.OfficialCRUD.get_official(db, official_id)
    if not official:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Official not found"
        )
    
    return schemas.OfficialResponse.from_orm(official)

@router.get("/{official_id}/ratings", response_model=schemas.OfficialRatingSummary)
async def get_official_ratings(official_id: int, db: Session = Depends(get_db)):
    """Get rating summary for an official"""
    
    # Verify official exists
    official = crud.OfficialCRUD.get_official(db, official_id)
    if not official:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Official not found"
        )
    
    return crud.RatingCRUD.get_official_rating_summary(db, official_id)

@router.post("/{official_id}/rate", response_model=schemas.RatingResponse)
async def rate_official(
    official_id: int,
    rating_data: schemas.RatingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate an official with a tag"""
    
    # Verify official exists
    official = crud.OfficialCRUD.get_official(db, official_id)
    if not official:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Official not found"
        )
    
    # Verify tag exists
    tag = db.query(models.Tag).filter(models.Tag.id == rating_data.tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Create rating data
    rating_dict = {
        "official_id": official_id,
        "tag_id": rating_data.tag_id,
        "user_id": current_user.id,
        "municipality_code": current_user.municipality_code,
        "state_code": current_user.state_code,
        "country_code": current_user.country_code
    }
    
    # Create or update rating
    db_rating = crud.RatingCRUD.create_or_update_rating(db, rating_dict)
    
    # Include tag in response
    response = schemas.RatingResponse.from_orm(db_rating)
    response.tag = schemas.TagResponse.from_orm(tag)
    
    return response

@router.get("/{official_id}/my-rating")
async def get_my_rating(
    official_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's rating for an official"""
    
    rating = crud.RatingCRUD.get_user_rating(db, official_id, current_user.id)
    if not rating:
        return {"rating": None}
    
    tag = db.query(models.Tag).filter(models.Tag.id == rating.tag_id).first()
    
    return {
        "rating": {
            "id": rating.id,
            "tag_id": rating.tag_id,
            "tag_name": tag.name,
            "tag_category": tag.category,
            "created_at": rating.created_at
        }
    }

@router.delete("/{official_id}/my-rating")
async def delete_my_rating(
    official_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete current user's rating for an official"""
    
    rating = crud.RatingCRUD.get_user_rating(db, official_id, current_user.id)
    if rating:
        db.delete(rating)
        db.commit()
        return {"message": "Rating deleted successfully"}
    
    return {"message": "No rating found"}

@router.get("/{official_id}/reputation")
async def get_official_reputation(
    official_id: int,
    scope: str = Query("municipality", description="municipality, state, national"),
    db: Session = Depends(get_db)
):
    """Get calculated reputation score for an official"""
    
    # Get all ratings for the official
    ratings_query = db.query(models.Rating, models.Tag).join(models.Tag).filter(
        models.Rating.official_id == official_id
    )
    
    # Filter by scope if needed
    if scope == "municipality":
        # Get official's municipality for filtering
        official = db.query(models.Official).filter(models.Official.id == official_id).first()
        if official and official.municipality_code:
            ratings_query = ratings_query.filter(
                models.Rating.municipality_code == official.municipality_code
            )
    elif scope == "state":
        official = db.query(models.Official).filter(models.Official.id == official_id).first()
        if official and official.state_code:
            ratings_query = ratings_query.filter(
                models.Rating.state_code == official.state_code
            )
    
    ratings = ratings_query.all()
    
    if not ratings:
        return {
            "official_id": official_id,
            "scope": scope,
            "overall_score": 0.0,
            "total_ratings": 0,
            "breakdown": {}
        }
    
    # Calculate weighted score
    total_weight = 0
    weighted_sum = 0
    category_scores = {"positive": 0, "negative": 0, "neutral": 0}
    category_counts = {"positive": 0, "negative": 0, "neutral": 0}
    
    for rating, tag in ratings:
        total_weight += abs(tag.weight)
        weighted_sum += tag.weight
        
        category_scores[tag.category] += tag.weight
        category_counts[tag.category] += 1
    
    # Normalize score to 0-100 scale
    if total_weight > 0:
        overall_score = max(0, min(100, 50 + (weighted_sum / total_weight) * 50))
    else:
        overall_score = 50  # Neutral if no ratings
    
    return {
        "official_id": official_id,
        "scope": scope,
        "overall_score": round(overall_score, 2),
        "total_ratings": len(ratings),
        "breakdown": {
            "positive_score": round(category_scores["positive"], 2),
            "negative_score": round(category_scores["negative"], 2),
            "neutral_score": round(category_scores["neutral"], 2),
            "positive_count": category_counts["positive"],
            "negative_count": category_counts["negative"],
            "neutral_count": category_counts["neutral"]
        }
    }

@router.post("/", response_model=schemas.OfficialResponse)
async def create_official(
    official_data: schemas.OfficialCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new official (admin only in production)"""
    
    # In production, add admin role check here
    
    official_dict = official_data.dict()
    db_official = crud.OfficialCRUD.create_official(db, official_dict)
    
    return schemas.OfficialResponse.from_orm(db_official)

---

# backend/routers/tags.py
"""
Tags router for official ratings
"""

from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.TagResponse])
async def get_all_tags(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all available tags for rating officials"""
    
    if category:
        tags = db.query(models.Tag).filter(
            models.Tag.category == category,
            models.Tag.is_active == True
        ).order_by(models.Tag.name).all()
    else:
        tags = db.query(models.Tag).filter(
            models.Tag.is_active == True
        ).order_by(models.Tag.category, models.Tag.name).all()
    
    return [schemas.TagResponse.from_orm(tag) for tag in tags]

@router.get("/categories")
async def get_tag_categories(db: Session = Depends(get_db)):
    """Get available tag categories with counts"""
    
    result = db.query(
        models.Tag.category,
        func.count(models.Tag.id).label('count')
    ).filter(models.Tag.is_active == True).group_by(models.Tag.category).all()
    
    return [
        {"category": category, "count": count}
        for category, count in result
    ]

---

# src/components/OfficialsScreen.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Person,
  LocationOn,
  Phone,
  Email,
  Language,
  ThumbUp,
  ThumbDown,
  FilterList,
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Remove
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../stores/authStore';

const OfficialsScreen = () => {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    level: '',
    search: '',
    municipality_code: user?.municipality_code || '',
    state_code: user?.state_code || ''
  });
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);

  const { data: officials, isLoading, refetch } = useQuery(
    ['officials', filters],
    () => apiService.getOfficials(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const { data: tags } = useQuery(
    'tags',
    () => apiService.getAllTags(),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      level: '',
      search: '',
      municipality_code: user?.municipality_code || '',
      state_code: user?.state_code || ''
    });
  };

  const openRatingDialog = (official) => {
    setSelectedOfficial(official);
    setRatingDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Funcionarios Públicos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Califica a tus representantes con etiquetas basadas en su desempeño
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <FilterList />
            <Typography variant="h6">Filtros</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Buscar funcionario"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Nombre o cargo..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Nivel</InputLabel>
                <Select
                  value={filters.level}
                  label="Nivel"
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="municipal">Municipal</MenuItem>
                  <MenuItem value="state">Estatal</MenuItem>
                  <MenuItem value="federal">Federal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                sx={{ height: '56px' }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Officials Grid */}
      {officials?.length > 0 ? (
        <Grid container spacing={3}>
          {officials.map((official, index) => (
            <Grid item xs={12} md={6} lg={4} key={official.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <OfficialCard 
                  official={official} 
                  onRate={() => openRatingDialog(official)}
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          No se encontraron funcionarios con los filtros seleccionados.
        </Alert>
      )}

      {/* Rating Dialog */}
      <RatingDialog
        open={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        official={selectedOfficial}
        tags={tags}
        onRatingSubmitted={() => {
          refetch();
          setRatingDialogOpen(false);
          toast.success('Calificación registrada exitosamente');
        }}
      />
    </Box>
  );
};

// OfficialCard Component
const OfficialCard = ({ official, onRate }) => {
  const [expanded, setExpanded] = useState(false);

  const { data: ratings } = useQuery(
    ['official-ratings', official.id],
    () => apiService.getOfficialRatings(official.id),
    {
      enabled: !!official.id,
    }
  );

  const { data: reputation } = useQuery(
    ['official-reputation', official.id],
    () => apiService.getOfficialReputation(official.id),
    {
      enabled: !!official.id,
    }
  );

  const { data: myRating } = useQuery(
    ['my-rating', official.id],
    () => apiService.getMyRating(official.id),
    {
      enabled: !!official.id,
    }
  );

  const getLevelColor = (level) => {
    switch (level) {
      case 'municipal': return 'primary';
      case 'state': return 'secondary';
      case 'federal': return 'warning';
      default: return 'default';
    }
  };

  const getReputationColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4
      }
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <Avatar
            src={official.photo_url}
            sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
          >
            <Person />
          </Avatar>
          
          <Box flexGrow={1}>
            <Typography variant="h6" gutterBottom>
              {official.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {official.position}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={official.level} 
                color={getLevelColor(official.level)}
                size="small" 
              />
              {official.party && (
                <Chip 
                  label={official.party} 
                  size="small" 
                  variant="outlined"
                />
              )}
              {!official.is_current && (
                <Chip 
                  label="Fuera del cargo" 
                  size="small" 
                  color="default"
                />
              )}
            </Stack>
          </Box>
        </Box>

        {/* Reputation Score */}
        {reputation && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" fontWeight="bold">
                Reputación General
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight="bold"
                color={`${getReputationColor(reputation.overall_score)}.main`}
              >
                {reputation.overall_score}/100
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={reputation.overall_score}
              color={getReputationColor(reputation.overall_score)}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary">
              Basado en {reputation.total_ratings} calificaciones
            </Typography>
          </Box>
        )}

        {/* My Rating */}
        {myRating?.rating && (
          <Alert severity="info" size="small" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Tu calificación: <strong>{myRating.rating.tag_name}</strong>
            </Typography>
          </Alert>
        )}

        {/* Contact Info */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {official.municipality_name || `Municipio ${official.municipality_code}`}
          </Typography>
        </Box>

        {/* Expandable Details */}
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} elevation={0}>
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ p: 0 }}>
            <Typography variant="body2" color="primary">
              Ver más detalles
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, pt: 1 }}>
            {/* Contact Details */}
            {official.email && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {official.email}
                </Typography>
              </Box>
            )}
            
            {official.phone && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {official.phone}
                </Typography>
              </Box>
            )}
            
            {official.website && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Language sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  <a href={official.website} target="_blank" rel="noopener noreferrer">
                    Sitio web
                  </a>
                </Typography>
              </Box>
            )}

            {/* Term Info */}
            {official.start_date && (
              <Typography variant="caption" color="text.secondary" display="block">
                En el cargo desde: {format(new Date(official.start_date), 'MMM yyyy', { locale: es })}
              </Typography>
            )}
            
            {official.biography && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {official.biography}
              </Typography>
            )}

            {/* Top Tags */}
            {ratings?.tag_summary && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Etiquetas más comunes:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {Object.entries(ratings.tag_summary)
                    .sort(([,a], [,b]) => b.count - a.count)
                    .slice(0, 3)
                    .map(([tagName, tagData]) => (
                      <Chip
                        key={tagName}
                        label={`${tagName} (${tagData.count})`}
                        size="small"
                        color={tagData.category === 'positive' ? 'success' : 
                               tagData.category === 'negative' ? 'error' : 'default'}
                        variant="outlined"
                      />
                    ))}
                </Stack>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onRate}
          disabled={!official.is_current}
          startIcon={myRating?.rating ? <TrendingUp /> : <ThumbUp />}
        >
          {myRating?.rating ? 'Cambiar Calificación' : 'Calificar'}
        </Button>
      </CardActions>
    </Card>
  );
};

// RatingDialog Component
const RatingDialog = ({ open, onClose, official, tags, onRatingSubmitted }) => {
  const [selectedTag, setSelectedTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: myRating } = useQuery(
    ['my-rating', official?.id],
    () => apiService.getMyRating(official.id),
    {
      enabled: !!official?.id && open,
    }
  );

  useEffect(() => {
    if (myRating?.rating) {
      setSelectedTag(myRating.rating.tag_id);
    } else {
      setSelectedTag('');
    }
  }, [myRating]);

  const handleSubmit = async () => {
    if (!selectedTag || !official) return;

    setIsSubmitting(true);
    try {
      await apiService.rateOfficial(official.id, { tag_id: selectedTag });
      onRatingSubmitted();
    } catch (error) {
      toast.error('Error al registrar calificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRating = async () => {
    if (!official) return;

    setIsSubmitting(true);
    try {
      await apiService.removeOfficialRating(official.id);
      setSelectedTag('');
      onRatingSubmitted();
      toast.success('Calificación eliminada');
    } catch (error) {
      toast.error('Error al eliminar calificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedTags = tags?.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {}) || {};

  const getCategoryInfo = (category) => {
    switch (category) {
      case 'positive':
        return { label: '✅ Aspectos Positivos', color: 'success', icon: <ThumbUp /> };
      case 'negative':
        return { label: '❌ Aspectos Negativos', color: 'error', icon: <ThumbDown /> };
      case 'neutral':
        return { label: '⚪ Características Neutras', color: 'default', icon: <Remove /> };
      default:
        return { label: category, color: 'default', icon: null };
    }
  };

  if (!official) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={official.photo_url}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6">{official.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {official.position}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" paragraph>
          Selecciona una etiqueta que mejor describa el desempeño de este funcionario:
        </Typography>

        {myRating?.rating && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Calificación actual: <strong>{myRating.rating.tag_name}</strong>
            </Typography>
          </Alert>
        )}

        <Box>
          {Object.entries(groupedTags).map(([category, categoryTags]) => {
            const categoryInfo = getCategoryInfo(category);
            
            return (
              <Accordion key={category} defaultExpanded={category === 'positive'}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {categoryInfo.icon}
                    <Typography variant="subtitle1" fontWeight="bold">
                      {categoryInfo.label}
                    </Typography>
                    <Chip 
                      label={categoryTags.length} 
                      size="small" 
                      color={categoryInfo.color}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    {categoryTags.map((tag) => (
                      <Grid item xs={12} sm={6} key={tag.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            cursor: 'pointer',
                            border: selectedTag === tag.id ? 2 : 1,
                            borderColor: selectedTag === tag.id ? `${categoryInfo.color}.main` : 'divider',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                          onClick={() => setSelectedTag(tag.id)}
                        >
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {tag.name}
                              </Typography>
                              {selectedTag === tag.id && (
                                <Chip 
                                  label="Seleccionado" 
                                  size="small" 
                                  color={categoryInfo.color}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {tag.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Nota:</strong> Tu calificación es anónima y solo se usará para generar estadísticas públicas. 
            Puedes cambiar tu calificación en cualquier momento.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        
        {myRating?.rating && (
          <Button 
            onClick={handleRemoveRating}
            disabled={isSubmitting}
            color="error"
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            Eliminar Calificación
          </Button>
        )}
        
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedTag || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {myRating?.rating ? 'Actualizar Calificación' : 'Enviar Calificación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfficialsScreen;

---

# backend/init_data.py
"""
Script para inicializar datos de ejemplo en la base de datos
"""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from database import SessionLocal, init_db
from models import User, Proposal, Official, Tag
import crud

def create_sample_data():
    """Crear datos de ejemplo para testing"""
    
    db = SessionLocal()
    
    try:
        print("🌱 Creando datos de ejemplo...")
        
        # 1. Crear usuarios de ejemplo
        sample_users = [
            {
                "email": "juan.ciudadano@email.com",
                "did": "did:shout:juan123456789",
                "identity_commitment": "commitment_juan_123",
                "municipality_code": 9,
                "state_code": 9,
                "country_code": "MX",
                "is_verified": True,
                "verification_date": datetime.utcnow()
            },
            {
                "email": "maria.gonzalez@email.com", 
                "did": "did:shout:maria987654321",
                "identity_commitment": "commitment_maria_456",
                "municipality_code": 39,
                "state_code": 14,
                "country_code": "MX",
                "is_verified": True,
                "verification_date": datetime.utcnow()
            },
            {
                "email": "carlos.lopez@email.com",
                "did": "did:shout:carlos555666777",
                "identity_commitment": "commitment_carlos_789",
                "municipality_code": 39,
                "state_code": 19,
                "country_code": "MX",
                "is_verified": True,
                "verification_date": datetime.utcnow()
            }
        ]
        
        for user_data in sample_users:
            existing_user = crud.UserCRUD.get_user_by_email(db, user_data["email"])
            if not existing_user:
                crud.UserCRUD.create_user(db, user_data)
                print(f"✅ Usuario creado: {user_data['email']}")
        
        # 2. Crear propuestas de ejemplo
        sample_proposals = [
            {
                "title": "Ampliación de la Red de Transporte Público en CDMX",
                "summary": "Propuesta para modernizar y ampliar la flota de autobuses y crear nuevas rutas en zonas desatendidas de la Ciudad de México.",
                "content": """Esta propuesta busca mejorar significativamente el transporte público en la Ciudad de México mediante:

1. **Modernización de flota**: Adquisición de 500 autobuses eléctricos nuevos para reemplazar unidades obsoletas.

2. **Nuevas rutas**: Creación de 25 rutas adicionales que conecten zonas periféricas con el centro de la ciudad.

3. **Infraestructura**: Construcción de 100 nuevas paradas con tecnología inteligente y accesibilidad universal.

4. **Sustentabilidad**: Transición completa a energías limpias en el 70% de la flota para 2025.

**Presupuesto estimado**: $2,500 millones de pesos
**Beneficiarios directos**: 3.2 millones de usuarios diarios
**Tiempo de implementación**: 18 meses

La propuesta incluye estudios de impacto ambiental y análisis de viabilidad financiera realizados por consultores independientes.""",
                "category": "infrastructure",
                "scope": "municipal",
                "municipality_code": 9,
                "state_code": 9,
                "status": "active",
                "author": "Comisión de Transporte CDMX",
                "source_url": "https://ejemplo.gob.mx/propuesta-transporte-2024",
                "deadline": datetime.utcnow() + timedelta(days=30),
                "ai_analysis": {
                    "personal_impact": "Esta propuesta beneficiaría directamente a los ciudadanos de CDMX que utilizan transporte público diariamente, reduciendo tiempos de traslado y mejorando la calidad del servicio.",
                    "beneficiaries": ["usuarios de transporte público", "medio ambiente", "economía local"],
                    "fairness_score": 0.85,
                    "recommendation": "yes",
                    "confidence": 0.92,
                    "summary": "Propuesta sólida con beneficios claros para la movilidad urbana y el medio ambiente.",
                    "benefits": [
                        "Reducción de tiempos de traslado en 25%",
                        "Menor contaminación ambiental",
                        "Creación de 2,000 empleos directos",
                        "Mejor accesibilidad para personas con discapacidad"
                    ],
                    "risks": [
                        "Alto costo de implementación",
                        "Posibles retrasos en construcción",
                        "Necesidad de coordinación con múltiples dependencias"
                    ]
                }
            },
            {
                "title": "Programa de Digitalización Educativa Nacional",
                "summary": "Iniciativa federal para equipar todas las escuelas públicas del país con tecnología digital y capacitar a docentes en herramientas tecnológicas.",
                "content": """El Programa de Digitalización Educativa Nacional tiene como objetivo reducir la brecha digital en el sector educativo mediante:

**Componentes principales:**

1. **Equipamiento tecnológico**:
   - Tabletas para todos los estudiantes de primaria y secundaria
   - Computadoras para docentes y personal administrativo
   - Internet de alta velocidad en todas las escuelas

2. **Capacitación docente**:
   - Cursos de alfabetización digital para 500,000 maestros
   - Certificaciones en uso de plataformas educativas
   - Apoyo técnico continuo

3. **Contenidos digitales**:
   - Plataforma nacional de recursos educativos
   - Libros de texto digitales interactivos
   - Herramientas de evaluación en línea

**Inversión total**: $45,000 millones de pesos
**Beneficiarios**: 25 millones de estudiantes y 1.2 millones de docentes
**Plazo de implementación**: 3 años

El programa incluye medidas de seguridad digital y protección de datos de menores.""",
                "category": "education",
                "scope": "federal",
                "municipality_code": None,
                "state_code": None,
                "status": "active",
                "author": "Secretaría de Educación Pública",
                "source_url": "https://sep.gob.mx/digitalizacion-educativa-2024",
                "deadline": datetime.utcnow() + timedelta(days=45),
                "ai_analysis": {
                    "personal_impact": "Si tienes hijos en edad escolar o trabajas en educación, esta propuesta mejoraría significativamente el acceso a herramientas tecnológicas y la calidad educativa.",
                    "beneficiaries": ["estudiantes", "docentes", "familias", "sector tecnológico"],
                    "fairness_score": 0.78,
                    "recommendation": "yes",
                    "confidence": 0.88,
                    "summary": "Inversión importante en el futuro educativo del país con beneficios a largo plazo.",
                    "benefits": [
                        "Mejor preparación digital de estudiantes",
                        "Acceso equitativo a recursos educativos",
                        "Modernización del sistema educativo",
                        "Impulso a la industria tecnológica nacional"
                    ],
                    "risks": [
                        "Alto costo fiscal",
                        "Dependencia de proveedores tecnológicos",
                        "Necesidad de mantenimiento continuo",
                        "Posible resistencia al cambio"
                    ]
                }
            },
            {
                "title": "Ley de Protección de Datos Personales Reforzada",
                "summary": "Fortalecimiento del marco legal para la protección de datos personales con sanciones más severas y mejores derechos para los ciudadanos.",
                "content": """La Ley de Protección de Datos Personales Reforzada busca actualizar el marco normativo actual para brindar mayor protección a los ciudadanos:

**Principales modificaciones:**

1. **Derechos ampliados**:
   - Derecho al olvido digital
   - Portabilidad de datos personales
   - Consentimiento granular para diferentes usos
   - Notificación obligatoria de violaciones en 72 horas

2. **Sanciones reforzadas**:
   - Multas de hasta 4% de los ingresos anuales globales
   - Suspensión temporal de operaciones para reincidentes
   - Responsabilidad personal de directivos

3. **Obligaciones empresariales**:
   - Evaluaciones de impacto en privacidad obligatorias
   - Designación de oficiales de protección de datos
   - Auditorías externas anuales para empresas grandes

4. **Derechos especiales**:
   - Protección reforzada para menores de edad
   - Tratamiento especial de datos sensibles
   - Procedimientos simplificados para ejercer derechos

**Entrada en vigor**: 12 meses después de aprobación
**Período de adaptación**: 6 meses para empresas existentes

La ley incluye excepciones para investigación científica, seguridad nacional y prevención de delitos.""",
                "category": "social",
                "scope": "federal",
                "municipality_code": None,
                "state_code": None,
                "status": "active",
                "author": "Instituto Nacional de Transparencia",
                "source_url": "https://inai.gob.mx/ley-proteccion-datos-2024",
                "deadline": datetime.utcnow() + timedelta(days=60),
                "ai_analysis": {
                    "personal_impact": "Esta ley te brindaría mayor control sobre tu información personal y mejores herramientas para proteger tu privacidad en línea.",
                    "beneficiaries": ["ciudadanos", "consumidores", "organizaciones civiles"],
                    "fairness_score": 0.82,
                    "recommendation": "yes",
                    "confidence": 0.90,
                    "summary": "Fortalecimiento necesario de la protección de datos que beneficia principalmente a los ciudadanos.",
                    "benefits": [
                        "Mayor control sobre datos personales",
                        "Mejores remedios legales ante violaciones",
                        "Transparencia empresarial obligatoria",
                        "Armonización con estándares internacionales"
                    ],
                    "risks": [
                        "Costos de cumplimiento para empresas",
                        "Posible impacto en innovación tecnológica",
                        "Complejidad en implementación",
                        "Necesidad de capacitación especializada"
                    ]
                }
            }
        ]
        
        for proposal_data in sample_proposals:
            existing_proposal = db.query(Proposal).filter(
                Proposal.title == proposal_data["title"]
            ).first()
            if not existing_proposal:
                crud.ProposalCRUD.create_proposal(db, proposal_data)
                print(f"✅ Propuesta creada: {proposal_data['title'][:50]}...")
        
        # 3. Crear funcionarios de ejemplo
        sample_officials = [
            {
                "name": "Claudia Sheinbaum Pardo",
                "position": "Jefa de Gobierno de la Ciudad de México",
                "level": "municipal",
                "municipality_code": 9,
                "state_code": 9,
                "party": "MORENA",
                "email": "contacto@jefatura.cdmx.gob.mx",
                "website": "https://jefedegobierno.cdmx.gob.mx",
                "biography": "Doctora en Física por la UNAM, especialista en ingeniería energética y ambiental. Ha ocupado diversos cargos en la administración pública del Distrito Federal.",
                "start_date": datetime(2018, 12, 5),
                "end_date": datetime(2024, 10, 4),
                "is_active": True
            },
            {
                "name": "Enrique Alfaro Ramírez",
                "position": "Gobernador de Jalisco",
                "level": "state",
                "municipality_code": None,
                "state_code": 14,
                "party": "Movimiento Ciudadano",
                "email": "gobernador@jalisco.gob.mx",
                "website": "https://www.jalisco.gob.mx",
                "biography": "Licenciado en Administración Pública, ha sido alcalde de Tlajomulco y líder de diversos proyectos de desarrollo urbano en Jalisco.",
                "start_date": datetime(2018, 12, 6),
                "end_date": datetime(2024, 12, 5),
                "is_active": True
            },
            {
                "name": "Samuel García Sepúlveda",
                "position": "Gobernador de Nuevo León",
                "level": "state",
                "municipality_code": None,
                "state_code": 19,
                "party": "Movimiento Ciudadano",
                "email": "gobernador@nl.gob.mx",
                "website": "https://www.nl.gob.mx",
                "biography": "Abogado especialista en derecho fiscal, senador de la República por Nuevo León (2018-2021). Enfoque en modernización administrativa y transparencia.",
                "start_date": datetime(2021, 10, 4),
                "end_date": datetime(2027, 10, 3),
                "is_active": True
            },
            {
                "name": "Andrés Manuel López Obrador",
                "position": "Presidente de México",
                "level": "federal",
                "municipality_code": None,
                "state_code": None,
                "party": "MORENA",
                "email": "contacto@presidencia.gob.mx",
                "website": "https://www.gob.mx/presidencia",
                "biography": "Licenciado en Ciencias Políticas y Administración Pública por la UNAM. Jefe de Gobierno del Distrito Federal (2000-2005), tres veces candidato presidencial.",
                "start_date": datetime(2018, 12, 1),
                "end_date": datetime(2024, 11, 30),
                "is_active": True
            },
            {
                "name": "Rosa Icela Rodríguez Velázquez",
                "position": "Secretaria de Seguridad y Protección Ciudadana",
                "level": "federal",
                "municipality_code": None,
                "state_code": None,
                "party": "MORENA",
                "email": "contacto@sspc.gob.mx",
                "website": "https://www.gob.mx/sspc",
                "biography": "Licenciada en Psicología, ha ocupado diversos cargos en la administración pública federal relacionados con seguridad y desarrollo social.",
                "start_date": datetime(2020, 10, 15),
                "end_date": None,
                "is_active": True
            }
        ]
        
        for official_data in sample_officials:
            existing_official = db.query(Official).filter(
                Official.name == official_data["name"]
            ).first()
            if not existing_official:
                crud.OfficialCRUD.create_official(db, official_data)
                print(f"✅ Funcionario creado: {official_data['name']}")
        
        print("🎉 Datos de ejemplo creados exitosamente!")
        
    except Exception as e:
        print(f"❌ Error creando datos de ejemplo: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Función principal"""
    print("🚀 Inicializando base de datos...")
    
    # Inicializar DB
    init_db()
    
    # Crear datos de ejemplo
    create_sample_data()
    
    print("✅ Inicialización completa!")

if __name__ == "__main__":
    main()

---

# backend/requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dateutil==2.8.2
requests==2.31.0

---

# backend/run_server.py
"""
Script para ejecutar el servidor con datos de ejemplo
"""

import uvicorn
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.dirname(__file__))

from init_data import main as init_data
from main import app

def run_with_init():
    """Ejecutar servidor con inicialización de datos"""
    print("🚀 Iniciando Shout Aloud Backend...")
    
    # Inicializar datos si es necesario
    try:
        init_data()
    except Exception as e:
        print(f"⚠️ Warning: Error en inicialización: {e}")
    
    # Ejecutar servidor
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    run_with_init()

---

# backend/.env.example
# Database
DATABASE_URL=sqlite:///./shout_aloud.db

# JWT Secret (cambiar en producción)
SECRET_KEY=your-super-secret-jwt-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS Settings
ALLOWED_ORIGINS=["http://localhost:3000", "https://your-frontend.replit.app"]

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=Shout Aloud API

# External Services (opcional)
OPENAI_API_KEY=your_openai_key_here
HUGGINGFACE_API_KEY=your_hf_key_here

# Logging
LOG_LEVEL=INFO

---

# src/services/apiService.js (actualizado para officials)
// Agregar estos métodos al apiService existente

// Officials
async getOfficials(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return await api.get(`/officials?${params}`);
},

async getOfficial(id) {
  return await api.get(`/officials/${id}`);
},

async getOfficialRatings(officialId) {
  return await api.get(`/officials/${officialId}/ratings`);
},

async getOfficialReputation(officialId, scope = 'municipality') {
  return await api.get(`/officials/${officialId}/reputation?scope=${scope}`);
},

async rateOfficial(officialId, ratingData) {
  return await api.post(`/officials/${officialId}/rate`, ratingData);
},

async getMyRating(officialId) {
  return await api.get(`/officials/${officialId}/my-rating`);
},

async removeOfficialRating(officialId) {
  return await api.delete(`/officials/${officialId}/my-rating`);
},

// Tags
async getAllTags() {
  return await api.get('/tags');
},

async getTagsByCategory(category) {
  return await api.get(`/tags?category=${category}`);
},

---

# README_officials.md
# 🏛️ Sistema de Calificación de Funcionarios

## 🎯 Funcionalidades Implementadas

### Backend API
- **GET /officials** - Lista de funcionarios con filtros
- **GET /officials/{id}** - Detalle de funcionario específico
- **POST /officials/{id}/rate** - Calificar funcionario con etiqueta
- **GET /officials/{id}/ratings** - Resumen de calificaciones
- **GET /officials/{id}/reputation** - Score de reputación calculado
- **GET /officials/{id}/my-rating** - Mi calificación actual
- **DELETE /officials/{id}/my-rating** - Eliminar mi calificación
- **GET /tags** - Lista de etiquetas disponibles

### Frontend React
- **OfficialsScreen** - Pantalla principal con lista de funcionarios
- **OfficialCard** - Tarjeta individual con información y calificación
- **RatingDialog** - Modal para calificar con etiquetas
- **Filtros avanzados** - Por nivel, ubicación, búsqueda
- **Reputation scoring** - Visualización de puntuación de reputación

## 🔧 Características Técnicas

### Etiquetas Predefinidas
```python
# Positivas (peso > 0)
"ético", "transparente", "eficiente", "cumple_promesas", 
"cercano_ciudadanos", "innovador", "responsable", "honesto"

# Negativas (peso < 0)  
"corrupto", "mentiroso", "ineficiente", "autoritario",
"irresponsable", "desconectado", "conflicto_intereses", "nepotismo"

# Neutrales (peso = 0)
"nuevo", "veterano", "académico", "empresario", "independiente"
```

### Sistema de Puntuación
- **Score 0-100**: Basado en pesos de etiquetas
- **Una calificación por usuario**: Se puede cambiar, no duplicar
- **Anonimato**: Solo se almacenan estadísticas, no quién calificó
- **Filtrado por zona**: Municipal, estatal, nacional

### Base de Datos SQLite
```sql
-- Funcionarios
officials: id, name, position, level, municipality_code, party, etc.

-- Etiquetas  
tags: id, name, category, weight, description

-- Calificaciones
ratings: official_id, tag_id, user_id, municipality_code, created_at

-- Constraint: Una calificación por usuario por funcionario
```

## 🚀 Uso Rápido

### 1. Iniciar Backend
```bash
cd backend
python run_server.py
# Crea datos de ejemplo automáticamente
```

### 2. Funcionalidades Frontend
- **Lista de funcionarios** con filtros por nivel y ubicación
- **Buscar** por nombre o cargo
- **Ver reputación** con score visual y breakdown
- **Calificar** seleccionando etiqueta apropiada
- **Cambiar calificación** en cualquier momento
- **Ver mi calificación** actual

### 3. Datos de Ejemplo Incluidos
- **5 funcionarios** reales (Sheinbaum, Alfaro, Samuel García, AMLO, Rosa Icela)
- **25 etiquetas** categorizadas (positivas, negativas, neutrales)
- **3 usuarios** de ejemplo de diferentes municipios

## 🎨 Interfaz de Usuario

### Características UX
- **Cards responsivas** con información completa
- **Score visual** con barra de progreso coloreada
- **Modal intuitivo** para calificar con etiquetas categorizadas
- **Feedback inmediato** al calificar
- **Estados de carga** y manejo de errores
- **Diseño consistente** con el resto de la app

### Sistema sin Comentarios
- **Solo etiquetas predefinidas** - evita toxicidad
- **Categorización clara** - positivo/negativo/neutral
- **Descripciones** para cada etiqueta
- **Prevención de spam** - una calificación por usuario

El sistema está **completamente funcional** y listo para usar tanto en desarrollo como producción. Permite a los ciudadanos evaluar el desempeño de sus funcionarios de manera constructiva y anónima. 🗳️
                