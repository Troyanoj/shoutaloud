import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MapPin,
  Target,
  Eye,
  EyeOff,
  Shield,
  FileText,
  Lightbulb,
  Plus,
  Minus,
  Upload,
  Hash,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

// Tipos de datos
interface ProjectObjective {
  id: string;
  description: string;
}

interface ProjectFormData {
  title: string;
  category: string;
  publicSummary: string;
  detailedDescription: string;
  objectives: ProjectObjective[];
  municipality: string;
  phase: string;
  visibility: 'public' | 'private' | 'community';
  minReputationToJoin: number;
  maxParticipants: number | null;
  resources: File[];
  resourceLinks: string[];
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Categorías de especialización
const SPECIALIZATION_CATEGORIES = [
  { id: 'governance', name: 'Gobernanza y Participación', icon: '🏛️' },
  { id: 'environment', name: 'Medio Ambiente', icon: '🌱' },
  { id: 'education', name: 'Educación y Cultura', icon: '📚' },
  { id: 'health', name: 'Salud y Bienestar', icon: '🏥' },
  { id: 'economy', name: 'Economía Local', icon: '💼' },
  { id: 'technology', name: 'Tecnología e Innovación', icon: '🚀' },
  { id: 'social', name: 'Cohesión Social', icon: '🤝' }
];

// Fases del proyecto
const PROJECT_PHASES = [
  { id: 'proposal', name: 'Propuesta 💡', description: 'Fase inicial de ideación' },
  { id: 'planning', name: 'Planificación 📋', description: 'Definición de estrategias' },
  { id: 'execution', name: 'Ejecución 🚀', description: 'Implementación activa' },
  { id: 'evaluation', name: 'Evaluación 📊', description: 'Medición de resultados' }
];

// Opciones de visibilidad
const VISIBILITY_OPTIONS = [
  { 
    id: 'public', 
    name: 'Público', 
    description: 'Visible para toda la comunidad',
    icon: <Eye className="w-4 h-4" />
  },
  { 
    id: 'private', 
    name: 'Privado', 
    description: 'Solo visible para ti',
    icon: <EyeOff className="w-4 h-4" />
  },
  { 
    id: 'community', 
    name: 'Comunidad Cerrada', 
    description: 'Visible para miembros específicos',
    icon: <Users className="w-4 h-4" />
  }
];

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    category: '',
    publicSummary: '',
    detailedDescription: '',
    objectives: [{ id: '1', description: '' }],
    municipality: '',
    phase: 'proposal',
    visibility: 'public',
    minReputationToJoin: 0,
    maxParticipants: null,
    resources: [],
    resourceLinks: ['']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Pasos del formulario
  const steps = [
    { 
      id: 'basic', 
      title: 'Información Básica', 
      description: 'Define los fundamentos de tu proyecto',
      icon: <Lightbulb className="w-5 h-5" />
    },
    { 
      id: 'details', 
      title: 'Detalles y Objetivos', 
      description: 'Describe tu visión en profundidad',
      icon: <FileText className="w-5 h-5" />
    },
    { 
      id: 'settings', 
      title: 'Configuración', 
      description: 'Ajusta la participación y recursos',
      icon: <Shield className="w-5 h-5" />
    }
  ];

  // Validación del formulario
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.length > 100) {
      newErrors.title = 'El título no puede exceder 100 caracteres';
    }

    if (!formData.category) {
      newErrors.category = 'Selecciona una categoría';
    }

    if (!formData.publicSummary.trim()) {
      newErrors.publicSummary = 'El resumen público es requerido';
    } else if (formData.publicSummary.length > 300) {
      newErrors.publicSummary = 'El resumen no puede exceder 300 caracteres';
    }

    if (!formData.detailedDescription.trim()) {
      newErrors.detailedDescription = 'La descripción detallada es requerida';
    } else if (formData.detailedDescription.length < 500) {
      newErrors.detailedDescription = 'La descripción debe tener al menos 500 caracteres';
    }

    if (formData.objectives.some(obj => !obj.description.trim())) {
      newErrors.objectives = 'Todos los objetivos deben tener descripción';
    }

    if (!formData.municipality.trim()) {
      newErrors.municipality = 'Selecciona un municipio';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [formData]);

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar objetivos
  const addObjective = () => {
    const newId = Date.now().toString();
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, { id: newId, description: '' }]
    }));
  };

  const removeObjective = (id: string) => {
    if (formData.objectives.length > 1) {
      setFormData(prev => ({
        ...prev,
        objectives: prev.objectives.filter(obj => obj.id !== id)
      }));
    }
  };

  const updateObjective = (id: string, description: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map(obj => 
        obj.id === id ? { ...obj, description } : obj
      )
    }));
  };

  // Manejar enlaces de recursos
  const addResourceLink = () => {
    setFormData(prev => ({
      ...prev,
      resourceLinks: [...prev.resourceLinks, '']
    }));
  };

  const removeResourceLink = (index: number) => {
    if (formData.resourceLinks.length > 1) {
      setFormData(prev => ({
        ...prev,
        resourceLinks: prev.resourceLinks.filter((_, i) => i !== index)
      }));
    }
  };

  const updateResourceLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      resourceLinks: prev.resourceLinks.map((link, i) => 
        i === index ? value : link
      )
    }));
  };

  // Componente Tooltip
  const Tooltip: React.FC<{ content: string; children: React.ReactNode; id: string }> = ({ content, children, id }) => (
    <div className="relative">
      <div
        onMouseEnter={() => setShowTooltip(id)}
        onMouseLeave={() => setShowTooltip(null)}
        className="cursor-help"
      >
        {children}
      </div>
      <AnimatePresence>
        {showTooltip === id && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-64 p-3 text-sm bg-gray-800 text-white rounded-lg shadow-lg -top-12 left-0"
          >
            {content}
            <div className="absolute bottom-0 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 transform translate-y-full"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Renderizar paso actual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Título */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                Título del Proyecto *
                <Tooltip id="title" content="Un nombre claro y memorable que inspire a otros ciudadanos a participar">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Huerto Comunitario del Barrio Centro"
                maxLength={100}
              />
              <div className="flex justify-between mt-1">
                {errors.title && <span className="text-red-500 text-sm">{errors.title}</span>}
                <span className="text-gray-400 text-sm">{formData.title.length}/100</span>
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 mr-2 text-blue-500" />
                Categoría Temática *
                <Tooltip id="category" content="Selecciona el área que mejor represente el enfoque principal de tu proyecto">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona una categoría</option>
                {SPECIALIZATION_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <span className="text-red-500 text-sm mt-1">{errors.category}</span>}
            </div>

            {/* Resumen Público */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 mr-2 text-purple-500" />
                Resumen Público *
                <Tooltip id="summary" content="Una descripción breve que aparecerá en las búsquedas y listados públicos">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <textarea
                value={formData.publicSummary}
                onChange={(e) => handleInputChange('publicSummary', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.publicSummary ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Describe brevemente tu proyecto y su impacto esperado..."
                maxLength={300}
              />
              <div className="flex justify-between mt-1">
                {errors.publicSummary && <span className="text-red-500 text-sm">{errors.publicSummary}</span>}
                <span className="text-gray-400 text-sm">{formData.publicSummary.length}/300</span>
              </div>
            </div>

            {/* Municipio */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2 text-red-500" />
                Municipio Principal de Impacto *
                <Tooltip id="municipality" content="El municipio donde tendrá mayor impacto tu proyecto">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={formData.municipality}
                onChange={(e) => handleInputChange('municipality', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.municipality ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Medellín, Antioquia"
              />
              {errors.municipality && <span className="text-red-500 text-sm mt-1">{errors.municipality}</span>}
            </div>

            {formData.title && formData.category && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-green-700 font-medium">💡 ¡Excelente inicio!</p>
                <p className="text-green-600 text-sm mt-1">
                  Cada idea puede transformar una comunidad. Continuemos definiendo los detalles.
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Descripción Detallada */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                Descripción Detallada *
                <Tooltip id="description" content="Explica en detalle tu propuesta, metodología y plan de acción">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <textarea
                value={formData.detailedDescription}
                onChange={(e) => handleInputChange('detailedDescription', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.detailedDescription ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={8}
                placeholder="Describe tu proyecto en detalle: contexto, metodología, recursos necesarios, plan de implementación..."
                minLength={500}
              />
              <div className="flex justify-between mt-1">
                {errors.detailedDescription && <span className="text-red-500 text-sm">{errors.detailedDescription}</span>}
                <span className={`text-sm ${formData.detailedDescription.length >= 500 ? 'text-green-600' : 'text-gray-400'}`}>
                  {formData.detailedDescription.length}/500 mínimo
                </span>
              </div>
            </div>

            {/* Objetivos */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 mr-2 text-orange-500" />
                Objetivos del Proyecto *
                <Tooltip id="objectives" content="Define metas específicas y medibles para tu proyecto">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <div className="space-y-3">
                {formData.objectives.map((objective, index) => (
                  <div key={objective.id} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                    <input
                      type="text"
                      value={objective.description}
                      onChange={(e) => updateObjective(objective.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={`Objetivo ${index + 1}`}
                    />
                    {formData.objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjective(objective.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addObjective}
                  className="flex items-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Objetivo
                </button>
              </div>
              {errors.objectives && <span className="text-red-500 text-sm mt-1">{errors.objectives}</span>}
            </div>

            {/* Fase */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="w-4 h-4 mr-2 text-teal-500" />
                Fase Inicial
                <Tooltip id="phase" content="En qué etapa planeas comenzar tu proyecto">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <select
                value={formData.phase}
                onChange={(e) => handleInputChange('phase', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {PROJECT_PHASES.map(phase => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name} - {phase.description}
                  </option>
                ))}
              </select>
            </div>

            {formData.detailedDescription.length >= 500 && formData.objectives.every(obj => obj.description.trim()) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <p className="text-blue-700 font-medium">🚀 ¡Tu visión toma forma!</p>
                <p className="text-blue-600 text-sm mt-1">
                  Una descripción completa y objetivos claros son la base del éxito colaborativo.
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Visibilidad */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <Eye className="w-4 h-4 mr-2 text-purple-500" />
                Visibilidad del Proyecto
                <Tooltip id="visibility" content="Define quién puede ver y participar en tu proyecto">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {VISIBILITY_OPTIONS.map(option => (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.visibility === option.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.id}
                      checked={formData.visibility === option.id}
                      onChange={(e) => handleInputChange('visibility', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      {option.icon}
                      <div>
                        <div className="font-medium text-sm">{option.name}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reputación Mínima */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <Shield className="w-4 h-4 mr-2 text-amber-500" />
                Reputación Mínima para Unirse: {formData.minReputationToJoin}
                <Tooltip id="reputation" content="Nivel mínimo de reputación requerido para participar en el proyecto">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.minReputationToJoin}
                onChange={(e) => handleInputChange('minReputationToJoin', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Abierto (0)</span>
                <span>Medio (50)</span>
                <span>Alto (100)</span>
              </div>
            </div>

            {/* Número Máximo de Participantes */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 mr-2 text-cyan-500" />
                Número Máximo de Participantes
                <Tooltip id="maxParticipants" content="Limita el número de participantes (deja vacío para ilimitado)">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <input
                type="number"
                value={formData.maxParticipants || ''}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: 20 (opcional)"
                min="1"
              />
            </div>

            {/* Enlaces de Recursos */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 mr-2 text-pink-500" />
                Enlaces de Recursos
                <Tooltip id="resourceLinks" content="Enlaces a documentos, sitios web o recursos relevantes">
                  <Info className="w-4 h-4 ml-2 text-gray-400" />
                </Tooltip>
              </label>
              <div className="space-y-2">
                {formData.resourceLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateResourceLink(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://ejemplo.com/recurso"
                    />
                    {formData.resourceLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResourceLink(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addResourceLink}
                  className="flex items-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Enlace
                </button>
              </div>
            </div>

            {/* Firma Digital */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center mb-3">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                <h3 className="font-medium text-gray-800">Firma Criptográfica con DID</h3>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Tu identidad digital descentralizada firmará este proyecto para garantizar autenticidad y transparencia.
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Hash className="w-3 h-3 mr-1" />
                    Hash se generará automáticamente tras la creación
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            {isFormValid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg"
              >
                <p className="text-green-700 font-medium">🌱 ¡Listo para sembrar tu idea!</p>
                <p className="text-green-600 text-sm mt-1">
                  Tu proyecto está completo y listo para transformar la comunidad.
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Crear Nuevo Proyecto Ciudadano
        </h2>
        <p className="text-gray-600">
          Comparte tu idea y construye una comunidad colaborativa
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-3 ${
                index <= currentStep ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-green-50 border-green-500 text-green-600'
                    : 'bg-gray-50 border-gray-300 text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="hidden md:block">
                <div className="font-medium text-sm">{step.title}</div>
                <div className="text-xs opacity-75">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden md:block w-12 h-px ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="min-h-[600px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <div className="flex space-x-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </button>
          )}
          
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
        </div>

        <div className="flex space-x-3">
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isLoading ||
                (currentStep === 0 && (!formData.title || !formData.category || !formData.publicSummary || !formData.municipality)) ||
                (currentStep === 1 && (!formData.detailedDescription || formData.detailedDescription.length < 500 || formData.objectives.some(obj => !obj.description.trim())))
              }
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSubmit(formData)}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Crear Proyecto
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Motivational Messages */}
      <AnimatePresence>
        {currentStep === 0 && formData.title && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <p className="text-yellow-700 text-sm">
              ✨ <strong>"{formData.title}"</strong> - Un nombre que inspira acción colectiva
            </p>
          </motion.div>
        )}
        
        {currentStep === 1 && formData.objectives.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-blue-700 text-sm">
              🎯 <strong>{formData.objectives.length} objetivos definidos</strong> - La claridad es el primer paso hacia el impacto
            </p>
          </motion.div>
        )}
        
        {currentStep === 2 && formData.visibility === 'public' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-green-700 text-sm">
              🌍 <strong>Proyecto público</strong> - Abierto para que toda la comunidad pueda participar
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Compromiso con la transparencia:</p>
            <ul className="space-y-1 text-xs">
              <li>• Tu proyecto será firmado criptográficamente con tu DID</li>
              <li>• El contenido se almacenará en IPFS para garantizar descentralización</li>
              <li>• El hash público permitirá verificar la autenticidad en cualquier momento</li>
              <li>• Los datos privados permanecen bajo tu control total</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;