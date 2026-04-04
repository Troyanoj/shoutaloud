import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
import ProposalCard from './ProposalCard';
import { ApiService, Proposal } from '../services/api';

interface ProposalsListProps {
  municipalityId: string;
}

const ProposalsList: React.FC<ProposalsListProps> = ({ municipalityId }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    loadProposals();
  }, [municipalityId]);

  useEffect(() => {
    filterAndSortProposals();
  }, [proposals, searchTerm, statusFilter, sortBy]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getProposals(municipalityId || undefined);
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProposals = () => {
    let filtered = [...proposals];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.municipality.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    // Ordenar
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'most_voted':
        filtered.sort((a, b) => b.total_votes - a.total_votes);
        break;
      case 'least_voted':
        filtered.sort((a, b) => a.total_votes - b.total_votes);
        break;
      case 'ending_soon':
        filtered.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        break;
      default:
        break;
    }

    setFilteredProposals(filtered);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Propuestas Ciudadanas</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-democracy-blue"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Propuestas Ciudadanas</h2>
          <p className="text-gray-600">
            {filteredProposals.length} propuestas encontradas
            {municipalityId && ` en tu municipio`}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={loadProposals}
            className="flex items-center space-x-2 px-4 py-2 text-democracy-blue border border-democracy-blue rounded-md hover:bg-democracy-blue/10 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-democracy-green text-white rounded-md hover:bg-democracy-green/90 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Nueva Propuesta</span>
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar propuestas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-democracy-blue focus:border-democracy-blue"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-democracy-blue focus:border-democracy-blue"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Votación activa</option>
              <option value="completed">Completadas</option>
              <option value="draft">Borradores</option>
            </select>
          </div>

          {/* Ordenar por */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-democracy-blue focus:border-democracy-blue"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="most_voted">Más votadas</option>
              <option value="least_voted">Menos votadas</option>
              <option value="ending_soon">Terminan pronto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-democracy-blue">
            {proposals.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Activas</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-democracy-green">
            {proposals.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completadas</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-democracy-purple">
            {proposals.reduce((sum, p) => sum + p.total_votes, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Votos</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {proposals.filter(p => p.ai_analysis?.legal_viability && p.ai_analysis.legal_viability > 70).length}
          </div>
          <div className="text-sm text-gray-600">IA Aprobadas</div>
        </div>
      </div>

      {/* Lista de propuestas */}
      {filteredProposals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No se encontraron propuestas</p>
            <p className="text-sm">Intenta ajustar los filtros o crear una nueva propuesta</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {/* Paginación (simulada) */}
      {filteredProposals.length > 10 && (
        <div className="flex justify-center space-x-2 pt-6">
          <button className="px-4 py-2 text-democracy-blue border border-democracy-blue rounded-md hover:bg-democracy-blue/10 transition-colors">
            Anterior
          </button>
          <button className="px-4 py-2 bg-democracy-blue text-white rounded-md">
            1
          </button>
          <button className="px-4 py-2 text-democracy-blue border border-democracy-blue rounded-md hover:bg-democracy-blue/10 transition-colors">
            2
          </button>
          <button className="px-4 py-2 text-democracy-blue border border-democracy-blue rounded-md hover:bg-democracy-blue/10 transition-colors">
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default ProposalsList;