import React, { useState, useEffect } from 'react';
import { Trophy, Award, Users, Heart, Filter, Eye, EyeOff, Calendar } from 'lucide-react';

// Interfaces para el sistema de gamificación
interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: Date;
  category: 'participation' | 'moderation' | 'impact' | 'community';
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  motivationalMessage?: string;
}

interface UserGamificationStats {
  totalAchievements: number;
  unlockedAchievements: number;
  categories: Record<Achievement['category'], { unlocked: number; total: number }>;
}

// Componente Skeleton para estados de carga
const AchievementSkeleton = () => (
  <div className="bg-white rounded-lg border p-4 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  </div>
);

// Componente individual de logro
const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'silver': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'platinum': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'participation': return <Trophy className="w-4 h-4" />;
      case 'moderation': return <Users className="w-4 h-4" />;
      case 'impact': return <Award className="w-4 h-4" />;
      case 'community': return <Heart className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  const progressPercentage = achievement.maxProgress > 0 
    ? Math.round((achievement.progress / achievement.maxProgress) * 100) 
    : 0;

  return (
    <div 
      className={`relative bg-white rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
        achievement.isUnlocked 
          ? getDifficultyColor(achievement.difficulty)
          : 'border-gray-200 bg-gray-50'
      }`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="listitem"
      aria-label={`${achievement.name}: ${achievement.description}`}
      tabIndex={0}
    >
      {/* Ícono principal del logro */}
      <div className="flex items-start justify-between mb-3">
        <div className={`text-3xl ${achievement.isUnlocked ? '' : 'grayscale opacity-40'}`}>
          {achievement.icon}
        </div>
        <div className="flex items-center space-x-1">
          {getCategoryIcon(achievement.category)}
          {achievement.isUnlocked && (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </div>
      </div>

      {/* Información del logro */}
      <div>
        <h3 className={`font-semibold text-sm mb-1 ${
          achievement.isUnlocked ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {achievement.name}
        </h3>
        <p className={`text-xs mb-2 ${
          achievement.isUnlocked ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {achievement.description}
        </p>

        {/* Barra de progreso */}
        {!achievement.isUnlocked && achievement.maxProgress > 0 && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Progreso</span>
              <span className="text-xs text-gray-500">
                {achievement.progress}/{achievement.maxProgress}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Fecha de desbloqueo */}
        {achievement.isUnlocked && achievement.unlockedAt && (
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <Calendar className="w-3 h-3 mr-1" />
            Desbloqueado el {achievement.unlockedAt.toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Tooltip con información adicional */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs">
          <div className="font-medium mb-1">{achievement.name}</div>
          <div className="mb-2">{achievement.description}</div>
          {achievement.motivationalMessage && (
            <div className="text-blue-200 italic">
              "{achievement.motivationalMessage}"
            </div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Hook simulado para obtener datos de gamificación
const useGamificationService = (userDid: string) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserGamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulación de carga de datos
    const loadAchievements = async () => {
      setLoading(true);
      
      // Datos mock - En producción vendría del GamificationEngine
      const mockAchievements: Achievement[] = [
        {
          id: 'first-step',
          name: 'Primer Paso',
          icon: '🧩',
          description: 'Has creado tu primera propuesta ciudadana',
          category: 'participation',
          isUnlocked: true,
          progress: 1,
          maxProgress: 1,
          difficulty: 'bronze',
          unlockedAt: new Date('2025-06-01'),
          motivationalMessage: '¡Bienvenido a la democracia participativa!'
        },
        {
          id: 'active-voice',
          name: 'Voz Activa',
          icon: '🗳️',
          description: 'Has participado en 5 votaciones',
          category: 'participation',
          isUnlocked: true,
          progress: 5,
          maxProgress: 5,
          difficulty: 'bronze',
          unlockedAt: new Date('2025-06-10')
        },
        {
          id: 'engaged-citizen',
          name: 'Ciudadano Comprometido',
          icon: '🔥',
          description: 'Has participado en 10 votaciones',
          category: 'participation',
          isUnlocked: false,
          progress: 7,
          maxProgress: 10,
          difficulty: 'silver'
        },
        {
          id: 'initial-moderator',
          name: 'Moderador Inicial',
          icon: '🤝',
          description: 'Has validado o reportado 3 propuestas',
          category: 'moderation',
          isUnlocked: true,
          progress: 3,
          maxProgress: 3,
          difficulty: 'bronze',
          unlockedAt: new Date('2025-06-15')
        },
        {
          id: 'system-defender',
          name: 'Defensor del Sistema',
          icon: '🛡️',
          description: 'Has reportado exitosamente 5 propuestas problemáticas',
          category: 'moderation',
          isUnlocked: false,
          progress: 2,
          maxProgress: 5,
          difficulty: 'silver'
        },
        {
          id: 'symbolic-constituent',
          name: 'Constituyente Simbólico',
          icon: '📜',
          description: 'Has validado 1 propuesta con alto impacto',
          category: 'impact',
          isUnlocked: false,
          progress: 0,
          maxProgress: 1,
          difficulty: 'bronze'
        },
        {
          id: 'helpful-neighbor',
          name: 'Vecino Solidario',
          icon: '🤲',
          description: 'Has ayudado a otros ciudadanos 5 veces',
          category: 'community',
          isUnlocked: true,
          progress: 5,
          maxProgress: 5,
          difficulty: 'bronze',
          unlockedAt: new Date('2025-06-12')
        }
      ];

      const mockStats: UserGamificationStats = {
        totalAchievements: 7,
        unlockedAchievements: 4,
        categories: {
          participation: { unlocked: 2, total: 3 },
          moderation: { unlocked: 1, total: 2 },
          impact: { unlocked: 0, total: 1 },
          community: { unlocked: 1, total: 1 }
        }
      };

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAchievements(mockAchievements);
      setStats(mockStats);
      setLoading(false);
    };

    loadAchievements();
  }, [userDid]);

  return { achievements, stats, loading };
};

// Componente principal
interface AchievementsPanelProps {
  userDid: string;
  visible?: boolean;
  className?: string;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ 
  userDid, 
  visible = true, 
  className = '' 
}) => {
  const { achievements, stats, loading } = useGamificationService(userDid);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'progress'>('all');
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!visible) return null;

  const categoryNames = {
    participation: 'Participación',
    moderation: 'Moderación',
    impact: 'Impacto',
    community: 'Comunidad'
  };

  const categoryIcons = {
    participation: <Trophy className="w-5 h-5" />,
    moderation: <Users className="w-5 h-5" />,
    impact: <Award className="w-5 h-5" />,
    community: <Heart className="w-5 h-5" />
  };

  const getFilteredAchievements = () => {
    switch (filter) {
      case 'unlocked':
        return achievements.filter(a => a.isUnlocked);
      case 'progress':
        return achievements.filter(a => !a.isUnlocked && a.progress > 0);
      default:
        return achievements;
    }
  };

  const groupedAchievements = getFilteredAchievements().reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<Achievement['category'], Achievement[]>);

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <AchievementSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-xl p-6 ${className}`} role="region" aria-label="Panel de logros ciudadanos">
      {/* Header con estadísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            🏆 Tus Logros Ciudadanos
          </h2>
          {stats && (
            <p className="text-sm text-gray-600">
              Has desbloqueado <span className="font-semibold text-blue-600">
                {stats.unlockedAchievements}
              </span> de {stats.totalAchievements} logros disponibles
            </p>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowPrivacy(!showPrivacy)}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
            aria-label="Alternar configuración de privacidad"
          >
            {showPrivacy ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>Privacidad</span>
          </button>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
            aria-label="Filtrar logros"
          >
            <option value="all">Todos los logros</option>
            <option value="unlocked">Solo desbloqueados</option>
            <option value="progress">En progreso</option>
          </select>
        </div>
      </div>

      {/* Barra de progreso general */}
      {stats && (
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso General</span>
            <span className="text-sm text-gray-500">
              {Math.round((stats.unlockedAchievements / stats.totalAchievements) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${(stats.unlockedAchievements / stats.totalAchievements) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Logros por categoría */}
      <div className="space-y-6">
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
          <div key={category}>
            <div className="flex items-center space-x-2 mb-4">
              {categoryIcons[category as Achievement['category']]}
              <h3 className="text-lg font-semibold text-gray-800">
                {categoryNames[category as Achievement['category']]}
              </h3>
              {stats && (
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {stats.categories[category as Achievement['category']].unlocked}/
                  {stats.categories[category as Achievement['category']].total}
                </span>
              )}
            </div>
            
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              role="list"
              aria-label={`Logros de ${categoryNames[category as Achievement['category']]}`}
            >
              {categoryAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje motivacional */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🌟</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              ¡Sigue construyendo democracia!
            </h4>
            <p className="text-sm text-blue-700">
              Cada logro refleja tu compromiso con la participación ciudadana. 
              Tu contribución hace la diferencia en la construcción de una sociedad más justa.
            </p>
          </div>
        </div>
      </div>

      {/* Panel de privacidad */}
      {showPrivacy && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-900 mb-2">🔒 Control de Privacidad</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Tus logros son privados por defecto. Solo tú puedes verlos.
          </p>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-yellow-700">
              Permitir que otros ciudadanos vean mis logros públicamente
            </span>
          </label>
        </div>
      )}
    </div>
  );
};

export default AchievementsPanel;