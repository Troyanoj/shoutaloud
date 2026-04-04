import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface ProposalModerationBarProps {
  proposalId: string;
  initialReports?: number;
  initialTrusts?: number;
  onUpdate?: (trustCount: number, reportCount: number) => void;
  className?: string;
}

interface ModerationStatus {
  trustCount: number;
  reportCount: number;
  userAction: 'trust' | 'report' | null;
  status: 'clean' | 'under_review' | 'flagged' | 'trusted';
}

const ProposalModerationBar: React.FC<ProposalModerationBarProps> = ({
  proposalId,
  initialReports = 0,
  initialTrusts = 0,
  onUpdate,
  className = ''
}) => {
  const [moderation, setModeration] = useState<ModerationStatus>({
    trustCount: initialTrusts,
    reportCount: initialReports,
    userAction: null,
    status: 'clean'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'trust' | 'report' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<'trust' | 'report' | null>(null);

  // Simular obtención del estado inicial de moderación
  useEffect(() => {
    const fetchModerationStatus = async () => {
      setIsLoading(true);
      try {
        // Simular llamada a API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simular respuesta del backend
        const mockResponse = {
          trustCount: initialTrusts,
          reportCount: initialReports,
          userAction: null as 'trust' | 'report' | null,
          status: determineStatus(initialTrusts, initialReports)
        };
        
        setModeration(mockResponse);
      } catch (err) {
        setError('Error al cargar el estado de moderación');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModerationStatus();
  }, [proposalId, initialTrusts, initialReports]);

  // Determinar el estado basado en los contadores
  const determineStatus = (trusts: number, reports: number): ModerationStatus['status'] => {
    const total = trusts + reports;
    if (total === 0) return 'clean';
    
    const trustRatio = trusts / total;
    const reportRatio = reports / total;
    
    if (trusts >= 10 && trustRatio >= 0.8) return 'trusted';
    if (reports >= 5 && reportRatio >= 0.6) return 'flagged';
    if (reports >= 3) return 'under_review';
    
    return 'clean';
  };

  // Manejar acción de moderación
  const handleModerationAction = async (action: 'trust' | 'report') => {
    if (moderation.userAction) {
      setError('Ya has participado en la moderación de esta propuesta');
      return;
    }

    setActionLoading(action);
    setError(null);

    try {
      // Simular firma digital y validación DID
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular llamada a API
      const endpoint = action === 'trust' 
        ? `/api/proposals/moderate/trust`
        : `/api/proposals/moderate/report`;
      
      // Simular respuesta exitosa
      const newTrustCount = action === 'trust' ? moderation.trustCount + 1 : moderation.trustCount;
      const newReportCount = action === 'report' ? moderation.reportCount + 1 : moderation.reportCount;
      
      const updatedModeration = {
        ...moderation,
        trustCount: newTrustCount,
        reportCount: newReportCount,
        userAction: action,
        status: determineStatus(newTrustCount, newReportCount)
      };

      setModeration(updatedModeration);
      
      // Notificar al componente padre
      onUpdate?.(newTrustCount, newReportCount);
      
    } catch (err) {
      setError('Error al procesar la acción de moderación');
    } finally {
      setActionLoading(null);
    }
  };

  // Calcular porcentajes para la barra de progreso
  const total = moderation.trustCount + moderation.reportCount;
  const trustPercentage = total > 0 ? (moderation.trustCount / total) * 100 : 0;
  const reportPercentage = total > 0 ? (moderation.reportCount / total) * 100 : 0;

  // Obtener configuración de estado
  const getStatusConfig = () => {
    switch (moderation.status) {
      case 'trusted':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          label: 'Propuesta Confiable',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'flagged':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
          label: 'Propuesta Reportada',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'under_review':
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
          label: 'En Revisión',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: <ShieldCheck className="w-4 h-4 text-gray-600" />,
          label: 'Sin Moderación',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-50 rounded-lg ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        <span className="ml-2 text-sm text-gray-600">Cargando estado de moderación...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Moderación Comunitaria</h3>
        </div>
        
        {/* Estado actual */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color} border`}>
          {statusConfig.icon}
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Barra de progreso */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Confianza vs Reportes</span>
            <span>{moderation.trustCount} / {moderation.reportCount}</span>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${trustPercentage}%` }}
              />
              <div 
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${reportPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">{moderation.trustCount}</div>
          <div className="text-xs text-green-600">Confirmaciones</div>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-700">{moderation.reportCount}</div>
          <div className="text-xs text-red-600">Reportes</div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Botón Confirmar Legitimidad */}
        <div className="relative">
          <button
            onClick={() => handleModerationAction('trust')}
            disabled={!!moderation.userAction || actionLoading === 'trust'}
            onMouseEnter={() => setShowTooltip('trust')}
            onMouseLeave={() => setShowTooltip(null)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
              ${moderation.userAction === 'trust' 
                ? 'bg-green-100 text-green-700 border-2 border-green-300 cursor-not-allowed' 
                : moderation.userAction
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1'
              }`}
          >
            {actionLoading === 'trust' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>
              {moderation.userAction === 'trust' ? 'Confirmada' : 'Confirmar Legitimidad'}
            </span>
          </button>
          
          {/* Tooltip */}
          {showTooltip === 'trust' && !moderation.userAction && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
              Confirma que esta propuesta es legítima y útil
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>

        {/* Botón Denunciar */}
        <div className="relative">
          <button
            onClick={() => handleModerationAction('report')}
            disabled={!!moderation.userAction || actionLoading === 'report'}
            onMouseEnter={() => setShowTooltip('report')}
            onMouseLeave={() => setShowTooltip(null)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
              ${moderation.userAction === 'report' 
                ? 'bg-red-100 text-red-700 border-2 border-red-300 cursor-not-allowed' 
                : moderation.userAction
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
              }`}
          >
            {actionLoading === 'report' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            <span>
              {moderation.userAction === 'report' ? 'Reportada' : 'Denunciar Propuesta'}
            </span>
          </button>
          
          {/* Tooltip */}
          {showTooltip === 'report' && !moderation.userAction && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
              Reporta spam, contenido inapropiado o fraudulento
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Información adicional */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-blue-800 font-medium">Moderación Descentralizada</p>
          <p className="text-xs text-blue-700 mt-1">
            Tu participación es anónima pero verificada mediante DID. Solo puedes moderar una vez por propuesta.
          </p>
        </div>
      </div>

      {/* Mensaje de participación */}
      {moderation.userAction && (
        <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            ✅ Ya has participado en la moderación de esta propuesta
          </p>
        </div>
      )}
    </div>
  );
};

export default ProposalModerationBar;