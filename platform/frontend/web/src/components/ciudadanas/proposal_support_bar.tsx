import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useDID } from '../../hooks/useDID';

interface ProposalSupportBarProps {
  proposalId: string;
  supportCount: number;
  rejectionCount: number;
  onCountUpdate?: (supportCount: number, rejectionCount: number) => void;
  className?: string;
}

interface UserParticipationStatus {
  hasSupported: boolean;
  hasRejected: boolean;
  canParticipate: boolean;
}

const ProposalSupportBar: React.FC<ProposalSupportBarProps> = ({
  proposalId,
  supportCount: initialSupportCount,
  rejectionCount: initialRejectionCount,
  onCountUpdate,
  className = ''
}) => {
  const { did, isAuthenticated } = useDID();
  
  // Estados locales
  const [supportCount, setSupportCount] = useState(initialSupportCount);
  const [rejectionCount, setRejectionCount] = useState(initialRejectionCount);
  const [userStatus, setUserStatus] = useState<UserParticipationStatus>({
    hasSupported: false,
    hasRejected: false,
    canParticipate: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'support' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar estado de participación del usuario
  useEffect(() => {
    const checkUserParticipation = async () => {
      if (!isAuthenticated || !did) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/proposals/${proposalId}/validation-status`, {
          headers: {
            'Authorization': `Bearer ${did}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const status = await response.json();
          setUserStatus({
            hasSupported: status.has_supported || false,
            hasRejected: status.has_rejected || false,
            canParticipate: status.can_participate !== false
          });
        }
      } catch (err) {
        console.error('Error checking user participation:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserParticipation();
  }, [proposalId, did, isAuthenticated]);

  // Manejar apoyo a la propuesta
  const handleSupport = async () => {
    if (!isAuthenticated || !did || userStatus.hasSupported || userStatus.hasRejected) return;

    setActionLoading('support');
    setError(null);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/support`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${did}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voter_did: did
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newSupportCount = supportCount + 1;
        setSupportCount(newSupportCount);
        setUserStatus(prev => ({ ...prev, hasSupported: true, canParticipate: false }));
        
        // Notificar cambio al componente padre
        onCountUpdate?.(newSupportCount, rejectionCount);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al apoyar la propuesta');
      }
    } catch (err) {
      setError('Error de conexión al apoyar la propuesta');
      console.error('Error supporting proposal:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Manejar rechazo a la propuesta
  const handleReject = async () => {
    if (!isAuthenticated || !did || userStatus.hasSupported || userStatus.hasRejected) return;

    setActionLoading('reject');
    setError(null);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${did}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voter_did: did
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newRejectionCount = rejectionCount + 1;
        setRejectionCount(newRejectionCount);
        setUserStatus(prev => ({ ...prev, hasRejected: true, canParticipate: false }));
        
        // Notificar cambio al componente padre
        onCountUpdate?.(supportCount, newRejectionCount);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al rechazar la propuesta');
      }
    } catch (err) {
      setError('Error de conexión al rechazar la propuesta');
      console.error('Error rejecting proposal:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Calcular porcentajes para la barra visual
  const totalVotes = supportCount + rejectionCount;
  const supportPercentage = totalVotes > 0 ? (supportCount / totalVotes) * 100 : 0;
  const rejectionPercentage = totalVotes > 0 ? (rejectionCount / totalVotes) * 100 : 0;

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Barra visual de progreso */}
      <div className="relative">
        <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${supportPercentage}%` }}
          />
          <div 
            className="bg-red-500 transition-all duration-300 ease-out"
            style={{ width: `${rejectionPercentage}%` }}
          />
        </div>
        
        {/* Etiquetas de conteo */}
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4 text-green-600" />
            {supportCount} apoyos ({supportPercentage.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1">
            <ThumbsDown className="w-4 h-4 text-red-600" />
            {rejectionCount} rechazos ({rejectionPercentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Botones de acción */}
      {isAuthenticated ? (
        <div className="flex gap-3">
          {/* Botón de Apoyo */}
          <button
            onClick={handleSupport}
            disabled={!userStatus.canParticipate || userStatus.hasSupported || userStatus.hasRejected || actionLoading !== null || isLoading}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200
              ${userStatus.hasSupported 
                ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                : userStatus.hasRejected
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 active:scale-95'
              }
              ${(!userStatus.canParticipate || actionLoading !== null || isLoading) ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {actionLoading === 'support' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : userStatus.hasSupported ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <ThumbsUp className="w-5 h-5" />
            )}
            {userStatus.hasSupported ? 'Ya apoyaste' : 'Apoyar'}
          </button>

          {/* Botón de Rechazo */}
          <button
            onClick={handleReject}
            disabled={!userStatus.canParticipate || userStatus.hasSupported || userStatus.hasRejected || actionLoading !== null || isLoading}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200
              ${userStatus.hasRejected 
                ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                : userStatus.hasSupported
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 active:scale-95'
              }
              ${(!userStatus.canParticipate || actionLoading !== null || isLoading) ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {actionLoading === 'reject' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : userStatus.hasRejected ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <ThumbsDown className="w-5 h-5" />
            )}
            {userStatus.hasRejected ? 'Ya rechazaste' : 'Rechazar'}
          </button>
        </div>
      ) : (
        <div className="text-center py-4 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-600 text-sm">
            Inicia sesión para participar en la validación
          </p>
        </div>
      )}

      {/* Estado de carga inicial */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600">Verificando tu participación...</span>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Información adicional */}
      {totalVotes > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Total de participaciones: {totalVotes}
        </div>
      )}
    </div>
  );
};

export default ProposalSupportBar;