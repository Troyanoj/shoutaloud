import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, TrendingUp, MapPin, CheckCircle, AlertCircle, Bot } from 'lucide-react';
import { Proposal } from '../services/api';

interface ProposalCardProps {
  proposal: Proposal;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
  const participationRate = proposal.total_votes > 0 
    ? ((proposal.votes_for + proposal.votes_against) / proposal.total_votes * 100) 
    : 0;
  
  const supportRate = proposal.total_votes > 0 
    ? (proposal.votes_for / (proposal.votes_for + proposal.votes_against) * 100) 
    : 0;

  const isActive = proposal.status === 'active';
  const daysLeft = new Date(proposal.end_date).getTime() - new Date().getTime();
  const daysRemaining = Math.max(0, Math.ceil(daysLeft / (1000 * 60 * 60 * 24)));

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
      case 'completed': return 'Completada';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header con estado y IA */}
        <div className="flex items-start justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
            {getStatusText(proposal.status)}
          </span>
          
          {proposal.ai_analysis && (
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-democracy-purple" />
              <span className="text-xs text-democracy-purple font-medium">
                IA: {proposal.ai_analysis.legal_viability}/100
              </span>
            </div>
          )}
        </div>

        {/* Título y descripción */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {proposal.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3">
            {proposal.description}
          </p>
        </div>

        {/* Análisis de IA tags */}
        {proposal.ai_analysis?.tags && proposal.ai_analysis.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {proposal.ai_analysis.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-democracy-purple/10 text-democracy-purple">
                  {tag}
                </span>
              ))}
              {proposal.ai_analysis.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{proposal.ai_analysis.tags.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Municipio y tiempo */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{proposal.municipality}</span>
          </div>
          {isActive && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>
                {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Último día'}
              </span>
            </div>
          )}
        </div>

        {/* Estadísticas de votación */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de votación</span>
            <span className="text-sm text-gray-500">{proposal.total_votes} votos</span>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-democracy-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(supportRate, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-democracy-green" />
              <span>A favor: {proposal.votes_for}</span>
            </span>
            <span className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3 text-democracy-red" />
              <span>En contra: {proposal.votes_against}</span>
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/proposal/${proposal.id}`}
            className="flex-1 bg-democracy-blue text-white py-2 px-4 rounded-md text-center text-sm font-medium hover:bg-democracy-blue/90 transition-colors"
          >
            Ver Detalles
          </Link>
          
          {isActive && (
            <Link
              to={`/vote/${proposal.id}`}
              className="flex-1 bg-democracy-green text-white py-2 px-4 rounded-md text-center text-sm font-medium hover:bg-democracy-green/90 transition-colors"
            >
              Votar Ahora
            </Link>
          )}
        </div>

        {/* Recomendación de IA */}
        {proposal.ai_analysis?.recommendation && (
          <div className="mt-4 p-3 bg-democracy-purple/5 rounded-md border-l-4 border-democracy-purple">
            <div className="flex items-start space-x-2">
              <Bot className="h-4 w-4 text-democracy-purple mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-democracy-purple mb-1">Análisis IA</p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {proposal.ai_analysis.recommendation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalCard;