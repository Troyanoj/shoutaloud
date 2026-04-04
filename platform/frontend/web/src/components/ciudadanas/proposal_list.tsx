import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import ProposalCard from './ProposalCard';
import { apiService } from '../../services/apiService';

interface Proposal {
  id: string;
  title: string;
  description: string;
  municipality: string;
  category: string;
  status: 'pending' | 'validated' | 'rejected';
  ipfs_hash: string;
  author_did: string;
  created_at: string;
  support_count?: number;
  rejection_count?: number;
}

interface ProposalListResponse {
  proposals: Proposal[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const ProposalList: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [municipalityFilter, setMunicipalityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: '', label: 'Todas las categorías' },
    { value: 'infraestructura', label: 'Infraestructura' },
    { value: 'seguridad', label: 'Seguridad' },
    { value: 'medio_ambiente', label: 'Medio Ambiente' },
    { value: 'educacion', label: 'Educación' },
    { value: 'salud', label: 'Salud' },
    { value: 'cultura', label: 'Cultura' },
    { value: 'deporte', label: 'Deporte' },
    { value: 'economia', label: 'Economía' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'validated', label: 'Validadas' },
    { value: 'rejected', label: 'Rechazadas' }
  ];

  const fetchProposals = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '10'
      });

      if (municipalityFilter) params.append('municipality', municipalityFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiService.get<ProposalListResponse>(`/api/proposals?${params}`);
      
      setProposals(response.proposals);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setPage(response.page);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Error al cargar las propuestas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals(1);
  }, [municipalityFilter, categoryFilter, statusFilter, searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      fetchProposals(newPage);
    }
  };

  const handleRefresh = () => {
    fetchProposals(page);
  };

  const clearFilters = () => {
    setMunicipalityFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setSearchTerm('');
  };

  if (loading && proposals.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar propuestas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={municipalityFilter}
              onChange={(e) => setMunicipalityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los municipios</option>
              <option value="Medellín">Medellín</option>
              <option value="Bello">Bello</option>
              <option value="Itagüí">Itagüí</option>
              <option value="Envigado">Envigado</option>
              <option value="Sabaneta">Sabaneta</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Mostrando {proposals.length} de {total} propuestas
          {(municipalityFilter || categoryFilter || statusFilter || searchTerm) && ' (filtradas)'}
        </span>
        {loading && <span className="text-blue-600">Cargando...</span>}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && proposals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay propuestas</h3>
          <p className="text-gray-600">
            {(municipalityFilter || categoryFilter || statusFilter || searchTerm)
              ? 'No se encontraron propuestas con los filtros aplicados.'
              : 'Aún no hay propuestas ciudadanas registradas.'}
          </p>
          {(municipalityFilter || categoryFilter || statusFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ver todas las propuestas
            </button>
          )}
        </div>
      )}

      {/* Proposals list */}
      {proposals.length > 0 && (
        <div className="grid gap-6">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onClick={() => {
                // Future: navigate to proposal detail
                console.log('Navigate to proposal:', proposal.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm font-medium rounded-md disabled:cursor-not-allowed ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default ProposalList;