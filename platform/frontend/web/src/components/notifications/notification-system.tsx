import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Users, FileText, Clock, Eye } from 'lucide-react';

// Tipos de datos
interface Notification {
  id: string;
  type: "proposal_created" | "moderation_changed" | "alert" | "trust_gained";
  message: string;
  timestamp: string;
  proposalId?: string;
  read: boolean;
  priority: "low" | "medium" | "high";
}

// Hook personalizado para el servicio de notificaciones
const useNotificationService = (userDID: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulación de datos del backend
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "proposal_created",
      message: "Nueva propuesta 'Mejoras en el Parque Central' creada en tu municipio",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      proposalId: "prop-123",
      read: false,
      priority: "medium"
    },
    {
      id: "2",
      type: "moderation_changed",
      message: "Tu propuesta 'Ciclovías Seguras' ha sido validada por la comunidad",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      proposalId: "prop-456",
      read: false,
      priority: "high"
    },
    {
      id: "3",
      type: "trust_gained",
      message: "La propuesta 'Biblioteca Digital' ha ganado confianza colectiva",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      proposalId: "prop-789",
      read: true,
      priority: "medium"
    },
    {
      id: "4",
      type: "alert",
      message: "Propuesta 'Zona Verde Norte' ha recibido múltiples reportes",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      proposalId: "prop-101",
      read: true,
      priority: "high"
    }
  ];

  // Simulación de llamada al API
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // En un caso real: const response = await fetch(`/api/notifications?did=${userDID}`);
      setNotifications(mockNotifications);
    } catch (err) {
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificaciones como leídas
  const markAsRead = async (notificationIds: string[]) => {
    try {
      // En un caso real: await fetch('/api/notifications/seen', { method: 'POST', body: JSON.stringify({ ids: notificationIds }) });
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      setError('Error al marcar como leída');
    }
  };

  // Polling cada 30 segundos (en producción podría ser WebSocket)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userDID]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    refetch: fetchNotifications
  };
};

// Componente NotificationPanel
const NotificationPanel: React.FC<{
  notifications: Notification[];
  onMarkAsRead: (ids: string[]) => void;
  onClose: () => void;
}> = ({ notifications, onMarkAsRead, onClose }) => {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'proposal_created':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'moderation_changed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'trust_gained':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `hace ${Math.floor(diffInMinutes / 60)} h`;
    } else {
      return `hace ${Math.floor(diffInMinutes / 1440)} días`;
    }
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      onMarkAsRead(unreadIds);
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Notificaciones
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Marcar todas como leídas
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${
                    !notification.read 
                      ? 'font-medium text-gray-900 dark:text-white' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(notification.timestamp)}
                    </span>
                    {notification.proposalId && (
                      <button
                        onClick={() => {
                          if (!notification.read) {
                            onMarkAsRead([notification.id]);
                          }
                          // Aquí navegaríamos a la propuesta
                          console.log('Navegando a propuesta:', notification.proposalId);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
        <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  );
};

// Componente NotificationBell
const NotificationBell: React.FC<{
  unreadCount: number;
  onClick: () => void;
  hasNewNotification?: boolean;
}> = ({ unreadCount, onClick, hasNewNotification }) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-all duration-200 ${
        hasNewNotification ? 'animate-pulse' : ''
      }`}
      title="Notificaciones"
    >
      <Bell className={`w-5 h-5 ${hasNewNotification ? 'animate-bounce' : ''}`} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// Componente principal del sistema
const NotificationSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Simular DID del usuario autenticado
  const userDID = "did:example:user123";
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead
  } = useNotificationService(userDID);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Detectar nuevas notificaciones
  useEffect(() => {
    if (unreadCount > 0 && !hasNewNotification) {
      setHasNewNotification(true);
      const timer = setTimeout(() => setHasNewNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, hasNewNotification]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    setHasNewNotification(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Barra superior simulada */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🗣️ Shout Aloud
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Democracia Antifrágil
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Usuario: {userDID.slice(0, 20)}...
            </span>
            <NotificationBell
              unreadCount={unreadCount}
              onClick={handleBellClick}
              hasNewNotification={hasNewNotification}
            />
          </div>
        </div>
      </div>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="fixed top-16 right-4">
          {loading ? (
            <div className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ) : error ? (
            <div className="w-80 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg shadow-lg p-4">
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            </div>
          ) : (
            <NotificationPanel
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      )}

      {/* Contenido principal simulado */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔔 Sistema de Notificaciones Ciudadanas
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Mantente informado en tiempo real sobre los cambios en las propuestas, 
            nuevas iniciativas ciudadanas y actualizaciones del proceso democrático.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <FileText className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Nuevas Propuestas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Alertas cuando se crean propuestas en tu municipio
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Cambios de Estado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Notificaciones sobre validaciones y moderación
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <Users className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Confianza Colectiva
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Cuando las propuestas ganan apoyo ciudadano
              </p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Alertas de Seguridad
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Reportes múltiples y situaciones que requieren atención
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🔐 Características de Seguridad
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>✅ Solo para tu DID autenticado</li>
              <li>✅ Identidad de moderadores protegida</li>
              <li>✅ Configuración personalizable</li>
              <li>✅ Historial encriptado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;