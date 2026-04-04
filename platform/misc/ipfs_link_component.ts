// platform/frontend-mobile/web/src/components/ui/IpfsLink.tsx
import React, { useState } from 'react';
import { ExternalLink, FileText, Download, Share2, Eye, Copy } from 'lucide-react';
import { ipfsService } from '../../services/ipfs';

interface IPFSLinkProps {
  hash: string;
  filename?: string;
  description?: string;
  type?: 'document' | 'proposal' | 'result' | 'evidence';
  size?: number;
  className?: string;
  showPreview?: boolean;
  showMetadata?: boolean;
}

export const IPFSLink: React.FC<IPFSLinkProps> = ({
  hash,
  filename = 'documento.pdf',
  description,
  type = 'document',
  size,
  className = '',
  showPreview = false,
  showMetadata = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);

  const getTypeIcon = () => {
    switch (type) {
      case 'proposal':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'result':
        return <Eye className="w-4 h-4 text-green-600" />;
      case 'evidence':
        return <Share2 className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'proposal':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'result':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'evidence':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleView = async () => {
    const url = ipfsService.getPublicUrl(hash, 'pinata');
    window.open(url, '_blank');
  };

  const handlePreview = async () => {
    if (showContent) {
      setShowContent(false);
      return;
    }

    try {
      setIsLoading(true);
      const content = await ipfsService.fetchFromIPFS(hash);
      
      if (typeof content === 'string') {
        setPreviewContent(content.slice(0, 1000)); // Primeros 1000 caracteres
      } else {
        setPreviewContent(JSON.stringify(content, null, 2).slice(0, 1000));
      }
      
      setShowContent(true);
    } catch (error) {
      console.error('Error cargando preview:', error);
      alert('No se pudo cargar el contenido del archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando hash:', error);
    }
  };

  const handleCopyUrl = async () => {
    try {
      const url = ipfsService.getPublicUrl(hash, 'ipfs');
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando URL:', error);
    }
  };

  const isValidHash = ipfsService.isValidHash(hash);

  if (!isValidHash) {
    return (
      <div className={`p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-red-700">
          <FileText className="w-4 h-4" />
          <span className="text-sm">Hash IPFS inválido: {hash}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* Header del archivo */}
      <div className={`p-3 border-b ${getTypeColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <div>
              <div className="font-medium text-sm">{filename}</div>
              {description && (
                <div className="text-xs opacity-75">{description}</div>
              )}
            </div>
          </div>
          
          {showMetadata && size && (
            <div className="text-xs opacity-75">
              {formatSize(size)}
            </div>
          )}
        </div>
      </div>

      {/* Metadatos e información */}
      {showMetadata && (
        <div className="p-3 bg-gray-50 text-xs text-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span>Hash IPFS:</span>
            <div className="flex items-center space-x-1">
              <code className="bg-white px-2 py-1 rounded text-xs font-mono">
                {hash.slice(0, 20)}...
              </code>
              <button
                onClick={handleCopyHash}
                className="p-1 hover:bg-gray-200 rounded"
                title="Copiar hash"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Disponible en:</span>
            <div className="flex space-x-2">
              <a
                href={ipfsService.getPublicUrl(hash, 'pinata')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
                title="Abrir en Pinata Gateway"
              >
                Pinata
              </a>
              <span>•</span>
              <a
                href={ipfsService.getPublicUrl(hash, 'ipfs')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
                title="Abrir en IPFS.io"
              >
                IPFS.io
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="p-3 flex space-x-2">
        <button
          onClick={handleView}
          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Ver Original</span>
        </button>

        {showPreview && (
          <button
            onClick={handlePreview}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            <span>
              {isLoading ? 'Cargando...' : showContent ? 'Ocultar' : 'Preview'}
            </span>
          </button>
        )}

        <button
          onClick={handleCopyUrl}
          className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? 'Copiado!' : 'Compartir'}</span>
        </button>
      </div>

      {/* Vista previa del contenido */}
      {showContent && previewContent && (
        <div className="border-t">
          <div className="p-3 bg-gray-50">
            <div className="text-xs text-gray-600 mb-2">Vista previa (primeros 1000 caracteres):</div>
            <pre className="text-xs bg-white p-3 rounded border max-h-40 overflow-auto whitespace-pre-wrap">
              {previewContent}
            </pre>
            {previewContent.length >= 1000 && (
              <div className="text-xs text-gray-500 mt-2">
                ... contenido truncado. <button onClick={handleView} className="text-blue-600 hover:underline">Ver completo</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para múltiples enlaces IPFS
interface IPFSLinkListProps {
  links: Array<{
    hash: string;
    filename?: string;
    description?: string;
    type?: 'document' | 'proposal' | 'result' | 'evidence';
    size?: number;
  }>;
  title?: string;
  className?: string;
}

export const IPFSLinkList: React.FC<IPFSLinkListProps> = ({
  links,
  title = 'Documentos IPFS',
  className = ''
}) => {
  if (links.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay documentos disponibles</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>{title}</span>
          <span className="text-sm text-gray-500">({links.length})</span>
        </h3>
      )}
      
      <div className="space-y-3">
        {links.map((link, index) => (
          <IPFSLink
            key={link.hash}
            hash={link.hash}
            filename={link.filename}
            description={link.description}
            type={link.type}
            size={link.size}
            showPreview={index < 3} // Solo mostrar preview en los primeros 3
          />
        ))}
      </div>
    </div>
  );
};