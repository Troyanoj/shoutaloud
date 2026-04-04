import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Heart, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star, 
  Users, 
  FileText, 
  ArrowRight,
  Info,
  Award,
  Target,
  Calendar,
  MessageSquare,
  X
} from 'lucide-react';

// Tipos para el sistema
interface Project {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  phase: 'planning' | 'active' | 'review' | 'completed';
  visibility: 'public' | 'private' | 'invitation';
  requirements: {
    minReputation: number;
    specialization?: string;
    timeCommitment: string;
  };
  participants: number;
  createdAt: string;
  creator: {
    did: string;
    name: string;
  };
}

interface User {
  did: string;
  name: string;
  reputation: number;
  specializations: string[];
  participations: Array<{
    projectId: string;
    role: string;
    joinedAt: string;
    status: 'active' | 'pending' | 'rejected' | 'completed';
  }>;
}

interface ParticipationRequest {
  projectId: string;
  userId: string;
  motivation: string;
  acceptedEthics: boolean;
  timestamp: string;
}

// Mock services
const projectService = {
  getProjectById: (id: string): Project | null => {
    const mockProjects: Project[] = [
      {
        id: 'proj-001',
        title: 'Huertos Urbanos Comunitarios',
        description: 'Iniciativa para crear espacios verdes productivos en la ciudad',
        objectives: [
          'Establecer 10 huertos comunitarios',
          'Formar 200 familias en agricultura urbana',
          'Reducir la huella de carbono local'
        ],
        phase: 'active',
        visibility: 'public',
        requirements: {
          minReputation: 50,
          specialization: 'Agricultura',
          timeCommitment: '4 horas/semana'
        },
        participants: 23,
        createdAt: '2024-11-15',
        creator: {
          did: 'did:example:creator123',
          name: 'María González'
        }
      }
    ];
    return mockProjects.find(p => p.id === id) || null;
  },

  sendParticipationRequest: async (request: ParticipationRequest): Promise<boolean> => {
    // Simular envío al backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  }
};

const reputationService = {
  getUserReputation: (did: string): number => {
    // Mock: retornar reputación basada en el usuario
    return 75; // Simulando un usuario con buena reputación
  }
};

// Componente principal
interface ParticipationFlowProps {
  projectId: string;
  currentUser: User;
  onClose: () => void;
}

const ParticipationFlow: React.FC<ParticipationFlowProps> = ({
  projectId,
  currentUser,
  onClose
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState<'info' | 'eligibility' | 'request' | 'success'>('info');
  const [userReputation, setUserReputation] = useState<number>(0);
  const [participationStatus, setParticipationStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [motivation, setMotivation] = useState('');
  const [acceptedEthics, setAcceptedEthics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadProjectData = () => {
      const projectData = projectService.getProjectById(projectId);
      if (!projectData) {
        setError('Proyecto no encontrado');
        return;
      }
      setProject(projectData);
      
      // Verificar si el usuario ya participa
      const existingParticipation = currentUser.participations.find(
        p => p.projectId === projectId
      );
      
      if (existingParticipation) {
        setParticipationStatus(existingParticipation.status);
      }
      
      // Obtener reputación del usuario
      const reputation = reputationService.getUserReputation(currentUser.did);
      setUserReputation(reputation);
    };

    loadProjectData();
  }, [projectId, currentUser]);

  // Verificar elegibilidad
  const isEligible = () => {
    if (!project) return false;
    return userReputation >= project.requirements.minReputation;
  };

  // Manejar envío de solicitud
  const handleSubmitRequest = async () => {
    if (!project || motivation.length < 30 || !acceptedEthics) return;

    setIsSubmitting(true);
    try {
      const request: ParticipationRequest = {
        projectId: project.id,
        userId: currentUser.did,
        motivation,
        acceptedEthics,
        timestamp: new Date().toISOString()
      };

      await projectService.sendParticipationRequest(request);
      setParticipationStatus('pending');
      setCurrentStep('success');
    } catch (err) {
      setError('Error al enviar la solicitud. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  // Si ya participa, mostrar estado actual
  if (participationStatus === 'accepted') {
    const participation = currentUser.participations.find(p => p.projectId === projectId);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">¡Ya Participas!</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Tu Participación</h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <p><strong>Rol:</strong> {participation?.role}</p>
              <p><strong>Fecha de incorporación:</strong> {new Date(participation?.joinedAt || '').toLocaleDateString()}</p>
              <p><strong>Estado:</strong> Activo</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Gracias por ser parte de {project.title}. Tu contribución hace la diferencia.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Ir al Proyecto
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Únete al Proyecto
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[
              { key: 'info', label: 'Información', icon: Info },
              { key: 'eligibility', label: 'Elegibilidad', icon: Shield },
              { key: 'request', label: 'Solicitud', icon: FileText },
              { key: 'success', label: 'Confirmación', icon: CheckCircle }
            ].map((step, index) => {
              const isActive = step.key === currentStep;
              const isCompleted = ['info', 'eligibility', 'request'].indexOf(currentStep) > ['info', 'eligibility', 'request'].indexOf(step.key);
              const IconComponent = step.icon;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-600 text-white' :
                    isActive ? 'bg-blue-600 text-white' :
                    'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {index < 3 && (
                    <div className={`w-12 h-0.5 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8">
          {/* Paso 1: Información del Proyecto */}
          {currentStep === 'info' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {project.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Información básica */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Objetivos del Proyecto
                  </h4>
                  <ul className="space-y-2">
                    {project.objectives.map((obj, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requisitos */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Requisitos de Participación
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-700 dark:text-amber-300">
                        Reputación mínima: {project.requirements.minReputation} puntos
                      </span>
                    </div>
                    {project.requirements.specialization && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 dark:text-amber-300">
                          Especialización: {project.requirements.specialization}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-700 dark:text-amber-300">
                        Compromiso: {project.requirements.timeCommitment}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado del proyecto */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {project.participants} participantes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Creado el {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.phase === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    project.phase === 'planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                  }`}>
                    {project.phase === 'active' ? 'Activo' :
                     project.phase === 'planning' ? 'Planificación' :
                     project.phase === 'review' ? 'En Revisión' : 'Completado'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep('eligibility')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Verificación de Elegibilidad */}
          {currentStep === 'eligibility' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Verificación de Elegibilidad
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Revisemos si cumples con los requisitos para participar
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                {/* Reputación */}
                <div className={`rounded-xl p-6 border-2 ${
                  isEligible() 
                    ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {isEligible() ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Reputación
                    </h4>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tu reputación: {userReputation} puntos
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Requerido: {project.requirements.minReputation} puntos
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        isEligible() ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ 
                        width: `${Math.min((userReputation / project.requirements.minReputation) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  
                  {!isEligible() && (
                    <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                        <strong>¿Cómo puedes mejorar tu reputación?</strong>
                      </p>
                      <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                        <li>• Completa tu perfil y verifica tu identidad</li>
                        <li>• Participa en proyectos más pequeños</li>
                        <li>• Contribuye con comentarios constructivos</li>
                        <li>• Mantén un comportamiento ético consistente</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Especialización (si es requerida) */}
                {project.requirements.specialization && (
                  <div className={`rounded-xl p-6 border-2 ${
                    currentUser.specializations.includes(project.requirements.specialization)
                      ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-6 h-6 text-amber-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Especialización Deseada
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Se prefiere: {project.requirements.specialization}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {currentUser.specializations.includes(project.requirements.specialization)
                        ? '¡Tienes la especialización requerida!'
                        : 'No es obligatorio, pero se valorará tu motivación y disposición a aprender.'
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('info')}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Anterior
                </button>
                
                {isEligible() ? (
                  <button
                    onClick={() => setCurrentStep('request')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Solicitar Participación
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Aún no cumples los requisitos mínimos
                    </p>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Trabajar en mi Reputación
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Formulario de Solicitud */}
          {currentStep === 'request' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Solicitud de Participación
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Cuéntanos por qué quieres formar parte de este proyecto
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Motivación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivación Personal *
                  </label>
                  <textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Explica por qué quieres participar en este proyecto, qué puedes aportar y cómo se alinea con tus valores personales... (mínimo 30 caracteres)"
                    className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    minLength={30}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs ${
                      motivation.length >= 30 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {motivation.length}/30 caracteres mínimos
                    </span>
                    {motivation.length >= 30 && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>

                {/* Código Ético */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Código Ético de Participación
                  </h4>
                  <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300 mb-4">
                    <p>• Respetaré las decisiones tomadas democráticamente</p>
                    <p>• Mantendré un comportamiento constructivo y empático</p>
                    <p>• Contribuiré honestamente según mis capacidades</p>
                    <p>• Respetaré la diversidad de opiniones y perspectivas</p>
                    <p>• Protegeré la privacidad y datos de otros participantes</p>
                    <p>• Priorizaré el bien común sobre intereses personales</p>
                  </div>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedEthics}
                      onChange={(e) => setAcceptedEthics(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      Acepto explícitamente el código ético y me comprometo a cumplirlo durante mi participación en el proyecto *
                    </span>
                  </label>
                </div>

                {/* Información adicional */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p className="font-medium mb-1">¿Qué pasa después?</p>
                      <p>Tu solicitud será revisada por los organizadores del proyecto. Recibirás una notificación con la decisión en un plazo máximo de 7 días. Mientras tanto, puedes explorar otros proyectos o trabajar en mejorar tu perfil.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('eligibility')}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Anterior
                </button>
                
                <button
                  onClick={handleSubmitRequest}
                  disabled={motivation.length < 30 || !acceptedEthics || isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Solicitud
                      <MessageSquare className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Confirmación de Éxito */}
          {currentStep === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Solicitud Enviada con Éxito!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                  Tu solicitud para participar en "{project.title}" ha sido enviada correctamente.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 max-w-lg mx-auto">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  ¿Qué sigue ahora?
                </h4>
                <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Los organizadores revisarán tu solicitud en los próximos 7 días</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Te notificaremos por mensaje directo sobre la decisión</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Mientras tanto, puedes explorar otros proyectos interesantes</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 max-w-lg mx-auto">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Estado de tu solicitud: Pendiente
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Puedes verificar el estado en tu panel de participaciones en cualquier momento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Explorar Proyectos
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Ir a Mi Panel
                </button>
              </div>
            </div>
          )}

          {/* Estado de solicitud pendiente */}
          {participationStatus === 'pending' && currentStep === 'info' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-amber-600" />
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                  Solicitud Pendiente
                </h4>
              </div>
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-4">
                Ya has enviado una solicitud para participar en este proyecto. Los organizadores la están revisando.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors text-sm"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          {/* Estado de solicitud rechazada */}
          {participationStatus === 'rejected' && currentStep === 'info' && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h4 className="font-semibold text-red-800 dark:text-red-200">
                  Solicitud No Aceptada
                </h4>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                Tu solicitud anterior no fue aceptada. No te desanimes, puedes trabajar en mejorar tu perfil y volver a intentar en el futuro.
              </p>
              <div className="bg-red-100 dark:bg-red-900/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-2">
                  Consejos para mejorar tu próxima solicitud:
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                  <li>• Aumenta tu reputación participando en proyectos más pequeños</li>
                  <li>• Desarrolla habilidades relacionadas con la especialización requerida</li>
                  <li>• Mejora tu motivación personal con ejemplos más específicos</li>
                  <li>• Participa más activamente en la comunidad</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  Entendido
                </button>
                <button
                  onClick={() => {
                    setParticipationStatus('none');
                    setCurrentStep('info');
                  }}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors text-sm"
                >
                  Intentar de Nuevo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Ejemplo de uso del componente
const ParticipationFlowDemo: React.FC = () => {
  const [showFlow, setShowFlow] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('proj-001');

  // Usuario mock para la demo
  const mockUser: User = {
    did: 'did:example:user123',
    name: 'Ana Martínez',
    reputation: 75,
    specializations: ['Agricultura', 'Sostenibilidad'],
    participations: []
  };

  // Ejemplo de usuario que ya participa
  const mockUserParticipating: User = {
    did: 'did:example:user456',
    name: 'Carlos Rodríguez',
    reputation: 120,
    specializations: ['Agricultura', 'Educación'],
    participations: [
      {
        projectId: 'proj-001',
        role: 'Coordinador de Huertos',
        joinedAt: '2024-12-01',
        status: 'accepted'
      }
    ]
  };

  // Ejemplo de usuario con baja reputación
  const mockUserLowRep: User = {
    did: 'did:example:user789',
    name: 'María López',
    reputation: 25,
    specializations: [],
    participations: []
  };

  const [currentUser, setCurrentUser] = useState<User>(mockUser);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🌱 Sistema de Participación Ciudadana - Shout Aloud
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Flujo ético, transparente y centrado en el consentimiento para que los ciudadanos 
            puedan unirse a proyectos colaborativos de manera soberana y humana.
          </p>
        </div>

        {/* Selector de usuario para demo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Demo Interactiva - Selecciona un Perfil de Usuario
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => setCurrentUser(mockUser)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                currentUser.did === mockUser.did
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Ana Martínez</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rep: 75 pts</div>
                <div className="text-xs text-green-600 dark:text-green-400">✓ Elegible</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentUser(mockUserParticipating)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                currentUser.did === mockUserParticipating.did
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Carlos Rodríguez</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rep: 120 pts</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">↻ Ya participa</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentUser(mockUserLowRep)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                currentUser.did === mockUserLowRep.did
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">María López</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rep: 25 pts</div>
                <div className="text-xs text-red-600 dark:text-red-400">✗ No elegible</div>
              </div>
            </button>
          </div>
        </div>

        {/* Proyecto ejemplo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                🌱 Huertos Urbanos Comunitarios
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Iniciativa para crear espacios verdes productivos en la ciudad
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  23 participantes
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Min. 50 pts reputación
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs">
                  Activo
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowFlow(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Unirse al Proyecto
            </button>
          </div>
        </div>

        {/* Características del flujo */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Ético</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transparencia total, sin exclusiones silenciosas, consentimiento explícito
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Empático</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Mensajes motivacionales, consejos constructivos, apoyo en el proceso
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Accesible</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Diseño responsive, modo oscuro, interfaz intuitiva y clara
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Guiado</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Flujo paso a paso, validaciones claras, feedback constante
            </p>
          </div>
        </div>
      </div>

      {/* Modal del flujo de participación */}
      {showFlow && (
        <ParticipationFlow
          projectId={selectedProject}
          currentUser={currentUser}
          onClose={() => setShowFlow(false)}
        />
      )}
    </div>
  );
};

export default ParticipationFlowDemo;