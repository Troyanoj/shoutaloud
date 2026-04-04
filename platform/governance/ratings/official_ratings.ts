import React, { useState, useEffect } from 'react';
import { Star, Users, TrendingUp, Filter, Search, Award, AlertTriangle } from 'lucide-react';
import { ApiService, Official } from '../services/api';

interface OfficialRatingsProps {
  municipalityId: string;
}

const OfficialRatings: React.FC<OfficialRatingsProps> = ({ municipalityId }) => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'total_ratings' | 'name'>('rating');
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Estados para el modal de calificación
  const [newRating, setNewRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submittingRating, setSubmittingRating] = useState(false);

  const availableTags = [
    'Transparente', 'Eficiente', 'Accesible', 'Innovador', 'Responsable',
    'Corrupto', 'Ineficiente', 'Inaccesible', 'Conservador', 'Irresponsable',
    'Comprometido', 'Profesional', 'Comunicativo', 'Lento', 'Partidista'
  ];

  useEffect(() => {
    loadOfficials();
  }, [municipalityId]);

  const loadOfficials = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getOfficials(municipalityId || undefined);
      setOfficials(data);
    } catch (error) {
      console.error('Error loading officials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedOfficials = React.useMemo(() => {
    let filtered = officials;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(official =>
        official.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        official.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        official.municipality.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por posición
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(official => official.position === selectedPosition);
    }

    // Ordenar
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'total_ratings':
        filtered.sort((a, b) => b.total_ratings - a.total_ratings);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [officials, searchTerm, selectedPosition, sortBy]);

  const uniquePositions = React.useMemo(() => {
    return Array.from(new Set(officials.map(o => o.position)));
  }, [officials]);

  const handleRateOfficial = async () => {
    if (!selectedOfficial || newRating === 0) return;

    setSubmittingRating(true);
    try {
      await ApiService.rateOfficial(selectedOfficial.id, newRating, selectedTags);
      
      // Actualizar el oficial localmente
      setOfficials(prev => prev.map(official => 
        official.id === selectedOfficial.id 
          ? { 
              ...official, 
              rating: ((official.rating * official.total_ratings) + newRating) / (official.total_ratings + 1),
              total_ratings: official.total_ratings + 1,
              tags: [...new Set([...official.tags, ...selectedTags])]
            }
          : official
      ));
      
      // Cerrar modal
      setShowRatingModal(false);
      setSelectedOfficial(null);
      setNewRating(0);
      setSelectedTags([]);
    } catch (error) {
      console.error('Error rating official:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const openRatingModal = (official: Official) => {
    setSelectedOfficial(official);
    setShowRatingModal(true);
    setNewRating(0);
    setSelectedTags([]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="h-6 w-6 text-democracy-purple" />
            <span>Calificación de Funcionarios</span>
          </h1>
          <p className="text-gray-600">
            Evalúa el desempeño de tus representantes públicos
            {municipalityId && ` en tu municipio`}
          </p>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-democracy-purple">{officials.length}</div>
          <div className="text-sm text-gray-600">Funcionarios</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-democracy-green">
            {officials.reduce((sum, o) => sum + o.total_ratings, 0)}
          </div>
          <div className="text-sm text-gray-600">Calificaciones</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-democracy-blue">
            {officials.length > 0 ? (officials.reduce((sum, o) => sum + o.rating, 0) / officials.length).toFixed(1) : '0'}
          </div>
          <div className="text-sm text-gray-600">Promedio General</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{uniquePositions.length}</div>
          <div className="text-sm text-gray-600">Cargos Diferentes</div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar funcionarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-democracy-purple focus:border-democracy-purple"
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-democracy-purple focus:border-democracy-purple"
            >
              <option value="all">Todos los cargos</option>
              {uniquePositions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-democracy-purple focus:border-democracy-purple"
            >
              <option value="rating">Mayor calificación</option>
              <option value="total_ratings">Más evaluado</option>
              <option value="name">Orden alfabético</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de funcionarios */}
      {filteredAndSortedOfficials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay funcionarios</h3>
          <p className="text-gray-600">No se encontraron funcionarios con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedOfficials.map((official) => (
            <OfficialCard 
              key={official.id} 
              official={official} 
              onRate={() => openRatingModal(official)}
            />
          ))}
        </div>
      )}

      {/* Modal de calificación */}
      {showRatingModal && selectedOfficial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Calificar a {selectedOfficial.name}
            </h3>
            
            <div className="space-y-4">
              {/* Calificación con estrellas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación (1-5 estrellas)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewRating(star)}
                      className={`h-8 w-8 ${
                        star <= newRating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Etiquetas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiquetas (selecciona las que apliquen)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(prev => prev.filter(t => t !== tag));
                        } else {
                          setSelectedTags(prev => [...prev, tag]);
                        }
                      }}
                      className={`px-2 py-1 rounded-md text-xs transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-democracy-purple text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRateOfficial}
                  disabled={newRating === 0 || submittingRating}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    newRating > 0 && !submittingRating
                      ? 'bg-democracy-purple text-white hover:bg-democracy-purple/90'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submittingRating ? 'Enviando...' : 'Calificar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para cada tarjeta de funcionario
const OfficialCard: React.FC<{ official: Official; onRate: () => void }> = ({ official, onRate }) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-democracy-green';
    if (rating >= 3) return 'text-yellow-500';
    if (rating >= 2) return 'text-orange-500';
    return 'text-democracy-red';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Excelente';
    if (rating >= 3.5) return 'Bueno';
    if (rating >= 2.5) return 'Regular';
    if (rating >= 1.5) return 'Malo';
    return 'Muy malo';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{official.name}</h3>
          <p className="text-sm text-democracy-purple font-medium">{official.position}</p>
          <p className="text-sm text-gray-600">{official.municipality}</p>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${getRatingColor(official.rating)}`}>
            {official.rating.toFixed(1)}
          </div>
          <div className="flex items-center justify-end space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(official.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500">{getRatingText(official.rating)}</div>
        </div>
      </div>

      {/* Etiquetas */}
      {official.tags && official.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {official.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-democracy-purple/10 text-democracy-purple text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
            {official.tags.length > 4 && (
              <span className="text-xs text-gray-500">+{official.tags.length - 4} más</span>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4" />
          <span>{official.total_ratings} calificaciones</span>
        </div>
        
        {official.total_ratings >= 10 && (
          <div className="flex items-center space-x-1 text-democracy-green">
            <Award className="h-4 w-4" />
            <span>Verificado</span>
          </div>
        )}
      </div>

      {/* Botón de calificar */}
      <button
        onClick={onRate}
        className="w-full bg-democracy-purple text-white py-2 px-4 rounded-md hover:bg-democracy-purple/90 transition-colors flex items-center justify-center space-x-2"
      >
        <Star className="h-4 w-4" />
        <span>Calificar</span>
      </button>

      {/* Advertencia si pocas calificaciones */}
      {official.total_ratings < 5 && (
        <div className="mt-3 flex items-center space-x-1 text-xs text-orange-600">
          <AlertTriangle className="h-3 w-3" />
          <span>Pocas calificaciones - resultado preliminar</span>
        </div>
      )}
    </div>
  );
};

export default OfficialRatings;