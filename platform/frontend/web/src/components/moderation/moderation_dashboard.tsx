import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Flag,
  Users,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Componentes reutilizables (asumiendo que existen o los definimos aquí)
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'blue',
  trend 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 ${!trend.isPositive ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Interfaces para los datos
interface ModerationStats {
  totalModerated: number;
  trustedCount: number;
  flaggedCount: number;
  underReviewCount: number;
  participationRate: number;
  avgTimeToFirstModeration: number;
  uniqueModerators: number;
}

interface TopProposal {
  id: string;
  title: string;
  municipality: string;
  trustCount: number;
  reportCount: number;
  status: 'trusted' | 'flagged' | 'under_review' | 'clean';
}

interface ModerationListItem {
  id: string;
  title: string;
  author: string;
  municipality: string;
  category: string;
  status: 'trusted' | 'flagged' | 'under_review' | 'clean';
  trustCount: number;
  reportCount: number;
  createdAt: string;
}

interface MunicipalityStats {
  name: string;
  totalModerations: number;
  trustedRatio: number;
}

const ModerationDashboard: React.FC = () => {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [topProposals, setTopProposals] = useState<{trusted: TopProposal[], flagged: TopProposal[]} | null>(null);
  const [municipalityStats, setMunicipalityStats] = useState<MunicipalityStats[]>([]);
  const [proposals, setProposals] = useState<ModerationListItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros y paginación
  const [filters, setFilters] = useState({
    status: '',
    municipality: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular múltiples llamadas a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock de estadísticas generales
      const mockStats: ModerationStats = {
        totalModerated: 1247,
        trustedCount: 892,
        flaggedCount: 124,
        underReviewCount: 231,
        participationRate: 34.7,
        avgTimeToFirstModeration: 4.2,
        uniqueModerators: 2856
      };

      // Mock de top propuestas
      const mockTopProposals = {
        trusted: [
          { id: '1', title: 'Mejora del transporte público municipal', municipality: 'Medellín', trustCount: 124, reportCount: 3, status: 'trusted' as const },
          { id: '2', title: 'Programa de reciclaje comunitario', municipality: 'Bogotá', trustCount: 98, reportCount: 1, status: 'trusted' as const },
          { id: '3', title: 'Espacios verdes en centros urbanos', municipality: 'Cali', trustCount: 87, reportCount: 2, status: 'trusted' as const }
        ],
        flagged: [
          { id: '4', title: 'Propuesta controvertida sin fundamento', municipality: 'Barranquilla', trustCount: 12, reportCount: 45, status: 'flagged' as const },
          { id: '5', title: 'Solicitud de recursos sin justificación', municipality: 'Cartagena', trustCount: 8, reportCount: 32, status: 'flagged' as const }
        ]
      };

      // Mock de estadísticas por municipio
      const mockMunicipalityStats: MunicipalityStats[] = [
        { name: 'Medellín', totalModerations: 342, trustedRatio: 0.78 },
        { name: 'Bogotá', totalModerations: 298, trustedRatio: 0.72 },
        { name: 'Cali', totalModerations: 234, trustedRatio: 0.81 },
        { name: 'Barranquilla', totalModerations: 187, trustedRatio: 0.65 },
        { name: 'Cartagena', totalModerations: 156, trustedRatio: 0.69 }
      ];

      // Mock de lista de propuestas
      const mockProposals: ModerationListItem[] = Array.from({ length: 25 }, (_, i) => ({
        id: `prop-${i}`,
        title: `Propuesta ciudadana ${i + 1}`,
        author: `Ciudadano ${i + 1}`,
        municipality: ['Medellín', 'Bogotá', 'Cali', 'Barranquilla', 'Cartagena'][i % 5],
        category: ['Transporte', 'Medio Ambiente', 'Educación', 'Salud', 'Infraestructura'][i % 5],
        status: (['trusted', 'flagged', 'under_review', 'clean'] as const)[i % 4],
        trustCount: Math.floor(Math.random() * 100),
        reportCount: Math.floor(Math.random() * 20),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

      setStats(mockStats);
      setTopProposals(mockTopProposals);
      setMunicipalityStats(mockMunicipalityStats);
      setProposals(mockProposals);
      
    } catch (err) {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar propuestas
  const filteredProposals = proposals.filter(proposal => {
    const matchesStatus = !filters.status || proposal.status === filters.status;
    const matchesMunicipality = !filters.municipality || proposal.municipality === filters.municipality;
    const matchesSearch = !filters.search || 
      proposal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      proposal.author.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesMunicipality && matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const paginatedProposals = filteredProposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Obtener configuración de badge de moderación
  const getModerationBadge = (status: string, trustCount: number, reportCount: number) => {
    switch (status) {
      case 'trusted':
        return {
          icon: <ShieldCheck className="w-3 h-3" />,
          label: 'Confiable',
          className: 'bg-green-100 text-green-700 border border-green-300'
        };
      case 'flagged':
        return {
          icon: <Flag className="w-3 h-3" />,
          label: 'Reportada',
          className: 'bg-red-100 text-red-700 border border-red-300'
        };
      case 'under_review':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'En Revisión',
          className: 'bg-yellow-100 text-yellow-700 border border-yellow-300'
        };
      default:
        return {
          icon: <Shield className="w-3 h-3" />,
          label: 'Sin Moderar',
          className: 'bg-gray-100 text-gray-700 border border-gray-300'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando Panel de Moderación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Moderación Comunitaria</h1>
              <p className="text-gray-600">Transparencia total en el proceso de autogobierno ciudadano</p>
            </div>
          </div>
          
          {/* Aviso educativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Moderación Comunitaria</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Este sistema refleja la opinión colectiva de la comunidad y no constituye una evaluación oficial. 
                  La moderación es un proceso democrático y transparente donde cada ciudadano tiene voz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Moderadas"
              value={stats.totalModerated.toLocaleString()}
              subtitle="propuestas evaluadas"
              icon={<Shield className="w-5 h-5" />}
              color="blue"
            />
            
            <StatsCard
              title="Propuestas Confiables"
              value={stats.trustedCount}
              subtitle={`${((stats.trustedCount / stats.totalModerated) * 100).toFixed(1)}% del total`}
              icon={<ShieldCheck className="w-5 h-5" />}
              color="green"
              trend={{ value: 12.3, isPositive: true }}
            />
            
            <StatsCard
              title="Participación"
              value={`${stats.participationRate}%`}
              subtitle={`${stats.uniqueModerators.toLocaleString()} moderadores únicos`}
              icon={<Users className="w-5 h-5" />}
              color="yellow"
              trend={{ value: 8.7, isPositive: true }}
            />
            
            <StatsCard
              title="Tiempo Promedio"
              value={`${stats.avgTimeToFirstModeration}h`}
              subtitle="hasta primera moderación"
              icon={<Clock className="w-5 h-5" />}
              color="gray"
              trend={{ value: 15.2, isPositive: false }}
            />
          </div>
        )}

        {/* Gráficos y Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Distribución por Estado */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h3>
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Confiables</span>
                  </div>
                  <span className="text-sm font-medium">{stats.trustedCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">En Revisión</span>
                  </div>
                  <span className="text-sm font-medium">{stats.underReviewCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Reportadas</span>
                  </div>
                  <span className="text-sm font-medium">{stats.flaggedCount}</span>
                </div>
                
                {/* Barra de progreso visual */}
                <div className="mt-4">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      <div 
                        className="bg-green-500"
                        style={{ width: `${(stats.trustedCount / stats.totalModerated) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-yellow-500"
                        style={{ width: `${(stats.underReviewCount / stats.totalModerated) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-red-500"
                        style={{ width: `${(stats.flaggedCount / stats.totalModerated) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Municipios */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Municipios Más Activos</h3>
            <div className="space-y-3">
              {municipalityStats.slice(0, 5).map((municipality, index) => (
                <div key={municipality.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{municipality.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{municipality.totalModerations}</div>
                    <div className="text-xs text-gray-500">{(municipality.trustedRatio * 100).toFixed(0)}% confiables</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Propuestas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Más Confiables */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Propuestas Más Confiables
            </h3>
            <div className="space-y-3">
              {topProposals?.trusted.map((proposal) => (
                <div key={proposal.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{proposal.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{proposal.municipality}</span>
                    <div className="flex items-center gap-2">
                      <span>✅ {proposal.trustCount}</span>
                      <span>🚫 {proposal.reportCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Más Reportadas */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-600" />
              Propuestas Más Reportadas
            </h3>
            <div className="space-y-3">
              {topProposals?.flagged.map((proposal) => (
                <div key={proposal.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{proposal.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{proposal.municipality}</span>
                    <div className="flex items-center gap-2">
                      <span>✅ {proposal.trustCount}</span>
                      <span>🚫 {proposal.reportCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Propuestas Moderadas */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Propuestas Moderadas</h3>
            
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar propuestas..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="trusted">Confiables</option>
                <option value="under_review">En Revisión</option>
                <option value="flagged">Reportadas</option>
                <option value="clean">Sin Moderar</option>
              </select>
              
              <select
                value={filters.municipality}
                onChange={(e) => setFilters(prev => ({ ...prev, municipality: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los municipios</option>
                {municipalityStats.map(municipality => (
                  <option key={municipality.name} value={municipality.name}>
                    {municipality.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propuesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moderación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Municipio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProposals.map((proposal) => {
                  const badge = getModerationBadge(proposal.status, proposal.trustCount, proposal.reportCount);
                  return (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                          <div className="text-sm text-gray-500">por {proposal.author}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-green-600">✅ {proposal.trustCount}</span>
                          <span className="text-red-600">🚫 {proposal.reportCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {proposal.municipality}
                      </td>
                      <td className="px-6 py-4">
                        <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredProposals.length)} de {filteredProposals.length} resultados
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-3 py-1 text-sm">
                  {currentPage} de {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;