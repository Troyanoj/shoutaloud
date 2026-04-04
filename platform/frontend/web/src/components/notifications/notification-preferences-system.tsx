import React, { useState, useEffect } from 'react';
import { Bell, Settings, Clock, Mail, Smartphone, Globe, Shield, RefreshCw, Check, X, Info, Eye, Volume2, VolumeX } from 'lucide-react';

// Hook para manejar las preferencias de notificación
const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    types: {
      newProposals: true,
      moderationChanges: true,
      criticalReports: true,
      trustedProposals: true,
      communityUpdates: false,
      systemAnnouncements: true
    },
    frequency: 'realtime', // 'realtime', 'hourly', 'daily'
    modality: {
      visualPanel: true,
      toastNotifications: false,
      emailSummary: false
    },
    doNotDisturb: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    municipality: 'all' // 'all' o código específico
  });

  const [isLoading, setIsLoading] = useState(false);

  // Cargar preferencias al inicializar
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('shout_aloud_notification_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error);
    }
  };

  const updatePreferences = async (newPrefs) => {
    setIsLoading(true);
    try {
      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);
      localStorage.setItem('shout_aloud_notification_prefs', JSON.stringify(updated));
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    } catch (error) {
      console.error('Error guardando preferencias:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPreferences = async () => {
    setIsLoading(true);
    try {
      const defaultPrefs = {
        types: {
          newProposals: true,
          moderationChanges: true,
          criticalReports: true,
          trustedProposals: true,
          communityUpdates: false,
          systemAnnouncements: true
        },
        frequency: 'realtime',
        modality: {
          visualPanel: true,
          toastNotifications: false,
          emailSummary: false
        },
        doNotDisturb: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        },
        municipality: 'all'
      };
      
      setPreferences(defaultPrefs);
      localStorage.setItem('shout_aloud_notification_prefs', JSON.stringify(defaultPrefs));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const getPreferences = () => preferences;

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    getPreferences,
    isLoading
  };
};

// Componente principal del panel de configuración
const NotificationSettingsPanel = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences, resetPreferences, isLoading } = useNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  useEffect(() => {
    const changed = JSON.stringify(localPrefs) !== JSON.stringify(preferences);
    setHasChanges(changed);
  }, [localPrefs, preferences]);

  const handleTypeChange = (type, enabled) => {
    setLocalPrefs(prev => ({
      ...prev,
      types: { ...prev.types, [type]: enabled }
    }));
  };

  const handleFrequencyChange = (frequency) => {
    setLocalPrefs(prev => ({ ...prev, frequency }));
  };

  const handleModalityChange = (modality, enabled) => {
    setLocalPrefs(prev => ({
      ...prev,
      modality: { ...prev.modality, [modality]: enabled }
    }));
  };

  const handleDoNotDisturbChange = (field, value) => {
    setLocalPrefs(prev => ({
      ...prev,
      doNotDisturb: { ...prev.doNotDisturb, [field]: value }
    }));
  };

  const handleSave = async () => {
    const result = await updatePreferences(localPrefs);
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleReset = async () => {
    const result = await resetPreferences();
    if (result.success) {
      setSaveStatus('reset');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const notificationTypes = [
    {
      key: 'newProposals',
      title: 'Nuevas Propuestas',
      description: 'Cuando se publican propuestas en tu municipio',
      icon: Globe,
      example: 'Nueva propuesta: "Parque canino en el centro"'
    },
    {
      key: 'moderationChanges',
      title: 'Cambios de Moderación',
      description: 'Estados de validación y moderación de propuestas',
      icon: Shield,
      example: 'Tu propuesta ha sido validada y publicada'
    },
    {
      key: 'criticalReports',
      title: 'Reportes Críticos',
      description: 'Alertas comunitarias importantes',
      icon: Bell,
      example: 'Reporte urgente sobre seguridad ciudadana'
    },
    {
      key: 'trustedProposals',
      title: 'Propuestas de Confianza',
      description: 'Propuestas que han ganado alta credibilidad',
      icon: Check,
      example: 'Propuesta verificada alcanzó 100 votos de confianza'
    },
    {
      key: 'communityUpdates',
      title: 'Actualizaciones Comunitarias',
      description: 'Noticias generales de la comunidad',
      icon: Smartphone,
      example: 'Resumen semanal de actividad ciudadana'
    },
    {
      key: 'systemAnnouncements',
      title: 'Anuncios del Sistema',
      description: 'Mejoras y actualizaciones de la plataforma',
      icon: Settings,
      example: 'Nueva funcionalidad disponible: Votación anónima'
    }
  ];

  const frequencies = [
    { value: 'realtime', label: 'Tiempo Real', description: 'Notificaciones inmediatas', icon: Bell },
    { value: 'hourly', label: 'Cada Hora', description: 'Resumen cada 60 minutos', icon: Clock },
    { value: 'daily', label: 'Resumen Diario', description: 'Un email al día con todo', icon: Mail }
  ];

  const modalities = [
    {
      key: 'visualPanel',
      title: 'Panel Visual',
      description: 'Notificaciones en la interfaz principal',
      icon: Eye
    },
    {
      key: 'toastNotifications',
      title: 'Alertas Emergentes',
      description: 'Pop-ups temporales en pantalla',
      icon: Volume2
    },
    {
      key: 'emailSummary',
      title: 'Resumen por Email',
      description: 'Correos periódicos con actualizaciones',
      icon: Mail
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Preferencias de Notificación</h2>
                <p className="text-blue-100">Personaliza tu experiencia de participación ciudadana</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`p-2 rounded-lg transition-all ${previewMode ? 'bg-white text-blue-600' : 'bg-blue-500 hover:bg-blue-400'}`}
                title="Vista Previa"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tipos de Notificación */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Bell className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Tipos de Notificación</h3>
              </div>

              <div className="space-y-4">
                {notificationTypes.map((type) => {
                  const IconComponent = type.icon;
                  const isEnabled = localPrefs.types[type.key];
                  
                  return (
                    <div key={type.key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <IconComponent className={`w-5 h-5 mt-1 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-800">{type.title}</h4>
                              {previewMode && isEnabled && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Activo</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                            {previewMode && isEnabled && (
                              <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-700">
                                <strong>Ejemplo:</strong> {type.example}
                              </div>
                            )}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleTypeChange(type.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Configuración Avanzada */}
            <div className="space-y-6">
              {/* Frecuencia */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-800">Frecuencia</h3>
                </div>

                <div className="space-y-3">
                  {frequencies.map((freq) => {
                    const IconComponent = freq.icon;
                    return (
                      <label key={freq.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name="frequency"
                          value={freq.value}
                          checked={localPrefs.frequency === freq.value}
                          onChange={() => handleFrequencyChange(freq.value)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <IconComponent className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-medium text-gray-800">{freq.label}</div>
                          <div className="text-sm text-gray-600">{freq.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modalidades */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Smartphone className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-800">Modalidades</h3>
                </div>

                <div className="space-y-3">
                  {modalities.map((modality) => {
                    const IconComponent = modality.icon;
                    const isEnabled = localPrefs.modality[modality.key];
                    
                    return (
                      <div key={modality.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-all">
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`w-5 h-5 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                          <div>
                            <div className="font-medium text-gray-800">{modality.title}</div>
                            <div className="text-sm text-gray-600">{modality.description}</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleModalityChange(modality.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* No Molestar */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <VolumeX className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-semibold text-gray-800">No Molestar</h3>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-gray-800">Activar modo silencioso</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPrefs.doNotDisturb.enabled}
                        onChange={(e) => handleDoNotDisturbChange('enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  {localPrefs.doNotDisturb.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input
                          type="time"
                          value={localPrefs.doNotDisturb.startTime}
                          onChange={(e) => handleDoNotDisturbChange('startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input
                          type="time"
                          value={localPrefs.doNotDisturb.endTime}
                          onChange={(e) => handleDoNotDisturbChange('endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información de Privacidad */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 mt-1" />
              <div className="text-sm text-blue-800">
                <strong>Privacidad y Control:</strong> Tus preferencias se almacenan localmente en tu dispositivo. 
                Tienes control total sobre qué notificaciones recibir y cuándo. Esta configuración no se comparte 
                con terceros y puedes modificarla en cualquier momento.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Restaurar por Defecto
              </button>
              
              {saveStatus && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  saveStatus === 'success' ? 'bg-green-100 text-green-700' :
                  saveStatus === 'reset' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <Check className="w-4 h-4" />
                  <span>
                    {saveStatus === 'success' ? 'Preferencias guardadas' :
                     saveStatus === 'reset' ? 'Configuración restaurada' :
                     'Error al guardar'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardar Preferencias</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de demostración completo
const NotificationPreferencesDemo = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { preferences } = useNotificationPreferences();

  const getActiveTypesCount = () => {
    return Object.values(preferences.types).filter(Boolean).length;
  };

  const getFrequencyLabel = () => {
    switch (preferences.frequency) {
      case 'realtime': return 'Tiempo Real';
      case 'hourly': return 'Cada Hora';
      case 'daily': return 'Diario';
      default: return 'Tiempo Real';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔔 Sistema de Preferencias de Notificación
          </h1>
          <p className="text-gray-600">
            Control total sobre tu experiencia de participación ciudadana en Shout Aloud
          </p>
        </div>

        {/* Current Settings Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Configuración Actual</h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">
                    {getActiveTypesCount()} tipos de notificación activos
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">
                    Frecuencia: {getFrequencyLabel()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">
                    Modo No Molestar: {preferences.doNotDisturb.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center space-x-2"
            >
              <Settings className="w-5 h-5" />
              <span>Configurar Notificaciones</span>
            </button>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Control Granular</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Elige exactamente qué tipos de notificaciones deseas recibir para cada categoría de actividad ciudadana.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Frecuencia Ajustable</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Configura si prefieres notificaciones inmediatas, resúmenes por hora o un digest diario.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-800">Privacidad Total</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Tus preferencias se almacenan localmente. Control completo sin compartir datos personales.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Smartphone className="w-6 h-6 text-orange-600" />
              <h3 className="font-semibold text-gray-800">Múltiples Canales</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Panel visual, alertas emergentes y futuros resúmenes por email según tus preferencias.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <VolumeX className="w-6 h-6 text-red-600" />
              <h3 className="font-semibold text-gray-800">No Molestar</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Configura horarios de silencio para respetar tu tiempo personal y descanso.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="w-6 h-6 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Vista Previa</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Ve ejemplos de cada tipo de notificación antes de activarlas para tomar decisiones informadas.
            </p>
          </div>
        </div>

        {/* Ethics Notice */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">🌍 Compromiso Ético con la Participación Consciente</h3>
              <p className="text-blue-700 text-sm leading-relaxed">
                Creemos que la participación ciudadana debe ser <strong>consciente y voluntaria</strong>. 
                Por eso te damos control total sobre cómo y cuándo recibir información. 
                Tu autonomía digital es fundamental para una democracia participativa saludable.
                No hay algoritmos ocultos ni manipulación - solo transparencia y respeto por tus decisiones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configuración */}
      <NotificationSettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};

export default NotificationPreferencesDemo;