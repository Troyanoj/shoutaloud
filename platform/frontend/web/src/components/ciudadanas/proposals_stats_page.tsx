import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  MapPin,
  Loader2,
  RefreshCw
} from 'lucide-react';
import StatsCard from '../components/ciudadanas/StatsCard';
import DonutChart from '../components/ciudadanas/charts/DonutChart';
import CategoryChart from '../components/ciudadanas/charts/CategoryChart';

interface GeneralStats {
  total_proposals: number;
  validated_proposals: number;
  rejected_proposals: number;
  pending_proposals: number;
  unique_voters: number;
  total_votes: number;
  proposals_by_category: Array<{
    category: string;
    count: number;
  }>;
  top_municipalities: Array<{
    municipality: string;
    count: number;
  }>;
  most_supported_proposals: Array<{
    id: string;
    title: string;
    support_count: number;
    rejection_count: number;
  }>;
}

const ProposalsStatsPage: React.FC = () => {
  // Estados
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Cargar estadísticas
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/proposals/stats/general');
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }
      
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchStats();
  }, []);

  // Preparar datos para gráficos
  const getStatusDistribution = () => {
    if (!stats) return [];
    
    const total = stats.total_proposals;
    if (total === 0) return [];
    
    return [
      {
        label: 'validated',
        value: stats.validated_proposals,
        color: '#10B981',
        percentage: (stats.validated_proposals / total) * 100
      },
      {
        label: 'pending',
        value: stats.pending_proposals,
        color: '#F59E0B',
        percentage: (stats.pending_proposals / total) * 100
      },
      {
        label: 'rejected',
        value: stats.rejected_proposals,
        color: '#EF4444',
        percentage: (stats.rejected_proposals / total) * 100
      }
    ].filter(item => item.value > 0);
  };

  const getCategoryData = () => {
    if (!stats || !stats.proposals_by_category) return [];
    
    const total = stats.proposals_by_category.reduce((sum, cat) => sum + cat.count, 0);
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];
    
    return stats.proposals_by_category
      .map((cat, index) => ({
        category: cat.category,
        count: cat.count,
        percentage: total > 0 ? (cat.count / total) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 categorías
  };

  // Calcular participación promedio
  const getAverageParticipation = () => {
    if (!stats || stats.total_proposals === 0) return 0;
    return Math.round(stats.total_votes / stats.total_proposals);
  };

  // Calcular tasa de validación
  const getValidationRate = () => {
    if (!stats || stats.total_proposals === 0) return 0;
    return ((stats.validated_proposals / stats.total_proposals) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando estadísticas ciudadanas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar estadísticas
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Estadísticas Ciudadanas
              </h1>
              <p className="text-gray-600 mt-1">
                Impacto y participación en Shout Aloud
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <p className="text-sm text-gray-500">
                  Actualizado: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
              <button
                onClick={fetchStats}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Propuestas"
            value={stats.total_proposals}
            icon={FileText}
            subtitle="Propuestas ciudadanas"
          />
          
          <StatsCard
            title="Propuestas Validadas"
            value={stats.validated_proposals}
            icon={CheckCircle}
            subtitle={`${getValidationRate().toFixed(1)}% del total`}
          />
          
          <StatsCard
            title="Ciudadanos Activos"
            value={stats.unique_voters}
            icon={Users}
            subtitle="Participantes únicos"
          />
          
          <StatsCard
            title="Participación Promedio"
            value={getAverageParticipation()}
            icon={TrendingUp}
            subtitle="Votos por propuesta"
          />
        </div>

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Estado de Propuestas */}
          <DonutChart
            title="Estado de las Propuestas"
            data={getStatusDistribution()}
            centerValue={stats.total_proposals.toString()}
            centerLabel="Total"
          />
          
          {/* Propuestas por Categoría */}
          <CategoryChart
            title="Propuestas por Categoría"
            data={getCategoryData()}
          />
        </div>

        {/* Sección de Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Propuestas Más Apoyadas */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Propuestas Más Apoyadas
            </h3>
            
            <div className="space-y-4">
              {stats.most_supported_proposals.slice(0, 5).map((proposal, index) => (
                <div key={proposal.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {proposal.title}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-green-600">
                        👍 {proposal.support_count}
                      </span>
                      <span className="text-xs text-red-600">
                        👎 {proposal.rejection_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {stats.most_supported_proposals.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay propuestas con apoyos aún
                </p>
              )}
            </div>
          </div>

          {/* Top Municipios Activos */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Municipios Más Activos
            </h3>
            
            <div className="space-y-4">
              {stats.top_municipalities.slice(0, 5).map((municipality, index) => {
                const maxCount = Math.max(...stats.top_municipalities.map(m => m.count));
                const percentage = maxCount > 0 ? (municipality.count / maxCount) * 100 : 0;
                
                return (
                  <div key={municipality.municipality} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏛️</span>
                        <span className="text-sm font-medium text-gray-700">
                          {municipality.municipality}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {municipality.count}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              {stats.top_municipalities.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay datos de municipios disponibles
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                Impacto de la Participación Ciudadana
              </h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                Estas estadísticas reflejan cómo los ciudadanos están usando Shout Aloud 
                para impulsar el cambio colectivo. Cada voto cuenta para validar las propuestas 
                que más impacto pueden tener en nuestras comunidades.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {stats.total_votes}
                  </div>
                  <div className="text-xs text-blue-700">Total Votos</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {((stats.validated_proposals / Math.max(stats.total_proposals, 1)) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-blue-700">Tasa Validación</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {stats.proposals_by_category.length}
                  </div>
                  <div className="text-xs text-blue-700">Categorías Activas</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {stats.top_municipalities.length}
                  </div>
                  <div className="text-xs text-blue-700">Municipios</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalsStatsPage;