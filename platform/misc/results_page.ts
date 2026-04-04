// src/components/ResultsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService, VoteResult, Proposal } from '../services/api';
import { VoteSummaryBar } from './ui/VoteSummaryBar';
import { MunicipalityCard } from './ui/MunicipalityCard';

interface MunicipalityResult {
  municipality: string;
  results: VoteOption[];
  totalVotes: number;
}

interface VoteOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  color: string;
}

export const ResultsPage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [municipalityResults, setMunicipalityResults] = useState<MunicipalityResult[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-red-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
  ];

  useEffect(() => {
    if (proposalId) {
      loadResults();
    }
  }, [proposalId]);

  const loadResults = async () => {
    if (!proposalId) return;

    try {
      setLoading(true);
      setError(null);

      // Load proposal details and results in parallel
      const [proposalData, resultsData] = await Promise.all([
        apiService.getProposal(proposalId),
        apiService.getVoteResults(proposalId),
      ]);

      setProposal(proposalData);
      setResults(resultsData);

      // Process municipality breakdown
      processMunicipalityResults(resultsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading results');
    } finally {
      setLoading(false);
    }
  };

  const processMunicipalityResults = (results: VoteResult[]) => {
    const municipalityMap = new Map<string, MunicipalityResult>();

    results.forEach((result) => {
      Object.entries(result.municipality_breakdown).forEach(([municipality, data]) => {
        if (!municipalityMap.has(municipality)) {
          municipalityMap.set(municipality, {
            municipality,
            results: [],
            totalVotes: 0,
          });
        }

        const munResult = municipalityMap.get(municipality)!;
        munResult.results.push({
          id: result.option_id,
          text: `Opción ${result.option_id}`, // You might want to fetch option texts
          votes: data.votes,
          percentage: data.percentage,
          color: colors[munResult.results.length % colors.length],
        });
        munResult.totalVotes += data.votes;
      });
    });

    setMunicipalityResults(Array.from(municipalityMap.values()));
  };

  const getOverallResults = (): VoteOption[] => {
    return results.map((result, index) => ({
      id: result.option_id,
      text: `Opción ${result.option_id}`,
      votes: result.votes,
      percentage: result.percentage,
      color: colors[index % colors.length],
    }));
  };

  const getFilteredResults = (): VoteOption[] => {
    if (selectedMunicipality === 'all') {
      return getOverallResults();
    }

    const municipalityData = municipalityResults.find(
      m => m.municipality === selectedMunicipality
    );
    
    return municipalityData?.results || [];
  };

  const getTotalVotes = (): number => {
    if (selectedMunicipality === 'all') {
      return results.reduce((total, result) => total + result.votes, 0);
    }

    const municipalityData = municipalityResults.find(
      m => m.municipality === selectedMunicipality
    );
    
    return municipalityData?.totalVotes || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar resultados</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadResults}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Propuesta no encontrada</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resultados de Votación</h1>
              <p className="mt-2 text-gray-600">
                {proposal.title} • {proposal.municipality}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {getTotalVotes().toLocaleString()} votos
              </div>
              <div className="text-sm text-gray-500">
                Estado: {proposal.status === 'closed' ? 'Cerrada' : 'Activa'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Resultados {selectedMunicipality !== 'all' ? `- ${selectedMunicipality}` : 'Generales'}
                </h2>
                
                {/* Municipality Filter */}
                <select
                  value={selectedMunicipality}
                  onChange={(e) => setSelectedMunicipality(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los municipios</option>
                  {municipalityResults.map((munResult) => (
                    <option key={munResult.municipality} value={munResult.municipality}>
                      {munResult.municipality}
                    </option>
                  ))}
                </select>
              </div>

              <VoteSummaryBar
                options={getFilteredResults()}
                totalVotes={getTotalVotes()}
                showPercentages={true}
              />

              {/* Detailed Breakdown */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Desglose detallado
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Opción
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Votos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Porcentaje
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progreso
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredResults().map((option, index) => (
                        <tr key={option.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded mr-3 ${colors[index % colors.length]}`} />
                              <span className="text-sm font-medium text-gray-900">
                                {option.text}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {option.votes.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {option.percentage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${colors[index % colors.length]}`}
                                style={{ width: `${option.percentage}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Municipality Comparison Chart */}
            {selectedMunicipality === 'all' && municipalityResults.length > 1 && (
              <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  Comparación por Municipio
                </h3>
                
                <div className="space-y-6">
                  {municipalityResults.map((munResult) => (
                    <div key={munResult.municipality} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{munResult.municipality}</h4>
                        <span className="text-sm text-gray-500">
                          {munResult.totalVotes.toLocaleString()} votos
                        </span>
                      </div>
                      
                      <VoteSummaryBar
                        options={munResult.results}
                        totalVotes={munResult.totalVotes}
                        showPercentages={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Proposal Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información de la Propuesta
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Categoría</label>
                  <p className="text-sm text-gray-900">{proposal.category}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Municipio</label>
                  <p className="text-sm text-gray-900">{proposal.municipality}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de creación</label>
                  <p className="text-sm text-gray-900">
                    {new Date(proposal.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${proposal.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : proposal.status === 'closed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  `}>
                    {proposal.status === 'active' ? 'Activa' : 
                     proposal.status === 'closed' ? 'Cerrada' : 'Borrador'}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estadísticas
              </h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {getTotalVotes().toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-800">Total de votos</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {municipalityResults.length}
                  </div>
                  <div className="text-sm text-green-800">Municipios participantes</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.length}
                  </div>
                  <div className="text-sm text-purple-800">Opciones disponibles</div>
                </div>
              </div>
            </div>

            {/* Top Municipality */}
            {municipalityResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Mayor Participación
                </h3>
                
                {municipalityResults
                  .sort((a, b) => b.totalVotes - a.totalVotes)
                  .slice(0, 3)
                  .map((munResult, index) => (
                    <div 
                      key={munResult.municipality}
                      className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center">
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3
                          ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-yellow-600'}
                        `}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {munResult.municipality}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {munResult.totalVotes.toLocaleString()}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};