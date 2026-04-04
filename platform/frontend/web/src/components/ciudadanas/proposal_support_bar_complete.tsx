import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Users } from 'lucide-react';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { useReputationService } from '@/hooks/useReputationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProposalSupportBarProps {
  proposalId: string;
  currentSupport: number;
  currentReject: number;
  userVote?: 'support' | 'reject' | null;
  onVote: (vote: 'support' | 'reject') => void;
  disabled?: boolean;
}

export const ProposalSupportBar: React.FC<ProposalSupportBarProps> = ({
  proposalId,
  currentSupport,
  currentReject,
  userVote,
  onVote,
  disabled = false
}) => {
  const { user } = useAuth();
  const { getReputationData } = useReputationService();
  const [userReputation, setUserReputation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserReputation = async () => {
      if (!user?.did) return;
      
      try {
        const reputationData = await getReputationData(user.did);
        setUserReputation(reputationData);
      } catch (error) {
        console.error('Error loading user reputation:', error);
      }
    };

    loadUserReputation();
  }, [user?.did, getReputationData]);

  const handleVote = async (vote: 'support' | 'reject') => {
    if (!user) {
      toast.error('Debes iniciar sesión para validar propuestas');
      return;
    }

    setLoading(true);
    try {
      await onVote(vote);
      
      // Mostrar feedback motivacional basado en reputación
      if (userReputation?.score >= 21) {
        toast.success(
          vote === 'support' 
            ? `¡Gracias por tu validación! Como ${userReputation.level}, tu participación fortalece la comunidad.`
            : `Validación registrada. Tu experiencia como ${userReputation.level} es valiosa para la comunidad.`
        );
      } else {
        toast.success(
          vote === 'support' 
            ? '¡Validación registrada! Cada participación cuenta.'
            : 'Validación registrada. Gracias por tu análisis crítico.'
        );
      }
    } catch (error) {
      toast.error('Error al registrar tu validación');
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = currentSupport + currentReject;
  const supportPercentage = totalVotes > 0 ? (currentSupport / totalVotes) * 100 : 0;
  const rejectPercentage = totalVotes > 0 ? (currentReject / totalVotes) * 100 : 0;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      {/* Barra de progreso visual */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Validación Ciudadana</span>
          <span>{totalVotes} validaciones</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full flex">
            <div 
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${supportPercentage}%` }}
            />
            <div 
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${rejectPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>👍 {currentSupport} ({supportPercentage.toFixed(1)}%)</span>
          <span>👎 {currentReject} ({rejectPercentage.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Botones de validación con reputación */}
      <div className="flex items-center gap-3">
        <Button
          variant={userVote === 'support' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('support')}
          disabled={disabled || loading}
          className="flex-1"
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          Validar Propuesta
        </Button>

        <Button
          variant={userVote === 'reject' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => handleVote('reject')}
          disabled={disabled || loading}
          className="flex-1"
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          Necesita Mejoras
        </Button>

        {/* Badge de reputación del usuario - Solo si score >= 21 */}
        {user && userReputation?.score >= 21 && (
          <ReputationBadge 
            did={user.did} 
            className="ml-2" 
            showLevelOnly 
            tooltip={`Tu nivel: ${userReputation.level}. Has contribuido con ${userReputation.proposals || 0} propuestas y ${userReputation.votes || 0} validaciones.`}
          />
        )}
      </div>

      {/* Mensaje motivacional para nuevos usuarios */}
      {user && userReputation && userReputation.score < 21 && (
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-2 border-blue-200">
          💡 <strong>¡Sigue participando!</strong> Necesitas {21 - userReputation.score} puntos más para desbloquear tu badge de reputación.
        </div>
      )}

      {/* Estado de la propia validación */}
      {userVote && (
        <div className="flex items-center justify-center text-sm text-gray-600">
          <Badge variant={userVote === 'support' ? 'default' : 'destructive'} className="mr-2">
            {userVote === 'support' ? '👍 Validaste' : '👎 Sugeriste mejoras'}
          </Badge>
          <span className="text-xs">
            {userVote === 'support' 
              ? 'Gracias por validar esta propuesta' 
              : 'Gracias por tu análisis crítico'
            }
          </span>
        </div>
      )}
    </div>
  );
};