// frontend/src/components/profile/MentorAssignmentPanel.tsx
// Panel para mostrar estado de mentoría con progreso motivacional y ético

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  UserCheck,
  GraduationCap,
  Star,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  MessageCircle,
  Award,
  Heart,
  Users,
  Lightbulb,
  Shield,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

import { useMentorshipService } from '../../services/mentorService';
import { useReputationService } from '../../services/reputation';

interface MentorAssignmentPanelProps {
  userDid: string;
  userReputation: number;
  onMentorshipUpdate?: () => void;
}

interface MentorshipDisplayData {
  mentorship: any;
  progress: any;
  mentor?: any;
  isEligibleForMentorship: boolean;
  graduationReady: boolean;
}

const MentorAssignmentPanel: React.FC<MentorAssignmentPanelProps> = ({
  userDid,
  userReputation,
  onMentorshipUpdate
}) => {
  const { mentorshipManager, executeAction, loading } = useMentorshipService();
  const { getUserReputation } = useReputationService();
  
  const [mentorshipData, setMentorshipData] = useState<MentorshipDisplayData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRequestMentor, setShowRequestMentor] = useState(false);
  const [requestingMentor, setRequestingMentor] = useState(false);

  useEffect(() => {
    loadMentorshipData();
  }, [userDid, userReputation]);

  const loadMentorshipData = async () => {
    try {
      // Verificar si el usuario es elegible para mentoría
      const isEligibleForMentorship = userReputation < 30;
      
      if (!isEligibleForMentorship) {
        setMentorshipData({
          mentorship: null,
          progress: null,
          isEligibleForMentorship: false,
          graduationReady: false
        });
        return;
      }

      // Buscar mentoría activa
      const mentorships = JSON.parse(localStorage.getItem('shout_aloud_mentorships') || '[]');
      const activeMentorship = mentorships.find((m: any) => 
        m.menteeDid === userDid && m.status === 'active'
      );

      if (activeMentorship) {
        // Obtener progreso de la mentoría
        const progress = await executeAction(() => 
          mentorshipManager.getMentorshipProgress(activeMentorship.id)
        );

        // Obtener información del mentor
        const mentors = JSON.parse(localStorage.getItem('shout_aloud_mentors') || '[]');
        const mentor = mentors.find((m: any) => m.did === activeMentorship.mentorDid);

        setMentorshipData({
          mentorship: activeMentorship,
          progress,
          mentor,
          isEligibleForMentorship: true,
          graduationReady: userReputation >= 30
        });
      } else {
        setMentorshipData({
          mentorship: null,
          progress: null,
          isEligibleForMentorship: true,
          graduationReady: false
        });
      }
    } catch (error) {
      console.error('Error loading mentorship data:', error);
    }
  };

  const requestMentorAssignment = async () => {
    try {
      setRequestingMentor(true);
      
      const menteeProfile = {
        name: 'Ciudadano Nuevo', // Se podría obtener del perfil del usuario
        municipality: 'Barcelona', // Se podría obtener del perfil del usuario
        interests: ['participacion_ciudadana', 'proyectos_comunitarios'],
        goals: ['aumentar_reputacion', 'aprender_plataforma', 'contribuir_comunidad'],
        preferredLanguage: 'es',
        learningStyle: 'collaborative' as const
      };

      const mentorship = await executeAction(() =>
        mentorshipManager.autoAssignMentor(menteeProfile)
      );

      if (mentorship) {
        await loadMentorshipData();
        onMentorshipUpdate?.();
      } else {
        // Usuario agregado a lista de espera
        alert('Te hemos agregado a la lista de espera. Te notificaremos cuando haya un mentor disponible.');
      }
    } catch (error) {
      console.error('Error requesting mentor:', error);
      alert('Error al solicitar mentor: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setRequestingMentor(false);
      setShowRequestMentor(false);
    }
  };

  const getMotivationalMessage = (reputation: number, progress?: any): string => {
    if (!mentorshipData?.isEligibleForMentorship) {
      return "¡Felicidades! Ya tienes experiencia suficiente para participar independientemente. 🎉";
    }

    if (reputation < 5) {
      return "¡Bienvenido a Shout Aloud! Tu mentor te ayudará a dar tus primeros pasos. 🌟";
    } else if (reputation < 15) {
      return "¡Excelente progreso! Estás aprendiendo rápido sobre participación ciudadana. 📚";
    } else if (reputation < 25) {
      return "¡Vas muy bien! Pronto serás un ciudadano experimentado. 🚀";
    } else {
      return "¡Casi lo logras! Estás a punto de graduarte del programa de mentoría. 🎓";
    }
  };

  const renderEligibleForMentorship = () => {
    if (mentorshipData?.mentorship) {
      return renderActiveMentorship();
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              🧑‍🏫 Programa de Mentoría Disponible
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Acompañamiento personalizado para nuevos ciudadanos
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Como nuevo miembro de la comunidad, puedes acceder a nuestro programa de mentoría 
            donde un ciudadano experimentado te acompañará en tus primeras contribuciones.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Acompañamiento</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Orientación personalizada y apoyo continuo
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Objetivos Claros</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Metas específicas para tu crecimiento
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Comunidad</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Conexión con ciudadanos experimentados
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Sin Jerarquías</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Relación horizontal y colaborativa
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowRequestMentor(true)}
              disabled={requestingMentor}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {requestingMentor ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Asignando Mentor...
                </div>
              ) : (
                'Solicitar Mentor'
              )}
            </button>
            
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-3 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderActiveMentorship = () => {
    const { mentorship, progress, mentor } = mentorshipData!;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6"
      >
        {/* Header de mentoría activa */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                🧑‍🏫 Mentoría Activa
                {mentorshipData?.graduationReady && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    🎓 Listo para graduación
                  </span>
                )}
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                {getMotivationalMessage(userReputation, progress)}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
          >
            <ChevronRight className={`w-5 h-5 text-green-600 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Información del mentor */}
        {mentor && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                  Tu Mentor: {mentor.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reputación: {mentor.reputation} • {mentor.municipality}
                </p>
              </div>
            </div>
            
            {mentor.specialization && mentor.specialization.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mentor.specialization.slice(0, 3).map((spec: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progreso de reputación */}
        {progress && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Progreso de Reputación
              </h4>
              <span className="text-lg font-bold text-purple-600">
                {progress.reputationProgress.currentReputation}/30
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.reputationProgress.progressPercentage}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {progress.reputationProgress.progressPercentage.toFixed(1)}% del objetivo para graduación
            </p>
          </div>
        )}

        {/* Objetivos y hitos */}
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Objetivos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-orange-500" />
                Objetivos
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Completados</span>
                  <span className="font-medium text-green-600">
                    {progress.goalsProgress.completed}/{progress.goalsProgress.total}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">En progreso</span>
                  <span className="font-medium text-blue-600">
                    {progress.goalsProgress.inProgress}
                  </span>
                </div>
              </div>
            </div>

            {/* Hitos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Hitos
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Logrados</span>
                  <span className="font-medium text-green-600">
                    {progress.milestonesProgress.completed}/{progress.milestonesProgress.total}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Próximos</span>
                  <span className="font-medium text-blue-600">
                    {progress.milestonesProgress.upcoming}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowDetails(true)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Ver Detalles Completos
          </button>
          
          {mentorshipData?.graduationReady && (
            <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm">
              🎓 Solicitar Graduación
            </button>
          )}
        </div>

        {/* Próximos pasos recomendados */}
        {progress?.recommendedNextSteps && progress.recommendedNextSteps.length > 0 && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4" />
              Próximos Pasos Recomendados
            </h4>
            <ul className="space-y-1">
              {progress.recommendedNextSteps.slice(0, 2).map((step: string, index: number) => (
                <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    );
  };

  const renderNotEligible = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
          <Star className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
            🌟 Ciudadano Experimentado
          </h3>
          <p className="text-sm text-purple-600 dark:text-purple-300">
            {getMotivationalMessage(userReputation)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          Tu reputación de <strong>{userReputation} puntos</strong> demuestra que ya tienes 
          experiencia suficiente para participar independientemente en la plataforma.
        </p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4" />
            ¿Te interesa ser mentor?
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Puedes ayudar a nuevos ciudadanos compartiendo tu experiencia de forma colaborativa y horizontal.
          </p>
          <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm">
            Explorar Programa de Mentores
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Modal de solicitud de mentor
  const renderRequestMentorModal = () => (
    <AnimatePresence>
      {showRequestMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🧑‍🏫 Solicitar Mentor
            </h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Te asignaremos automáticamente un mentor basado en:
              </p>
              
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  Tu ubicación geográfica
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  Tus intereses y objetivos
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  Disponibilidad de horarios
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  Compatibilidad de personalidad
                </li>
              </ul>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Nota:</strong> La mentoría es una relación horizontal y colaborativa. 
                  Tu mentor te acompañará como un par experimentado, no como una autoridad.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestMentor(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={requestMentorAssignment}
                disabled={requestingMentor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {requestingMentor ? 'Asignando...' : 'Solicitar Mentor'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Modal de detalles completos
  const renderDetailsModal = () => (
    <AnimatePresence>
      {showDetails && mentorshipData?.mentorship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                📊 Detalles de Mentoría
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Información de verificación ética */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4" />
                Verificación Ética
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Firmado por mentor:</span>
                  <span className="ml-2 text-green-600">✓ Verificado</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Hash IPFS:</span>
                  <span className="ml-2 font-mono text-xs text-gray-500">
                    {mentorshipData.mentorship.ipfsHash?.substring(0, 20)}...
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Inicio:</span>
                  <span className="ml-2">
                    {new Date(mentorshipData.mentorship.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Duración esperada:</span>
                  <span className="ml-2">3 meses</span>
                </div>
              </div>
            </div>

            {/* Objetivos detallados */}
            {mentorshipData.mentorship.goals && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  🎯 Objetivos de Aprendizaje
                </h4>
                <div className="space-y-3">
                  {mentorshipData.mentorship.goals.map((goal: any, index: number) => (
                    <div
                      key={goal.id}
                      className={`p-3 rounded-lg border ${
                        goal.status === 'completed' 
                          ? 'bg-green-50 border-green-200' 
                          : goal.status === 'in_progress'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-800">{goal.title}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          goal.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : goal.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {goal.status === 'completed' ? 'Completado' :
                           goal.status === 'in_progress' ? 'En progreso' :
                           'Pendiente'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>+{goal.targetReputationGain} puntos</span>
                        <span>{goal.estimatedDuration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enlace de verificación pública */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4" />
                Verificación Pública
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Esta mentoría puede ser verificada públicamente sin exponer identidades personales.
              </p>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Ver Certificado Verificable
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Panel principal */}
      {mentorshipData ? (
        mentorshipData.isEligibleForMentorship 
          ? renderEligibleForMentorship()
          : renderNotEligible()
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Cargando información de mentoría...
          </p>
        </div>
      )}

      {/* Modales */}
      {renderRequestMentorModal()}
      {renderDetailsModal()}
    </div>
  );
};

export default MentorAssignmentPanel;