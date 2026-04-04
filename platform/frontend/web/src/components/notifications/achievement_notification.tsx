import React, { useState, useEffect } from 'react';
import { X, Sparkles, Trophy } from 'lucide-react';

const AchievementNotification = ({ achievements, onDismiss }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (achievements.length > 0) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-avanzar entre logros cada 4 segundos
      const interval = setInterval(() => {
        if (currentIndex < achievements.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Último logro, auto-cerrar después de 3 segundos
          setTimeout(() => {
            handleDismiss();
          }, 3000);
        }
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [achievements, currentIndex]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!isVisible || achievements.length === 0) {
    return null;
  }

  const currentAchievement = achievements[currentIndex];
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'uncommon': return 'from-green-400 to-green-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'legendary': return 'from-purple-400 to-purple-600 via-pink-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityGlow = (rarity) => {
    switch (rarity) {
      case 'common': return 'shadow-gray-200';
      case 'uncommon': return 'shadow-green-200';
      case 'rare': return 'shadow-blue-200';
      case 'legendary': return 'shadow-purple-200';
      default: return 'shadow-gray-200';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleDismiss}
      />
      
      {/* Notification Modal */}
      <div 
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
                    transition-all duration-300 ${
                      isAnimating 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95'
                    }`}
      >
        <div 
          className={`bg-white rounded-2xl shadow-2xl ${getRarityGlow(currentAchievement.rarity)} 
                      max-w-md mx-auto p-8 text-center relative overflow-hidden`}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute animate-pulse opacity-20 bg-gradient-to-r ${getRarityColor(currentAchievement.rarity)} rounded-full`}
                style={{
                  width: Math.random() * 20 + 10 + 'px',
                  height: Math.random() * 20 + 10 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  animationDelay: i * 0.5 + 's',
                  animationDuration: (Math.random() * 2 + 2) + 's'
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  ¡Logro Desbloqueado!
                </h2>
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              
              {achievements.length > 1 && (
                <div className="text-sm text-gray-600">
                  {currentIndex + 1} de {achievements.length} nuevos logros
                </div>
              )}
            </div>

            {/* Achievement Icon */}
            <div className="mb-6">
              <div 
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full 
                           bg-gradient-to-r ${getRarityColor(currentAchievement.rarity)} 
                           shadow-lg transform hover:scale-105 transition-transform`}
              >
                <span className="text-4xl filter drop-shadow-sm">
                  {currentAchievement.icon}
                </span>
              </div>
            </div>

            {/* Achievement Details */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {currentAchievement.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {currentAchievement.description}
              </p>
              
              {/* Rarity badge */}
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white 
                              bg-gradient-to-r ${getRarityColor(currentAchievement.rarity)}`}>
                {currentAchievement.rarity === 'common' && 'Común'}
                {currentAchievement.rarity === 'uncommon' && 'Poco Común'}
                {currentAchievement.rarity === 'rare' && 'Raro'}
                {currentAchievement.rarity === 'legendary' && 'Legendario'}
              </div>
            </div>

            {/* Motivational Message */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-blue-900 italic">
                "{currentAchievement.motivationalMessage}"
              </p>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentIndex === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                ← Anterior
              </button>

              {/* Progress dots */}
              {achievements.length > 1 && (
                <div className="flex gap-2">
                  {achievements.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex
                          ? `bg-gradient-to-r ${getRarityColor(currentAchievement.rarity)}`
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={handleNext}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentIndex === achievements.length - 1
                    ? 'text-blue-600 hover:bg-blue-50'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                {currentIndex === achievements.length - 1 ? 'Cerrar' : 'Siguiente →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Hook para manejar notificaciones de logros
export const useAchievementNotifications = () => {
  const [pendingAchievements, setPendingAchievements] = useState([]);

  const showAchievements = (achievements) => {
    if (achievements && achievements.length > 0) {
      setPendingAchievements(achievements);
    }
  };

  const dismissNotifications = () => {
    setPendingAchievements([]);
  };

  return {
    pendingAchievements,
    showAchievements,
    dismissNotifications
  };
};

// Componente de demostración
const AchievementNotificationDemo = () => {
  const { pendingAchievements, showAchievements, dismissNotifications } = useAchievementNotifications();

  const demoAchievements = [
    {
      id: 'first_step',
      name: 'Primer Paso Ciudadano',
      description: 'Has creado tu primera propuesta. ¡Bienvenido/a a la democracia participativa!',
      icon: '🌱',
      rarity: 'common',
      motivationalMessage: 'Cada gran cambio comienza con una idea. ¡Has dado el primer paso!'
    },
    {
      id: 'active_voice',
      name: 'Voz Activa',
      description: 'Has participado en 10 votaciones. Tu opinión construye el futuro.',
      icon: '🗳️',
      rarity: 'uncommon',
      motivationalMessage: 'Tu participación activa fortalece nuestra democracia.'
    },
    {
      id: 'trusted_citizen',
      name: 'Ciudadano/a de Confianza',
      description: 'Has ganado 100 puntos de reputación positiva. La comunidad confía en ti.',
      icon: '⭐',
      rarity: 'rare',
      motivationalMessage: 'Has ganado la confianza de tu comunidad a través de tus acciones.'
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Sistema de Notificaciones de Logros
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-gray-600 mb-6">
            Haz clic en los botones para simular diferentes tipos de notificaciones de logros:
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => showAchievements([demoAchievements[0]])}
              className="w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
            >
              🌱 Mostrar Logro Común (Primer Paso)
            </button>
            
            <button
              onClick={() => showAchievements([demoAchievements[1]])}
              className="w-full px-4 py-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
            >
              🗳️ Mostrar Logro Poco Común (Voz Activa)
            </button>
            
            <button
              onClick={() => showAchievements([demoAchievements[2]])}
              className="w-full px-4 py-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors"
            >
              ⭐ Mostrar Logro Raro (Ciudadano de Confianza)
            </button>
            
            <button
              onClick={() => showAchievements(demoAchievements)}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              🎉 Mostrar Múltiples Logros (3 logros)
            </button>
          </div>
        </div>
      </div>

      {/* Notification Component */}
      <AchievementNotification
        achievements={pendingAchievements}
        onDismiss={dismissNotifications}
      />
    </div>
  );
};

export default AchievementNotificationDemo;