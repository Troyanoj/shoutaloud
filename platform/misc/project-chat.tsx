import React, { useState, useEffect, useRef } from 'react';
import { Send, Flag, Volume2, VolumeX, Eye, EyeOff, ExternalLink, AlertCircle, Users } from 'lucide-react';

// Tipos para el sistema de chat
interface Message {
  id: string;
  userId: string;
  userNickname: string;
  userReputation: number;
  userRole?: 'founder' | 'core' | 'contributor' | 'observer';
  content: string;
  timestamp: number;
  isFirstContribution?: boolean;
  moderationStatus: 'clean' | 'reported' | 'flagged';
  hasLinks?: boolean;
}

interface ProjectChatProps {
  projectId: string;
  currentUser?: {
    id: string;
    nickname: string;
    reputation: number;
    did: string;
    avatar?: string;
  } | null;
  projectName: string;
  canPost: boolean;
}

// Servicios mock simulados
const chatService = {
  async getProjectMessages(projectId: string): Promise<Message[]> {
    // Simulación de mensajes iniciales
    return [
      {
        id: 'welcome-msg',
        userId: 'system',
        userNickname: 'Shout Aloud',
        userReputation: 100,
        userRole: 'founder',
        content: '🌟 Bienvenidos al canal de colaboración de este proyecto. Recordemos mantener un diálogo respetuoso, constructivo y orientado a nuestros objetivos comunes. Cualquier contribución es valiosa. ¡Trabajemos juntos! 🤝',
        timestamp: Date.now() - 3600000,
        moderationStatus: 'clean',
        isFirstContribution: false
      },
      {
        id: 'msg-1',
        userId: 'user-1',
        userNickname: 'EcoActivist47',
        userReputation: 85,
        userRole: 'core',
        content: 'Hola equipo! 👋 Propongo organizar una reunión virtual esta semana para definir las próximas acciones. ¿Qué les parece el miércoles a las 19:00?',
        timestamp: Date.now() - 1800000,
        moderationStatus: 'clean',
        isFirstContribution: false
      },
      {
        id: 'msg-2',
        userId: 'user-2',
        userNickname: 'CitizenDev',
        userReputation: 92,
        userRole: 'contributor',
        content: 'Me parece excelente idea 💡 Ya tengo algunas propuestas técnicas que podríamos revisar. También comparto este recurso útil: https://ejemplo.com/recursos-colaboracion',
        timestamp: Date.now() - 900000,
        moderationStatus: 'clean',
        hasLinks: true,
        isFirstContribution: false
      }
    ];
  },

  async sendMessage(projectId: string, userId: string, message: string): Promise<Message> {
    return {
      id: `msg-${Date.now()}`,
      userId,
      userNickname: 'TúUsuario',
      userReputation: 88,
      userRole: 'contributor',
      content: message,
      timestamp: Date.now(),
      moderationStatus: 'clean',
      isFirstContribution: false
    };
  },

  async reportMessage(messageId: string): Promise<boolean> {
    return true;
  }
};

const ProjectChat: React.FC<ProjectChatProps> = ({ 
  projectId, 
  currentUser, 
  projectName, 
  canPost 
}) => {
  // Validación defensiva para currentUser
  if (!currentUser || !currentUser.id) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sesión requerida
        </h3>
        <p className="text-gray-600">
          Necesitas iniciar sesión para acceder al chat del proyecto.
        </p>
      </div>
    );
  }
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [hideAvatar, setHideAvatar] = useState(false);
  const [showCodeOfConduct, setShowCodeOfConduct] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Cargar mensajes iniciales y simular reactividad
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const projectMessages = await chatService.getProjectMessages(projectId);
        setMessages(projectMessages);
        setIsLoading(false);
      } catch (error) {
        console.error('Error cargando mensajes:', error);
        setIsLoading(false);
      }
    };

    loadMessages();

    // Simular WebSocket con polling cada 10 segundos
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  // Auto-scroll al final
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || newMessage.length < 10 || isSending || !canPost || !currentUser?.id) return;

    setIsSending(true);
    try {
      const sentMessage = await chatService.sendMessage(projectId, currentUser.id, newMessage);
      setMessages(prev => [...prev, {
        ...sentMessage,
        userNickname: currentUser.nickname || 'Usuario',
        userReputation: currentUser.reputation || 0
      }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleReportMessage = async (messageId: string) => {
    try {
      await chatService.reportMessage(messageId);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, moderationStatus: 'reported' as const }
            : msg
        )
      );
    } catch (error) {
      console.error('Error reportando mensaje:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getRoleIcon = (role?: string, reputation?: number) => {
    if (role === 'founder') return '🧠';
    if (role === 'core') return '⭐';
    if (role === 'contributor') return '🛠️';
    if (reputation && reputation > 90) return '🌟';
    return '👥';
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 90) return 'text-emerald-600';
    if (reputation >= 80) return 'text-blue-600';
    if (reputation >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const groupMessagesByDay = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    
    return groups;
  };

  const groupedMessages = groupMessagesByDay(messages);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
      {/* Header del Chat */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Chat del Proyecto
              </h3>
              <p className="text-sm text-gray-600">{projectName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSilentMode(!silentMode)}
              className={`p-2 rounded-lg transition-colors ${
                silentMode 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={silentMode ? 'Activar notificaciones' : 'Modo silencio'}
            >
              {silentMode ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setHideAvatar(!hideAvatar)}
              className={`p-2 rounded-lg transition-colors ${
                hideAvatar 
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={hideAvatar ? 'Mostrar avatar' : 'Ocultar avatar'}
            >
              {hideAvatar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Código de Conducta */}
      {showCodeOfConduct && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Código de Conducta:</strong> Mantengamos un diálogo respetuoso, 
                constructivo y orientado a nuestros objetivos comunes. 
                Valoramos cada contribución y perspectiva.
              </p>
            </div>
            <button
              onClick={() => setShowCodeOfConduct(false)}
              className="text-blue-400 hover:text-blue-600 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Área de Mensajes */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Separador de día */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                {new Date(date).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </div>
            </div>

            {/* Mensajes del día */}
            {dayMessages.map((message) => {
              const isOwnMessage = currentUser && message.userId === currentUser.id;
              const showReportButton = message.userReputation < 80 && !isOwnMessage;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {/* Info del usuario */}
                    {!isOwnMessage && (
                      <div className="flex items-center space-x-2 mb-1 px-2">
                        <span className="text-xs">
                          {getRoleIcon(message.userRole, message.userReputation)}
                        </span>
                        <span 
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                          title={`DID: ${message.userId} | Reputación: ${message.userReputation}`}
                        >
                          {message.userNickname}
                        </span>
                        <span className={`text-xs ${getReputationColor(message.userReputation)}`}>
                          ({message.userReputation})
                        </span>
                        {message.isFirstContribution && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Primera contribución
                          </span>
                        )}
                      </div>
                    )}

                    {/* Mensaje */}
                    <div
                      className={`px-4 py-2 rounded-2xl shadow-sm ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white'
                          : message.moderationStatus === 'reported'
                          ? 'bg-red-50 border border-red-200 text-gray-700'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      
                      {/* Enlaces */}
                      {message.hasLinks && (
                        <div className="mt-2 p-2 bg-black bg-opacity-10 rounded-lg">
                          <div className="flex items-center space-x-2 text-xs">
                            <ExternalLink className="w-3 h-3" />
                            <span>Enlace compartido</span>
                          </div>
                        </div>
                      )}

                      {/* Timestamp y acciones */}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </span>
                        
                        {showReportButton && (
                          <button
                            onClick={() => handleReportMessage(message.id)}
                            className="ml-2 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
                            title="Reportar mensaje"
                          >
                            <Flag className="w-3 h-3 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      {canPost && !silentMode ? (
        <div className="p-4 border-t bg-white">
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje (mín. 10 caracteres)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                maxLength={500}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {newMessage.length}/500 caracteres
                  {newMessage.length < 10 && newMessage.length > 0 && (
                    <span className="text-red-500 ml-1">
                      (mín. 10)
                    </span>
                  )}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={newMessage.length < 10 || isSending || !currentUser?.id}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                newMessage.length >= 10 && !isSending && currentUser?.id
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            {silentMode 
              ? "🔇 Modo silencio activado - Solo lectura"
              : !canPost 
              ? "⚠️ Necesitas participar en el proyecto para enviar mensajes"
              : "Chat no disponible"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectChat;