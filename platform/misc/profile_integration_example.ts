// platform/frontend-mobile/web/src/components/profile/CitizenProfileActions.tsx

import React, { useState } from 'react';
import { Share2, Eye, Settings } from 'lucide-react';
import { CertificateDownloadButton, CertificatePreview } from '../certificates/CertificateDownloadButton';
import { 
  UserData, 
  ReputationData, 
  AchievementData, 
  CertificateStats 
} from '../../utils/certificates/generateCitizenCertificate';

interface CitizenProfileActionsProps {
  userData: UserData;
  reputation: ReputationData;
  achievements: AchievementData[];
  stats: CertificateStats;
}

export const CitizenProfileActions: React.FC<CitizenProfileActionsProps> = ({
  userData,
  reputation,
  achievements,
  stats
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleCertificateDownload = () => {
    // Mostrar animación celebratoria
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🏅 Certificación Ciudadana
      </h3>
      
      <p className="text-gray-600 text-sm mb-6">
        Obtén un certificado oficial de tu participación en nuestra plataforma 
        de democracia digital. Perfecto para demostrar tu compromiso cívico.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Botón principal de descarga */}
        <div className="md:col-span-2">
          <CertificateDownloadButton
            userData={userData}
            reputation={reputation}
            achievements={achievements}
            stats={stats}
            variant="primary"
            className="w-full"
            onDownload={handleCertificateDownload}
          />
        </div>

        {/* Botón de vista previa */}
        <button
          onClick={() => setShowPreview(true)}
          className="inline-flex items-center justify-center px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4 mr-2" />
          Vista Previa
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3 mt-1">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tu certificado incluirá:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Tu nivel de reputación actual: <strong>{reputation.title}</strong></li>
              <li>Logros destacados ({achievements.length} disponibles)</li>
              <li>Estadísticas de participación verificables</li>
              {userData.publicProfile && (
                <li>Código QR para verificación digital</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Animación celebratoria */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-6 shadow-xl animate-bounce">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-green-800 font-semibold">
                ¡Certificado descargado!
              </p>
              <p className="text-green-600 text-sm">
                Gracias por tu participación cívica
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa modal */}
      {showPreview && (
        <CertificatePreview
          userData={userData}
          reputation={reputation}
          achievements={achievements}
          stats={stats}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

// Ejemplo de uso completo en CitizenProfilePage
export const CitizenProfilePageExample: React.FC = () => {
  // Datos de ejemplo (en la implementación real vendrían de props o context)
  const mockUserData: UserData = {
    id: 'user-123',
    name: 'María González',
    did: 'did:ethr:0x1234567890123456789012345678901234567890',
    registrationDate: new Date('2024-01-15'),
    location: {
      city: 'Barcelona',
      country: 'España'
    },
    publicProfile: true
  };

  const mockReputation: ReputationData = {
    level: 3,
    score: 1250,
    title: 'Constructor Cívico',
    badge: '🏗️',
    color: '#10b981'
  };

  const mockAchievements: AchievementData[] = [
    {
      id: 'achievement-1',
      title: 'Primera Propuesta',
      description: 'Creaste tu primera propuesta ciudadana',
      icon: '📝',
      dateEarned: new Date('2024-02-01'),
      category: 'Participación'
    },
    {
      id: 'achievement-2',
      title: 'Validador Confiable',
      description: 'Completaste 50 validaciones con alta precisión',
      icon: '✅',
      dateEarned: new Date('2024-03-15'),
      category: 'Validación'
    },
    {
      id: 'achievement-3',
      title: 'Mediador Comunitario',
      description: 'Resolviste 10 disputas de manera efectiva',
      icon: '⚖️',
      dateEarned: new Date('2024-04-20'),
      category: 'Moderación'
    }
  ];

  const mockStats: CertificateStats = {
    proposalsCreated: 8,
    validationsCompleted: 67,
    moderationsPerformed: 12,
    communityContributions: 87
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header del perfil */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {mockUserData.name || 'Ciudadano Digital'}
            </h1>
            <p className="text-blue-100">
              {mockReputation.badge} {mockReputation.title} • {mockReputation.score} puntos
            </p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl mb-2">
              {mockReputation.level}
            </div>
            <p className="text-sm text-blue-100">Nivel de Reputación</p>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-blue-600">{mockStats.proposalsCreated}</div>
          <div className="text-sm text-gray-600">Propuestas</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{mockStats.validationsCompleted}</div>
          <div className="text-sm text-gray-600">Validaciones</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-purple-600">{mockStats.moderationsPerformed}</div>
          <div className="text-sm text-gray-600">Moderaciones</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-orange-600">{mockStats.communityContributions}</div>
          <div className="text-sm text-gray-600">Contribuciones</div>
        </div>
      </div>

      {/* Logros recientes */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Logros Recientes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockAchievements.map((achievement) => (
            <div 
              key={achievement.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">{achievement.icon}</div>
              <h4 className="font-medium text-gray-900 mb-1">{achievement.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
              <p className="text-xs text-gray-500">
                {achievement.dateEarned.toLocaleDateString('es-ES')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Componente de certificación */}
      <CitizenProfileActions
        userData={mockUserData}
        reputation={mockReputation}
        achievements={mockAchievements}
        stats={mockStats}
      />

      {/* Configuración de privacidad */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔒 Configuración de Privacidad
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Perfil Público</p>
              <p className="text-sm text-gray-600">
                Permite verificación externa de tu certificado
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                defaultChecked={mockUserData.publicProfile}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};