import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Eye, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, Users, Star, Award, Sprout } from 'lucide-react';

// Simulación de datos y funciones del sistema
const getReputationData = (did) => {
  const mockReputations = {
    'did:citizen:001': { score: 15, level: 'Ciudadano Nuevo', badges: ['Verificado'] },
    'did:citizen:002': { score: 45, level: 'Participante Activo', badges: ['Verificado', 'Colaborador'] },
    'did:citizen:003': { score: 120, level: 'Líder Comunitario', badges: ['Verificado', 'Colaborador', 'Mentor'] },
    'did:citizen:004': { score: 8, level: 'Ciudadano Nuevo', badges: ['Verificado'] },
    'did:citizen:005': { score: 75, level: 'Participante Activo', badges: ['Verificado', 'Colaborador'] },
    'did:citizen:006': { score: 200, level: 'Líder Comunitario', badges: ['Verificado', 'Colaborador', 'Mentor', 'Experto'] }
  };
  return mockReputations[did] || { score: 0, level: 'Sin Reputación', badges: [] };
};

const mockProposals = [
  {
    id: 1,
    title: "Mejora del transporte público en el centro",
    author: "did:citizen:003",
    authorName: "Ana García",
    status: "pending",
    votes: 156,
    comments: 23,
    createdAt: "2025-06-15T10:30:00Z",
    category: "Transporte",
    description: "Propuesta para optimizar las rutas de autobuses y crear carriles exclusivos"
  },
  {
    id: 2,
    title: "Parque comunitario en el barrio Norte",
    author: "did:citizen:001",
    authorName: "Carlos López",
    status: "approved",
    votes: 89,
    comments: 12,
    createdAt: "2025-06-14T14:20:00Z",
    category: "Espacios Públicos",
    description: "Creación de un nuevo parque con áreas recreativas para familias"
  },
  {
    id: 3,
    title: "Programa de reciclaje municipal",
    author: "did:citizen:002",
    authorName: "María Rodríguez",
    status: "rejected",
    votes: 67,
    comments: 8,
    createdAt: "2025-06-13T09:15:00Z",
    category: "Medio Ambiente",
    description: "Implementación de un sistema de reciclaje domiciliario"
  },
  {
    id: 4,
    title: "Iluminación LED en calles principales",
    author: "did:citizen:006",
    authorName: "Roberto Silva",
    status: "pending",
    votes: 234,
    comments: 45,
    createdAt: "2025-06-12T16:45:00Z",
    category: "Infraestructura",
    description: "Reemplazar el alumbrado actual por tecnología LED más eficiente"
  },
  {
    id: 5,
    title: "Centro de salud comunitario",
    author: "did:citizen:004",
    authorName: "Elena Martín",
    status: "under_review",
    votes: 78,
    comments: 15,
    createdAt: "2025-06-11T11:30:00Z",
    category: "Salud",
    description: "Construcción de un centro de atención primaria en la zona este"
  },
  {
    id: 6,
    title: "Red de ciclovías conectadas",
    author: "did:citizen:005",
    authorName: "David Fernández",
    status: "pending",
    votes: 145,
    comments: 28,
    createdAt: "2025-06-10T08:20:00Z",
    category: "Transporte",
    description: "Crear una red integral de ciclovías que conecte toda la ciudad"
  }
];

const REPUTATION_FILTERS = [
  { key: 'all', label: 'Mostrar todas', icon: Users, color: 'bg-gray-100 text-gray-700' },
  { key: 'new', label: 'Nuevos (0-20)', icon: Sprout, color: 'bg-yellow-100 text-yellow-700', range: [0, 20] },
  { key: 'active', label: 'Activos (21-99)', icon: Star, color: 'bg-blue-100 text-blue-700', range: [21, 99] },
  { key: 'leaders', label: 'Líderes (100+)', icon: Award, color: 'bg-green-100 text-green-700', range: [100, 1000] }
];

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircle },
  under_review: { label: 'En Revisión', color: 'bg-blue-100 text-blue-800', icon: Eye }
};

const ModerationDashboard = () => {
  const [proposals, setProposals] = useState(mockProposals);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reputationFilter, setReputationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [proposalsPerPage] = useState(5);

  // Precargar reputaciones de los autores
  const [authorReputations, setAuthorReputations] = useState({});

  useEffect(() => {
    const loadReputations = async () => {
      const reputations = {};
      for (const proposal of proposals) {
        if (!reputations[proposal.author]) {
          reputations[proposal.author] = getReputationData(proposal.author);
        }
      }
      setAuthorReputations(reputations);
    };
    loadReputations();
  }, [proposals]);

  // Filtrar propuestas según los criterios seleccionados
  const filteredProposals = useMemo(() => {
    return proposals.filter(proposal => {
      // Filtro por búsqueda
      const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proposal.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proposal.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;

      // Filtro por reputación
      let matchesReputation = true;
      if (reputationFilter !== 'all') {
        const authorReputation = authorReputations[proposal.author];
        if (authorReputation) {
          const filterConfig = REPUTATION_FILTERS.find(f => f.key === reputationFilter);
          if (filterConfig && filterConfig.range) {
            const [min, max] = filterConfig.range;
            matchesReputation = authorReputation.score >= min && authorReputation.score <= max;
          }
        } else {
          matchesReputation = false;
        }
      }

      return matchesSearch && matchesStatus && matchesReputation;
    });
  }, [proposals, searchTerm, statusFilter, reputationFilter, authorReputations]);

  // Paginación
  const indexOfLastProposal = currentPage * proposalsPerPage;
  const indexOfFirstProposal = indexOfLastProposal - proposalsPerPage;
  const currentProposals = filteredProposals.slice(indexOfFirstProposal, indexOfLastProposal);
  const totalPages = Math.ceil(filteredProposals.length / proposalsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReputationBadge = (authorDid) => {
    const reputation = authorReputations[authorDid];
    if (!reputation) return null;

    let config;
    if (reputation.score <= 20) config = REPUTATION_FILTERS[1];
    else if (reputation.score <= 99) config = REPUTATION_FILTERS[2];
    else config = REPUTATION_FILTERS[3];

    const IconComponent = config.icon;
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {reputation.score}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard de Moderación
        </h1>
        <p className="text-gray-600">
          Gestiona las propuestas ciudadanas con transparencia y contexto de reputación
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar propuestas, autores o categorías..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros de estado y reputación */}
        <div className="flex flex-wrap gap-4">
          {/* Filtro por estado */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de la propuesta
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="under_review">En revisión</option>
            </select>
          </div>

          {/* Filtro por reputación */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reputación del autor
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={reputationFilter}
              onChange={(e) => setReputationFilter(e.target.value)}
            >
              {REPUTATION_FILTERS.map(filter => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros rápidos de reputación (botones toggle) */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2 self-center">Filtro rápido:</span>
          {REPUTATION_FILTERS.map(filter => {
            const IconComponent = filter.icon;
            const isActive = reputationFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setReputationFilter(filter.key)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? filter.color + ' ring-2 ring-offset-1 ring-gray-400' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-1" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Mostrando {currentProposals.length} de {filteredProposals.length} propuestas
          </span>
          <span>
            Página {currentPage} de {totalPages}
          </span>
        </div>
      </div>

      {/* Tabla de propuestas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propuesta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Autor & Reputación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProposals.map((proposal) => {
                const statusConfig = STATUS_CONFIG[proposal.status];
                const StatusIcon = statusConfig.icon;
                const reputation = authorReputations[proposal.author];

                return (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {proposal.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {proposal.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="text-sm font-medium text-gray-900">
                          {proposal.authorName}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getReputationBadge(proposal.author)}
                          {reputation && (
                            <span className="text-xs text-gray-500">
                              {reputation.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {proposal.votes}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {proposal.comments}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(proposal.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Ver
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                          Moderar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Mensaje informativo sobre el filtro de reputación */}
      {reputationFilter !== 'all' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Filter className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Filtro de reputación activo</p>
              <p>
                Este filtro ayuda a entender el contexto de participación del autor. 
                Todas las propuestas son valiosas independientemente de la reputación de quien las presenta.
                <button 
                  onClick={() => setReputationFilter('all')}
                  className="ml-2 text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Mostrar todas las propuestas
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationDashboard;