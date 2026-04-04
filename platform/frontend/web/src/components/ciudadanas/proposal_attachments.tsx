import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  File, 
  FileImage, 
  FileVideo,
  AlertCircle,
  ExternalLink,
  Paperclip
} from 'lucide-react';

interface ProposalAttachment {
  name: string;
  hash: string;
  size?: number; // Tamaño en bytes (opcional)
  type?: string; // Tipo MIME (opcional)
}

interface ProposalAttachmentsProps {
  attachments: ProposalAttachment[];
  className?: string;
}

const ProposalAttachments: React.FC<ProposalAttachmentsProps> = ({ 
  attachments, 
  className = '' 
}) => {
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [errorStates, setErrorStates] = useState<{[key: string]: boolean}>({});

  // Función para obtener el icono apropiado según el tipo de archivo
  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const type = mimeType?.toLowerCase();

    if (type?.includes('pdf') || extension === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <FileImage className="w-5 h-5 text-green-500" />;
    }
    if (type?.includes('video') || ['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return <FileVideo className="w-5 h-5 text-purple-500" />;
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Tamaño desconocido';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Función para manejar la descarga/visualización
  const handleFileAccess = async (attachment: ProposalAttachment, action: 'view' | 'download') => {
    const key = `${attachment.hash}_${action}`;
    
    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      setErrorStates(prev => ({ ...prev, [key]: false }));

      const ipfsUrl = `https://ipfs.io/ipfs/${attachment.hash}`;
      
      if (action === 'view') {
        // Abrir en nueva pestaña
        window.open(ipfsUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Descargar archivo
        const response = await fetch(ipfsUrl);
        if (!response.ok) throw new Error('Error al acceder al archivo');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error(`Error al ${action === 'view' ? 'visualizar' : 'descargar'} archivo:`, error);
      setErrorStates(prev => ({ ...prev, [key]: true }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  // Si no hay adjuntos, mostrar estado vacío
  if (!attachments || attachments.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center ${className}`}>
        <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Sin documentos adjuntos</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Documentos Adjuntos ({attachments.length})
        </h3>
      </div>

      <div className="space-y-2">
        {attachments.map((attachment, index) => {
          const viewKey = `${attachment.hash}_view`;
          const downloadKey = `${attachment.hash}_download`;
          const hasViewError = errorStates[viewKey];
          const hasDownloadError = errorStates[downloadKey];
          const isViewLoading = loadingStates[viewKey];
          const isDownloadLoading = loadingStates[downloadKey];

          return (
            <div
              key={`${attachment.hash}-${index}`}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              {/* Información del archivo */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(attachment.name, attachment.type)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(attachment.size)}</span>
                    {attachment.type && (
                      <>
                        <span>•</span>
                        <span className="uppercase">{attachment.type.split('/')[1] || attachment.type}</span>
                      </>
                    )}
                  </div>
                  {(hasViewError || hasDownloadError) && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-600">Error al acceder al archivo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 ml-4">
                {/* Botón Ver/Abrir */}
                <button
                  onClick={() => handleFileAccess(attachment, 'view')}
                  disabled={isViewLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Abrir archivo en nueva pestaña"
                >
                  {isViewLoading ? (
                    <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ExternalLink className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">Ver</span>
                </button>

                {/* Botón Descargar */}
                <button
                  onClick={() => handleFileAccess(attachment, 'download')}
                  disabled={isDownloadLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Descargar archivo"
                >
                  {isDownloadLoading ? (
                    <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">Descargar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional sobre IPFS */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-800 font-medium">Archivos descentralizados</p>
            <p className="text-xs text-blue-700 mt-1">
              Los documentos están almacenados en IPFS para garantizar su integridad y disponibilidad permanente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalAttachments;