import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, TrendingUp, Bot, Vote, Share2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiService, Proposal, VoteResult } from '../services/api';

const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProposalData(id);
    }
  }, [id]);

  const loadProposalData = async (proposalId: string) => {
    setLoading(true);
    try {
      const [proposalData, resultsData] = await Promise.all([
        ApiService.getProposal(proposalId),
        ApiService.getVoteResults(proposalId).catch(() => null) // No fallar si no hay resultados
      ]);
      
      setProposal(proposalData);
      setVoteResults(resultsData);
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTimeLeft = () => {
    if (!proposal) return '';
    const timeLeft = new Date(proposal.end_date).getTime() - new Date().getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (timeLeft < 0) return 'Votación finalizada';
    if (days > 0) return `${days} días y ${hours} horas restantes`;
    if (hours > 0) return `${hours} horas restantes`;
    return 'Menos de 1 hora restante';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Votación Activa';
      case 'completed': return 'Votación Completada';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Propuesta no encontrada</h2>
        <p className="text-gray-600 mb-6">La propuesta que buscas no existe o ha sido eliminada.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-democracy-blue text-white px-6 py-2 rounded-md hover:bg-democracy-blue/90 transition-colors"
        >
          Volver a propuestas
        </button>
      </div>
    );
  }

  const supportPercentage = proposal.total_votes > 0 
    ? (proposal.votes_for / (proposal.votes_for + proposal.votes_against)) * 100 
    : 0;

  const isActive = proposal.status === 'active';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navegación */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-democracy-blue hover:text-democracy-blue/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a propuestas</span>
        </button>
      </div>

      {/* Header de la propuesta */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                {getStatusText(proposal.status)}
              </span>
              {proposal.ai_analysis && (
                <div className="flex items-center space-x-1 text-democracy-purple">
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    IA: {proposal.ai_analysis.legal_viability}/100
                  </span>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{proposal.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{proposal.municipality}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Creada: {formatDate(proposal.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{calculateTimeLeft()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            {isActive && (
              <Link
                to={`/vote/${proposal.id}`}
                className="bg-democracy-green text-white px-6 py-3 rounded-md text-center font-medium hover:bg-democracy-green/90 transition-colors flex items-center space-x-2"
              >
                <Vote className="h-4 w-4" />
                <span>Votar Ahora</span>
              </Link>
            )}
            
            <button className="border border-democracy-blue text-democracy-blue px-6 py-2 rounded-md hover:bg-democracy-blue/10 transition-colors flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span>Compartir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción de la Propuesta</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.description}</p>
        </div>
      </div>

      {/* Análisis de IA */}
      {proposal.ai_analysis && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="h-6 w-6 text-democracy-purple" />
            <h2 className="text-xl font-semibold text-gray-900">Análisis de Inteligencia Artificial</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Viabilidad Legal</span>
                  <span className="text-sm font-bold text-democracy-green">
                    {proposal.ai_analysis.legal_viability}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-democracy-green h-3 rounded-full transition-all duration-500"
                    style={{ width: `${proposal.ai_analysis.legal_viability}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Impacto Esperado</span>
                  <span className="text-sm font-bold text-democracy-blue">
                    {proposal.ai_analysis.impact_score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-democracy-blue h-3 rounded-full transition-all duration-500"
                    style={{ width: `${proposal.ai_analysis.impact_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Categorías Identificadas</h3>
              <div className="flex flex-wrap gap-2">
                {proposal.ai_analysis.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-democracy-purple/10 text-democracy-purple text-sm rounded-full border border-democracy-purple/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-democracy-purple/5 rounded-lg p-4 border border-democracy-purple/20">
            <h3 className="font-semibold text-democracy-purple mb-2">Recomendación del Sistema</h3>
            <p className="text-gray-700">{proposal.ai_analysis.recommendation}</p>
          </div>
        </div>
      )}

      {/* Resultados de votación */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Resultados de Votación</h2>
        
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-democracy-blue/10 rounded-lg">
            <div className="text-2xl font-bold text-democracy-blue">{proposal.total_votes}</div>
            <div className="text-sm text-gray-600">Total de Votos</div>
          </div>
          <div className="text-center p-4 bg-democracy-green/10 rounded-lg">
            <div className="text-2xl font-bold text-democracy-green">{proposal.votes_for}</div>
            <div className="text-sm text-gray-600">A Favor</div>
          </div>
          <div className="text-center p-4 bg-democracy-red/10 rounded-lg">
            <div className="text-2xl font-bold text-democracy-red">{proposal.votes_against}</div>
            <div className="text-sm text-gray-600">En Contra</div>
          </div>
          <div className="text-center p-4 bg-democracy-purple/10 rounded-lg">
            <div className="text-2xl font-bold text-democracy-purple">{supportPercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Apoyo</div>
          </div>
        </div>

        {/* Barra de progreso visual */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Distribución de votos</span>
            <span className="text-sm text-gray-500">
              {proposal.votes_for + proposal.votes_against} votos válidos
            </span>
          </div>
          
          <div className="flex rounded-lg overflow-hidden h-8 bg-gray-200">
            <div 
              className="bg-democracy-green flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${supportPercentage}%` }}
            >
              {supportPercentage > 15 && `${supportPercentage.toFixed(1)}%`}
            </div>
            <div 
              className="bg-democracy-red flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${100 - supportPercentage}%` }}
            >
              {(100 - supportPercentage) > 15 && `${(100 - supportPercentage).toFixed(1)}%`}
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-democracy-green" />
              <span>A favor</span>
            </span>
            <span className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3 text-democracy-red" />
              <span>En contra</span>
            </span>
          </div>
        </div>

        {/* Participación por municipio (si hay datos) */}
        {voteResults?.participation_by_municipality && Object.keys(voteResults.participation_by_municipality).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Participación por Municipio</h3>
            <div className="space-y-3">
              {Object.entries(voteResults.participation_by_municipality).map(([municipality, participation]) => (
                <div key={municipality} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{municipality}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-democracy-blue h-2 rounded-full"
                        style={{ width: `${Math.min(participation, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {participation.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-democracy-blue/5 rounded-lg p-4 border border-democracy-blue/20">
        <h4 className="font-semibold text-democracy-blue mb-2">🔒 Transparencia y Seguridad</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div>✓ Todos los votos están registrados en blockchain para máxima transparencia</div>
          <div>✓ Identidades verificadas con sistema DID descentralizado</div>
          <div>✓ Privacidad garantizada mediante pruebas de conocimiento cero</div>
          <div>✓ Imposible manipular o duplicar votos gracias a la criptografía</div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;