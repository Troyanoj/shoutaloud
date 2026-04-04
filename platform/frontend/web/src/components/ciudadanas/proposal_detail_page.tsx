import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Tag, 
  User, 
  CheckCircle, 
  Clock, 
  XCircle,
  Hash,
  Shield,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import ProposalSupportBar from '../components/ProposalSupportBar';
import IpfsLink from '../components/IpfsLink';
import { apiService } from '../services/apiService';

interface ProposalDetail {
  id: string;
  title: string;
  description: string;
  municipality: string;
  category: string;
  status: 'pending' | 'validated' | 'rejected';
  created_at: string;
  author_did: string;
  ipfs_hash: string;
  support_count: number;
  rejection_count: number;
  signature?: string;
}

const ProposalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProposalDetail(id);
    }
  }, [id]);

  const fetchProposalDetail = async (proposalId: string) => {
    try {
      setLoading(true);
      const data = await apiService.getProposal(proposalId);
      setProposal(data);
    } catch (err) {
      setError('No se pudo cargar la propuesta. Puede que no exista o haya un problema de conexión.');
      console.error('Error fetching proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'validated':
        return {
          icon: CheckCircle,
          text: 'Validada',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'Rechazada',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: Clock,
          text: 'Pendiente',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
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

  const formatDescription = (description: string) => {
    return description.split('\n').map((paragraph, index) => (
      <p key={index} className="mb-3 text-gray-700 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Propuesta no encontrada</h2>
          <p className="text-gray-600 mb-6">
            {error || 'La propuesta que buscas no existe o ha sido eliminada.'}
          </p>
          <button
            onClick={() => navigate('/proposals')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Volver a Propuestas
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(proposal.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/proposals')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a propuestas
          </button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {proposal.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {proposal.municipality}
                </div>
                <div className="flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  {proposal.category}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(proposal.created_at)}
                </div>
              </div>
            </div>
            
            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
              <StatusIcon className={`w-4 h-4 mr-1 ${statusConfig.iconColor}`} />
              {statusConfig.text}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
              <div className="prose max-w-none">
                {formatDescription(proposal.description)}
              </div>
            </div>

            {/* Community Validation */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Validación Comunitaria</h2>
              <ProposalSupportBar
                proposalId={proposal.id}
                support_count={proposal.support_count}
                rejection_count={proposal.rejection_count}
              />
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividad</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Propuesta creada</p>
                    <p className="text-sm text-gray-500">{formatDate(proposal.created_at)}</p>
                  </div>
                </div>
                
                {proposal.status === 'validated' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Propuesta validada por la comunidad</p>
                      <p className="text-sm text-gray-500">Alcanzó el umbral de apoyo necesario</p>
                    </div>
                  </div>
                )}
                
                {proposal.status === 'rejected' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Propuesta rechazada</p>
                      <p className="text-sm text-gray-500">No alcanzó el apoyo suficiente</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Technical Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h3>
              
              <div className="space-y-4">
                {/* Author DID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <User className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate" title={proposal.author_did}>
                      {proposal.author_did.substring(0, 20)}...
                    </span>
                  </div>
                </div>

                {/* IPFS Hash */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hash IPFS</label>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center text-sm text-gray-600 min-w-0 flex-1">
                      <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate" title={proposal.ipfs_hash}>
                        {proposal.ipfs_hash.substring(0, 16)}...
                      </span>
                    </div>
                    <IpfsLink hash={proposal.ipfs_hash} />
                  </div>
                </div>

                {/* Cryptographic Signature */}
                {proposal.signature && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Firma Criptográfica</label>
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate" title={proposal.signature}>
                        {proposal.signature.substring(0, 20)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de apoyos</span>
                  <span className="font-semibold text-green-600">{proposal.support_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de rechazos</span>
                  <span className="font-semibold text-red-600">{proposal.rejection_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Participación total</span>
                  <span className="font-semibold text-gray-900">{proposal.support_count + proposal.rejection_count}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ratio de apoyo</span>
                    <span className="font-semibold text-blue-600">
                      {proposal.support_count + proposal.rejection_count > 0 
                        ? Math.round((proposal.support_count / (proposal.support_count + proposal.rejection_count)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/stats')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver en estadísticas
                </button>
                
                <button 
                  onClick={() => navigate('/proposals')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Explorar más propuestas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetailPage;