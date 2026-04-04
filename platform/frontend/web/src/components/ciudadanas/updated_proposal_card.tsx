import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Clock, 
  MapPin, 
  User,
  ShieldCheck,
  AlertTriangle,
  Flag,
  Shield,
  Loader2
} from 'lucide-react';

interface ProposalCardProps {
  id: string;
  title: string;
  description: string;
  author: string;
  location: string;
  supportCount: number;
  commentCount?: number;
  viewCount?: number;
  createdAt: string;
  status: 'draft' | 'active' | 'validated' | 'implemented' | 'rejected';
  category?: string;
  onClick?: () => void;
  moderation_status?: 'trusted' | 'under_review' | 'flagged' | 'clean';
  className?: string;
}

type ModerationStatus = 'trusted' | 'under_review' | 'flagged' | 'clean';

const ProposalCard: React.FC<ProposalCardProps> = ({
  id,
  title,
  description,
  author,
  location,
  supportCount,
  commentCount = 0,
  viewCount = 0,
  createdAt,
  status,
  category,
  onClick,
  moderation_status,
  className = ''
}) => {
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus | null>(
    moderation_status || null
  );
  const [isLoadingModeration, setIsLoadingModeration] = useState(false);
  const [showModerationTooltip, setShowModerationTooltip] = useState(false);

  // Obtener estado de moderación si no viene en props
  useEffect(() => {
    if (!moderation_status) {
      fetchModerationStatus();
    }
  }, [id, moderation_status]);

  const fetchModerationStatus = async () => {
    setIsLoadingModeration(true);
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simular respuesta del backend basada en el ID
      const mockStatuses: ModerationStatus[] = ['trusted', 'under_review', 'flagged', 'clean'];
      const mockStatus = mockStatuses[parseInt(id) % 4] || 'clean';
      
      setModerationStatus(mockStatus);
    } catch (error) {
      console.error('Error fetching moderation status:', error);
      setModerationStatus('clean');
    } finally {
      setIsLoadingModeration(false);
    }
  };

  // Configuración del estado de la propuesta
  const getStatusConfig = () => {
    switch (status) {
      case 'validated':
        return {
          label: 'Validada',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300'
        };
      case 'implemented':
        return {
          label: 'Implementada',
          color: 'text-blue-700',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300'
        };
      case 'active':
        return {
          label: 'Activa',
          color: 'text-orange-700',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300'
        };
      case 'rejected':
        return {
          label: 'Rechazada',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300'
        };
      default:
        return {
          label: 'Borrador',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
    }
  };

  // Configuración del estado de moderación
  const getModerationConfig = () => {
    if (!moderationStatus || moderationStatus === 'clean') return null;

    switch (moderationStatus) {
      case 'trusted':
        return {
          icon: <ShieldCheck className="w-3 h-3" />,
          label: 'Confiable',
          tooltip: 'Esta propuesta ha sido confirmada como legítima por la comunidad',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300'
        };
      case 'under_review':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'En Revisión',
          tooltip: 'Esta propuesta está siendo revisada por reportes de la comunidad',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300'
        };
      case 'flagged':
        return {
          icon: <Flag className="w-3 h-3" />,
          label: 'Reportada',
          tooltip: 'Esta propuesta ha sido reportada múltiples veces por la comunidad',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300'
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  const moderationConfig = getModerationConfig();

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Truncar descripción
  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header con título y badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {title}
            </h3>
            
            {/* Badges de estado y moderación */}
            <div className="flex items-center gap-2 mt-2">
              {/* Badge de estado principal */}
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor}`}
              >
                {statusConfig.label}
              </span>

              {/* Badge de moderación */}
              {moderationConfig && (
                <div className="relative">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${moderationConfig.color} ${moderationConfig.bgColor} ${moderationConfig.borderColor}`}
                    onMouseEnter={() => setShowModerationTooltip(true)}
                    onMouseLeave={() => setShowModerationTooltip(false)}
                  >
                    {moderationConfig.icon}
                    {moderationConfig.label}
                  </span>
                  
                  {/* Tooltip de moderación */}
                  {showModerationTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-20 max-w-xs">
                      {moderationConfig.tooltip}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading de moderación */}
              {isLoadingModeration && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 text-gray-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Verificando</span>
                </div>
              )}

              {/* Badge de categoría */}
              {category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
                  {category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {truncateText(description)}
        </p>

        {/* Metadatos del autor y ubicación */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{author}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Footer con métricas */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Métricas de interacción */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="font-medium">{supportCount}</span>
              <span className="hidden sm:inline">apoyos</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{commentCount}</span>
              <span className="hidden sm:inline">comentarios</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Eye className="w-4 h-4 text-green-500" />
              <span className="font-medium">{viewCount}</span>
              <span className="hidden sm:inline">vistas</span>
            </div>
          </div>

          {/* Indicador de confianza adicional */}
          {moderationStatus === 'trusted' && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Shield className="w-3 h-3" />
              <span className="font-medium">Verificada</span>
            </div>
          )}
          
          {moderationStatus === 'flagged' && (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-medium">⚠️ Cuidado</span>
            </div>
          )}
        </div>
      </div>

      {/* Borde lateral para estado de moderación crítico */}
      {moderationStatus === 'flagged' && (
        <div className="w-1 bg-red-500 absolute left-0 top-0 bottom-0 rounded-l-lg"></div>
      )}
      
      {moderationStatus === 'trusted' && (
        <div className="w-1 bg-green-500 absolute left-0 top-0 bottom-0 rounded-l-lg"></div>
      )}
    </div>
  );
};

export default ProposalCard;