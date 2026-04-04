import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Hash, 
  Eye, 
  MessageCircle, 
  Share2,
  ExternalLink,
  Clock,
  Shield
} from 'lucide-react';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { ProposalSupportBar } from '@/components/proposals/ProposalSupportBar';
import { ProposalModerationBar } from '@/components/proposals/ProposalModerationBar';
import { ProposalComments } from '@/components/proposals/ProposalComments';
import { useReputationService } from '@/hooks/useReputationService';
import { useAuth } from '@/contexts/AuthContext';
import { useProposals } from '@/hooks/useProposals';
import { toast } from 'sonner';

export const ProposalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProposal, voteOnProposal, moderateProposal } = useProposals();
  const { getReputationData } = useReputationService();
  
  const [proposal, setProposal] = useState(null);
  const [authorReputation, setAuthorReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProposal = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const proposalData = await getProposal(id);
        setProposal(proposalData);
        
        // Cargar reputación del autor
        if (proposalData?.author_did) {
          try {
            const reputationData = await getReputationData(proposalData.author_did);
            setAuthorReputation(reputationData);
          } catch (repError) {
            console.error('Error loading author reputation:', repError);
            // No es crítico, continúa sin la reputación
          }
        }
      } catch (err) {
        setError('No se pudo cargar la propuesta');
        console.error('Error loading proposal:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [id, getProposal, getReputationData]);

  const handleVote = async (vote: 'support' | 'reject') => {
    if (!proposal || !user) return;

    try {
      await voteOnProposal(proposal.id, vote);
      
      // Actualizar datos locales
      setProposal(prev => ({
        ...prev,
        support_count: vote === 'support' ? prev.support_count + 1 : prev.support_count,
        reject_count: vote === 'reject' ? prev.reject_count + 1 : prev.reject_count,
        user_vote: vote
      }));
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  };

  const handleModeration = async (action) => {
    if (!proposal) return;

    try {
      await moderateProposal(proposal.id, action);
      
      // Actualizar estado local
      setProposal(prev => ({
        ...prev,
        moderation_status: action.action,
        moderation_reason: action.reason
      }));
    } catch (error) {
      console.error('Error moderating:', error);
      throw error;
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: proposal.title,
        text: proposal.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✅ Aprobada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rechazada</Badge>;
      case 'changes_requested':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Cambios Solicitados</Badge>;
      default:
        return <Badge variant="outline">⏳ En Revisión</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Propuesta no encontrada'}</p>
            <Button onClick={() => navigate('/proposals')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Propuestas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          onClick={() => navigate('/proposals')} 
          variant="ghost" 
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Propuestas
        </Button>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(proposal.moderation_status)}
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Compartir
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="space-y-6">
        {/* Información de la propuesta */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle className="text-2xl leading-tight">
                {proposal.title}
              </CardTitle>
              
              {/* Metadata del autor */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {proposal.author_did.slice(0, 12)}...
                  </span>
                </div>
                
                {/* Badge de reputación del autor */}
                {authorReputation && (
                  <ReputationBadge 
                    did={proposal.author_did}
                    tooltip={`Este ciudadano ha contribuido con ${authorReputation.proposals || 0} propuestas y ${authorReputation.votes || 0} validaciones.`}
                    className="w-fit"
                  />
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(proposal.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono text-xs">#{proposal.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* Categoría y etiquetas */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {proposal.category || 'General'}
                </Badge>
                {proposal.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {proposal.description}
              </p>
            </div>

            {/* Enlaces externos si existen */}
            {proposal.external_links && proposal.external_links.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Referencias:</h4>
                <div className="space-y-2">
                  {proposal.external_links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barra de validación ciudadana */}
        <ProposalSupportBar
          proposalId={proposal.id}
          currentSupport={proposal.support_count || 0}
          currentReject={proposal.reject_count || 0}
          userVote={proposal.user_vote}
          onVote={handleVote}
          disabled={proposal.moderation_status === 'rejected'}
        />

        {/* Barra de moderación (solo para moderadores) */}
        {user?.roles?.includes('moderator') && (
          <ProposalModerationBar
            proposalId={proposal.id}
            status={proposal.moderation_status || 'pending'}
            onModerate={handleModeration}
            existingModerations={proposal.moderations || []}
          />
        )}

        <Separator />

        {/* Sección de comentarios */}
        <ProposalComments proposalId={proposal.id} />

        {/* Metadata técnica (solo para desarrolladores/auditores) */}
        {user?.roles?.includes('admin') && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Metadata Técnica (Solo Administradores)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-gray-500">IPFS Hash:</span>
                  <br />
                  <code className="bg-gray-100 px-1 rounded">{proposal.ipfs_hash}</code>
                </div>
                <div>