// platform/frontend-mobile/web/src/components/certificates/CertificateDownloadButton.tsx

import React, { useState } from 'react';
import { Download, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  generateCitizenCertificate, 
  downloadCertificate,
  UserData,
  ReputationData,
  AchievementData,
  CertificateStats
} from '../../utils/certificates/generateCitizenCertificate';

interface CertificateDownloadButtonProps {
  userData: UserData;
  reputation: ReputationData;
  achievements: AchievementData[];
  stats: CertificateStats;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  showPreview?: boolean;
}

export const CertificateDownloadButton: React.FC<CertificateDownloadButtonProps> = ({
  userData,
  reputation,
  achievements,
  stats,
  className = '',
  variant = 'primary',
  showPreview = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDownload = async () => {
    if (!userData.publicProfile && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await downloadCertificate(userData, reputation, achievements, stats);
      
      // Mostrar animación de éxito
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Cerrar dialog si estaba abierto
      setShowConfirmDialog(false);
    } catch (err) {
      console.error('Error generando certificado:', err);
      setError('No se pudo generar el certificado. Inténtalo nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = `
      inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium 
      transition-all duration-200 transform hover:scale-105 focus:ring-2 
      focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
      disabled:transform-none
    `;

    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
      case 'secondary':
        return `${baseStyles} bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500`;
      case 'outline':
        return `${baseStyles} border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500`;
      default:
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
    }
  };

  if (showSuccess) {
    return (
      <div className={`${getButtonStyles()} bg-green-600 hover:bg-green-600 ${className}`}>
        <CheckCircle className="w-4 h-4 mr-2" />
        <span>¡Descargado!</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={`${getButtonStyles()} ${className}`}
        title="Descargar certificado de participación cívica"
      >
        {isGenerating ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            <span>Generando...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            <span>📄 Descargar Certificado</span>
          </>
        )}
      </button>

      {/* Dialog de confirmación para perfiles privados */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Certificado con Perfil Privado
                </h3>
                <p className="text-gray-600 text-sm">
                  Tu perfil está configurado como privado. El certificado incluirá solo 
                  tu información básica sin código QR de verificación pública.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Puedes habilitar el perfil público en configuración para incluir 
                  verificación digital.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}
    </>
  );
};

// Componente de vista previa del certificado
export const CertificatePreview: React.FC<{
  userData: UserData;
  reputation: ReputationData;
  achievements: AchievementData[];
  stats: CertificateStats;
  onClose: () => void;
}> = ({ userData, reputation, achievements, stats, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsLoading(true);
        const blob = await generateCitizenCertificate(userData, reputation, achievements, stats);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        console.error('Error generando vista previa:', err);
        setError('No se pudo generar la vista previa');
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [userData, reputation, achievements, stats]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Vista Previa del Certificado
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            ✕
          </button>
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Generando vista previa...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96 text-red-600">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>{error}</span>
            </div>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-96 border rounded-lg"
              title="Vista previa del certificado"
            />
          ) : null}
        </div>
        
        <div className="flex justify-end p-4 border-t space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cerrar
          </button>
          <CertificateDownloadButton
            userData={userData}
            reputation={reputation}
            achievements={achievements}
            stats={stats}
            variant="primary"
            className="ml-3"
          />
        </div>
      </div>
    </div>
  );
};