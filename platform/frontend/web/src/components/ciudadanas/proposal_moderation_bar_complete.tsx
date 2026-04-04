import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Shield, CheckCircle, XCircle, AlertTriangle, Crown } from 'lucide-react';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { useReputationService } from '@/hooks/useReputationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ModerationAction {
  action: 'approve' | 'reject' | 'request_changes';
  reason: string;
  severity?: 'low' | 'medium' | 'high';
}

interface ProposalModerationBarProps {
  proposalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  onModerate: (action: ModerationAction) => Promise<void>;
  disabled?: boolean;
  existingModerations?: Array<{
    moderator_did: string;
    action: string;
    reason: string;
    timestamp: string;
  }>;
}

export const ProposalModerationBar: React.FC<ProposalModerationBarProps> = ({
  proposalId,
  status,
  onModerate,
  disabled = false,
  existingModerations = []
}) => {
  const { user } = useAuth();
  const { getReputationData } = useReputationService();
  const [moderatorReputation, setModeratorReputation] = useState(null);
  const [reason, setReason] = useState('');
  const [selectedAction, setSelectedAction] = useState<ModerationAction['action'] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadModeratorReputation = async () => {
      if (!user?.did || !user?.roles?.includes('moderator')) return;
      
      try {
        const reputationData = await getReputationData(user.did);
        setModeratorReputation(reputationData);
      } catch (error) {
        console.error('Error loading moderator reputation:', error);
      }
    };

    loadModeratorReputation();
  }, [user?.did, getReputationData]);

  const handleModeration = async (action: ModerationAction['action']) => {
    if (!reason.trim()) {
      toast.error('Por favor, proporciona una razón para tu decisión de moderación');
      return;
    }

    setLoading(true);
    setSelectedAction(action);

    try {
      await onModerate({
        action,
        reason: reason.trim(),
        severity: action === 'reject' ? 'high' : 'low'
      });

      // Feedback motivacional para moderadores con reputación
      if (moderatorReputation?.level === 'Líder Comunitario') {
        toast.success(`Moderación aplicada. Como ${moderatorReputation.level}, tu decisión tiene peso doble en el sistema.`);
      } else {
        toast.success('Moderación aplicada correctamente');
      }

      setReason('');
      setSelectedAction(null);
    } catch (error) {
      toast.error('Error al aplicar la moderación');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      case 'changes_requested':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Cambios Solicitados</Badge>;
      default:
        return <Badge variant="outline"><Shield className="w-3 h-3 mr-1" />Pendiente Moderación</Badge>;
    }
  };

  // Solo mostrar si el usuario es moderador
  if (!user?.roles?.includes('moderator')) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2 text-amber-600" />
            Panel de Moderación
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            
            {/* Badge de reputación del moderador */}
            {moderatorReputation && (
              <ReputationBadge 
                did={user.did} 
                className="ml-2"
                showLevelOnly
                tooltip={`Moderador ${moderatorReputation.level}. Has moderado ${moderatorReputation.moderations || 0} propuestas.`}
              />
            )}

            {/* Indicador de peso de voto doble para Líderes Comunitarios */}
            {moderatorReputation?.level === 'Líder Comunitario' && (
              <Badge className="ml-2 bg-purple-100 text-purple-800" variant="outline">
                <Crown className="w-3 h-3 mr-1" />
                Voto +2
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Historial de moderaciones existentes */}
        {existingModerations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Moderaciones Anteriores:</h4>
            {existingModerations.map((mod, index) => (
              <div key={index} className="text-xs bg-white p-2 rounded border-l-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium">DID: {mod.moderator_did.slice(0, 12)}...</span>
                  <span className="text-gray-500">{new Date(mod.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-600 mt-1">
                  <strong>{mod.action.toUpperCase()}:</strong> {mod.reason}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Solo mostrar controles si la propuesta está pendiente */}
        {status === 'pending' && !disabled && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Razón de la decisión:</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explica detalladamente tu decisión de moderación..."
                className="min-h-[80px]"
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleModeration('approve')}
                disabled={loading || !reason.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {loading && selectedAction === 'approve' ? 'Aprobando...' : 'Aprobar'}
              </Button>

              <Button
                onClick={() => handleModeration('request_changes')}
                disabled={loading || !reason.trim()}
                variant="outline"
                className="flex-1 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                size="sm"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {loading && selectedAction === 'request_changes' ? 'Procesando...' : 'Solicitar Cambios'}
              </Button>

              <Button
                onClick={() => handleModeration('reject')}
                disabled={loading || !reason.trim()}
                variant="destructive"
                className="flex-1"
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {loading && selectedAction === 'reject' ? 'Rechazando...' : 'Rechazar'}
              </Button>
            </div>

            {/* Guía de moderación para nuevos moderadores */}
            {moderatorReputation && moderatorReputation.moderations < 5 && (
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border-l-2 border-blue-200">
                <strong>💡 Guía de Moderación:</strong>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li><strong>Aprobar:</strong> La propuesta cumple estándares de calidad y es constructiva</li>
                  <li><strong>Solicitar Cambios:</strong> Buena idea pero necesita mejoras específicas</li>
                  <li><strong>Rechazar:</strong> Viola términos, es spam o no aporta valor significativo</li>
                </ul>
              </div>
            )}
          </>
        )}

        {/* Mensaje para moderadores con alta reputación */}
        {moderatorReputation?.level === 'Líder Comunitario' && (
          <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border-l-2 border-purple-200">
            <Crown className="w-3 h-3 inline mr-1" />
            <strong>Líder Comunitario:</strong> Tu experiencia en moderación otorga peso doble a tus decisiones.
          </div>
        )}
      </CardContent>
    </Card>
  );
};