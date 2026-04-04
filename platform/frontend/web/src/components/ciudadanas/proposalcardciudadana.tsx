import React from 'react';
import { Clock, MapPin, Tag, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface IpfsLinkProps {
  hash: string;
}

const IpfsLink: React.FC<IpfsLinkProps> = ({ hash }) => (
  <a
    href={`https://ipfs.io/ipfs/${hash}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-blue-600 hover:text-blue-800 truncate max-w-[200px] block"
    title={`Ver en IPFS: ${hash}`}
  >
    📄 {hash.substring(0, 12)}...
  </a>
);

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    description: string;
    municipality: string;
    category: string;
    status: 'pending' | 'validated' | 'rejected';
    ipfs_hash: string;
    author_did: string;
    created_at: string;
    support_count?: number;
    rejection_count?: number;
  };
  onClick?: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onClick }) => {
  const getStatusIcon = () => {
    switch (proposal.status) {
      case 'validated':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    switch (proposal.status) {
      case 'validated':
        return 'Validada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  };

  const getStatusBadgeColor = () => {
    switch (proposal.status) {
      case 'validated':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-4">
          {proposal.title}
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusBadgeColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {proposal.description}
      </p>

      {/* Metadata */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{proposal.municipality}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Tag className="w-4 h-4" />
          <span className="capitalize">{proposal.category.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{formatDate(proposal.created_at)}</span>
        </div>
      </div>

      {/* Support/Rejection counts */}
      {(proposal.support_count !== undefined || proposal.rejection_count !== undefined) && (
        <div className="flex items-center gap-4 mb-4 text-sm">
          {proposal.support_count !== undefined && (
            <div className="flex items-center gap-1 text-green-600">
              <span>👍</span>
              <span>{proposal.support_count}</span>
            </div>
          )}
          {proposal.rejection_count !== undefined && (
            <div className="flex items-center gap-1 text-red-600">
              <span>👎</span>
              <span>{proposal.rejection_count}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-3 flex justify-between items-center">
        <div className="text-xs text-gray-400">
          DID: {proposal.author_did.substring(0, 20)}...
        </div>
        <IpfsLink hash={proposal.ipfs_hash} />
      </div>
    </div>
  );
};

export default ProposalCard;