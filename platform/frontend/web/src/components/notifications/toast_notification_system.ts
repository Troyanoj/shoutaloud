// types/toast.ts
export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  icon?: string;
  onClick?: () => void;
  dismissible?: boolean;
  createdAt: Date;
}

export interface ToastOptions {
  duration?: number;
  icon?: string;
  onClick?: () => void;
  dismissible?: boolean;
}

// contexts/ToastNotificationProvider.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { ToastNotification, ToastOptions } from '../types/toast';

interface ToastContextType {
  toasts: ToastNotification[];
  showToast: (message: string, type: ToastNotification['type'], options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastNotificationProvider');
  }
  return context;
};

const getToastIcon = (type: ToastNotification['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return AlertCircle;
    case 'info':
    default:
      return Info;
  }
};

const getToastStyles = (type: ToastNotification['type']) => {
  const baseStyles = 'border-l-4 shadow-lg backdrop-blur-sm';
  
  switch (type) {
    case 'success':
      return `${baseStyles} bg-green-50/95 border-green-400 text-green-800`;
    case 'warning':
      return `${baseStyles} bg-yellow-50/95 border-yellow-400 text-yellow-800`;
    case 'error':
      return `${baseStyles} bg-red-50/95 border-red-400 text-red-800`;
    case 'info':
    default:
      return `${baseStyles} bg-blue-50/95 border-blue-400 text-blue-800`;
  }
};

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const IconComponent = getToastIcon(toast.type);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const decrement = 100 / (toast.duration! / 100);
          const newProgress = prev - decrement;
          
          if (newProgress <= 0) {
            setIsExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
            return 0;
          }
          
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration, toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick();
      handleDismiss();
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isExiting 
          ? 'translate-x-full opacity-0 scale-95' 
          : 'translate-x-0 opacity-100 scale-100'
        }
      `}
    >
      <div
        className={`
          relative p-4 rounded-lg max-w-sm w-full mx-auto mb-3
          ${getToastStyles(toast.type)}
          ${toast.onClick ? 'cursor-pointer hover:shadow-xl' : ''}
          transition-all duration-200
        `}
        onClick={handleClick}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className="h-5 w-5 mt-0.5" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium leading-5">
              {toast.message}
            </p>
            {toast.onClick && (
              <p className="text-xs mt-1 opacity-75">
                Haz clic para más detalles
              </p>
            )}
          </div>
          {toast.dismissible !== false && (
            <div className="ml-4 flex-shrink-0">
              <button
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Barra de progreso */}
        {toast.duration && toast.duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-current opacity-30 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface ToastNotificationProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastNotificationProvider: React.FC<ToastNotificationProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((
    message: string, 
    type: ToastNotification['type'], 
    options: ToastOptions = {}
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newToast: ToastNotification = {
      id,
      message,
      type,
      duration: options.duration ?? (type === 'error' ? 8000 : 5000),
      icon: options.icon,
      onClick: options.onClick,
      dismissible: options.dismissible ?? true,
      createdAt: new Date(),
    };

    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts];
      // Mantener solo los últimos maxToasts
      return updatedToasts.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Container de toasts */}
      <div 
        className="fixed top-4 right-4 z-50 space-y-2"
        aria-live="polite"
        aria-label="Notificaciones del sistema"
      >
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// hooks/useToastNotification.ts
import { useToastContext } from '../contexts/ToastNotificationProvider';
import { ToastOptions } from '../types/toast';

export const useToastNotification = () => {
  const { showToast, dismissToast, clearAllToasts, toasts } = useToastContext();

  const showSuccess = (message: string, options?: ToastOptions) => 
    showToast(message, 'success', options);

  const showError = (message: string, options?: ToastOptions) => 
    showToast(message, 'error', options);

  const showWarning = (message: string, options?: ToastOptions) => 
    showToast(message, 'warning', options);

  const showInfo = (message: string, options?: ToastOptions) => 
    showToast(message, 'info', options);

  return {
    // Métodos principales
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Gestión de toasts
    dismissToast,
    clearAllToasts,
    
    // Estado
    toasts,
    hasToasts: toasts.length > 0,
  };
};

// hooks/useNotificationService.ts (actualización para integrar toasts)
import { useEffect, useCallback } from 'react';
import { useToastNotification } from './useToastNotification';
import { useNotificationPreferences } from './useNotificationPreferences';

interface NotificationServiceConfig {
  did: string;
  apiEndpoint?: string;
}

export const useNotificationService = ({ did, apiEndpoint }: NotificationServiceConfig) => {
  const { preferences, isLoading: preferencesLoading } = useNotificationPreferences(did);
  const { showToast } = useToastNotification();

  // Simular llegada de nuevas notificaciones
  const processIncomingNotification = useCallback((notification: {
    type: 'proposal_update' | 'community_alert' | 'system_announcement' | 'voting_reminder';
    title: string;
    message: string;
    urgency: 'low' | 'medium' | 'high';
    municipalityId?: string;
  }) => {
    if (!preferences || preferencesLoading) return;

    // Verificar si el usuario quiere recibir este tipo de notificación
    const shouldNotify = (() => {
      switch (notification.type) {
        case 'proposal_update':
          return preferences.categories.proposals;
        case 'community_alert':
          return preferences.categories.community;
        case 'system_announcement':
          return preferences.categories.system;
        case 'voting_reminder':
          return preferences.categories.votes;
        default:
          return false;
      }
    })();

    if (!shouldNotify) return;

    // Verificar modalidades habilitadas
    if (preferences.modalities.toast) {
      const toastType = (() => {
        switch (notification.urgency) {
          case 'high':
            return 'warning' as const;
          case 'medium':
            return 'info' as const;
          case 'low':
            return 'success' as const;
          default:
            return 'info' as const;
        }
      })();

      const duration = notification.urgency === 'high' ? 8000 : 5000;

      showToast(notification.message, toastType, {
        duration,
        dismissible: true,
      });
    }

    // Aquí también se activarían otras modalidades como push, email, etc.
    if (preferences.modalities.push && 'Notification' in window) {
      // Lógica para notificaciones push del navegador
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/badge-icon.png',
        });
      }
    }
  }, [preferences, preferencesLoading, showToast]);

  // Métodos de conveniencia para disparar toasts comunes
  const notifyProposalUpdate = useCallback((message: string) => {
    processIncomingNotification({
      type: 'proposal_update',
      title: 'Actualización de Propuesta',
      message,
      urgency: 'medium',
    });
  }, [processIncomingNotification]);

  const notifyCommunityAlert = useCallback((message: string) => {
    processIncomingNotification({
      type: 'community_alert',
      title: 'Alerta Comunitaria',
      message,
      urgency: 'high',
    });
  }, [processIncomingNotification]);

  const notifySystemAnnouncement = useCallback((message: string) => {
    processIncomingNotification({
      type: 'system_announcement',
      title: 'Anuncio del Sistema',
      message,
      urgency: 'low',
    });
  }, [processIncomingNotification]);

  return {
    // Procesamiento general
    processIncomingNotification,
    
    // Métodos específicos
    notifyProposalUpdate,
    notifyCommunityAlert,
    notifySystemAnnouncement,
    
    // Estado
    isServiceReady: !preferencesLoading && !!preferences,
    preferences,
  };
};

// Ejemplo de integración en ProposalDetailPage.tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToastNotification } from '../hooks/useToastNotification';
import { useNotificationService } from '../hooks/useNotificationService';

interface ProposalDetailPageProps {
  userDID: string;
}

export const ProposalDetailPage: React.FC<ProposalDetailPageProps> = ({ userDID }) => {
  const { proposalId } = useParams();
  const { showSuccess, showWarning, showInfo } = useToastNotification();
  const { notifyProposalUpdate } = useNotificationService({ did: userDID });

  // Simular actualización de estado de propuesta
  useEffect(() => {
    const simulateProposalUpdate = () => {
      // Esto normalmente vendría de WebSocket o polling
      setTimeout(() => {
        notifyProposalUpdate("Una propuesta que sigues ha recibido nuevos comentarios");
      }, 3000);

      setTimeout(() => {
        showInfo("La propuesta ha alcanzado 100 votos de apoyo", {
          duration: 6000,
          onClick: () => {
            console.log("Navegando a estadísticas de la propuesta");
          }
        });
      }, 6000);

      setTimeout(() => {
        showWarning("Esta propuesta será cerrada a votación en 24 horas", {
          duration: 8000,
        });
      }, 9000);
    };

    if (proposalId) {
      simulateProposalUpdate();
    }
  }, [proposalId, notifyProposalUpdate, showInfo, showWarning]);

  const handleVoteSubmit = async () => {
    try {
      // Lógica de envío de voto
      await submitVote();
      showSuccess("¡Tu voto ha sido registrado exitosamente!");
    } catch (error) {
      showError("Error al registrar tu voto. Por favor, intenta nuevamente.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Detalle de Propuesta</h1>
      
      {/* Contenido de la propuesta */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600 mb-4">
          Esta página muestra los detalles de una propuesta ciudadana.
          Las notificaciones toast aparecerán automáticamente cuando ocurran eventos relevantes.
        </p>
        
        <button
          onClick={handleVoteSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Enviar Voto
        </button>
      </div>
    </div>
  );
};

// Integración en App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastNotificationProvider } from './contexts/ToastNotificationProvider';
import { ProposalDetailPage } from './pages/ProposalDetailPage';

function App() {
  const userDID = "did:example:user123"; // Obtener del contexto de autenticación

  return (
    <ToastNotificationProvider maxToasts={5}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route 
              path="/proposal/:proposalId" 
              element={<ProposalDetailPage userDID={userDID} />} 
            />
            {/* Otras rutas */}
          </Routes>
        </div>
      </Router>
    </ToastNotificationProvider>
  );
}