import React, { useState, useEffect } from 'react';
import { 
  User, 
  Award, 
  Activity, 
  Settings, 
  Download, 
  Eye, 
  EyeOff,
  Bell,
  Clock,
  MessageSquare,
  ThumbsUp,
  Gavel,
  Trophy,
  Shield,
  Calendar,
  BarChart3
} from 'lucide-react';
import { AchievementsPanel } from '../components/gamification/AchievementsPanel';

// Mock interfaces (replace with actual types from your project)
interface UserProfile {
  id: string;
  name: string;
  did: string;
  reputationLevel: number;
  reputationScore: number;
  stats: {
    totalProposals: number;
    totalSupports: number;
    totalModerations: number;
    joinDate: string;
  };
  privacySettings: {
    hideReputation: boolean;
    allowNotifications: boolean;
  };
}

interface RecentActivity {
  id: string;
  type: 'proposal' | 'support' | 'moderation' | 'comment';
  title: string;
  timestamp: string;
  description?: string;
}

// Mock data - replace with actual API calls
const mockUserProfile: UserProfile = {
  id: '1',
  name: 'María González',
  did: 'did:shout:1234...abcd',
  reputationLevel: 5,
  reputationScore: 2450,
  stats: {
    totalProposals: 12,
    totalSupports: 89,
    totalModerations: 34,
    joinDate: '2024-01-15'
  },
  privacySettings: {
    hideReputation: false,
    allowNotifications: true
  }
};

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'proposal',
    title: 'Propuesta para mejorar transporte público',
    timestamp: '2024-06-17T10:30:00Z',
    description: 'Nueva propuesta creada y publicada'
  },
  {
    id: '2',
    type: 'support',
    title: 'Apoyo a "Espacios verdes en el centro"',
    timestamp: '2024-06-16T15:45:00Z'
  },
  {
    id: '3',
    type: 'moderation',
    title: 'Moderación completada',
    timestamp: '2024-06-15T09:20:00Z',
    description: 'Revisión de propuesta sobre educación'
  },
  {
    id: '4',
    type: 'comment',
    title: 'Comentario en "Ciclovías seguras"',
    timestamp: '2024-06-14T16:10:00Z'
  }
];

// Skeleton components for loading states
const UserSummarySkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="text-center">
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const ActivitySkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CitizenProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    hideReputation: false,
    allowNotifications: true
  });

  // Mock data loading - replace with actual API calls
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserProfile(mockUserProfile);
      setRecentActivity(mockRecentActivity);
      setPrivacySettings(mockUserProfile.privacySettings);
      setIsLoading(false);
    };

    loadProfileData();
  }, []);

  const getReputationBadge = (level: number): { color: string; icon: JSX.Element; title: string } => {
    if (level >= 10) return { color: 'bg-purple-500', icon: <Trophy className="w-4 h-4" />, title: 'Líder Ciudadano' };
    if (level >= 7) return { color: 'bg-yellow-500', icon: <Award className="w-4 h-4" />, title: 'Ciudadano Destacado' };
    if (level >= 4) return { color: 'bg-blue-500', icon: <Shield className="w-4 h-4" />, title: 'Ciudadano Activo' };
    if (level >= 2) return { color: 'bg-green-500', icon: <User className="w-4 h-4" />, title: 'Ciudadano Comprometido' };
    return { color: 'bg-gray-500', icon: <User className="w-4 h-4" />, title: 'Nuevo Ciudadano' };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'proposal': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'support': return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case 'moderation': return <Gavel className="w-5 h-5 text-purple-600" />;
      case 'comment': return <MessageSquare className="w-5 h-5 text-orange-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace menos de 1 hora';
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `hace ${diffInDays} días`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `hace ${diffInWeeks} semanas`;
  };

  const handlePrivacyToggle = (setting: 'hideReputation' | 'allowNotifications') => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    // Here you would typically make an API call to save the settings
    console.log('Privacy setting updated:', setting, !privacySettings[setting]);
  };

  const handleDownloadCertificate = () => {
    // Mock certificate download - implement actual PDF generation
    console.log('Downloading citizen certificate...');
    // In a real implementation, this would generate and download a PDF
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <UserSummarySkeleton />
              <ActivitySkeleton />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <User className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar perfil</h2>
          <p className="text-gray-600">No se pudo cargar la información del usuario.</p>
        </div>
      </div>
    );
  }

  const reputationBadge = getReputationBadge(userProfile.reputationLevel);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil Ciudadano</h1>
              <p className="mt-1 text-gray-600">
                Gestiona tu participación y visualiza tu impacto en la comunidad
              </p>
            </div>
            <button
              onClick={handleDownloadCertificate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Certificado
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 ${reputationBadge.color} rounded-full p-1.5 text-white`}>
                    {reputationBadge.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{userProfile.name}</h2>
                  <p className="text-sm text-gray-500 font-mono">{userProfile.did}</p>
                  {!privacySettings.hideReputation && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${reputationBadge.color}`}>
                        {reputationBadge.icon}
                        <span className="ml-1">{reputationBadge.title}</span>
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Nivel {userProfile.reputationLevel} • {userProfile.reputationScore} puntos
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.stats.totalProposals}</div>
                  <div className="text-xs text-gray-500">Propuestas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userProfile.stats.totalSupports}</div>
                  <div className="text-xs text-gray-500">Apoyos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{userProfile.stats.totalModerations}</div>
                  <div className="text-xs text-gray-500">Moderaciones</div>
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                Ciudadano desde {new Date(userProfile.stats.joinDate).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 text-gray-700 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Configuración Personal</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {privacySettings.hideReputation ? (
                      <EyeOff className="w-4 h-4 text-gray-500 mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-900">Reputación pública</span>
                  </div>
                  <button
                    onClick={() => handlePrivacyToggle('hideReputation')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.hideReputation ? 'bg-red-600' : 'bg-green-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.hideReputation ? 'translate-x-1' : 'translate-x-6'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-900">Notificaciones</span>
                  </div>
                  <button
                    onClick={() => handlePrivacyToggle('allowNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.allowNotifications ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.allowNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 Tus ajustes de privacidad te ayudan a controlar qué información es visible para otros ciudadanos.
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <Activity className="w-5 h-5 text-gray-700 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Ver toda la actividad
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Achievements Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <Award className="w-6 h-6 text-yellow-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-900">Mis Logros</h2>
                <div className="ml-auto flex items-center">
                  <BarChart3 className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-500">¡Has contribuido en 4 áreas diferentes!</span>
                </div>
              </div>
              
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  🎉 <strong>¡Felicidades por tu progreso!</strong> Has desbloqueado {/* mock count */}12 logros 
                  y estás demostrando un compromiso excepcional con tu comunidad. Cada acción cuenta para 
                  construir un futuro mejor juntos.
                </p>
              </div>
              
              {/* Achievements Panel Integration */}
              <AchievementsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};