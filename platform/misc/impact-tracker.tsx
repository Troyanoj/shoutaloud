import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  FileText, 
  Image, 
  ExternalLink,
  Users,
  MapPin,
  TrendingUp,
  MessageSquare,
  Share2,
  Clock,
  Award,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Tipos principales
interface User {
  id: string;
  name: string;
  did: string;
  reputation: number;
  location?: string;
}

interface Evidence {
  id: string;
  type: 'document' | 'image' | 'link';
  title: string;
  ipfsHash: string;
  uploadedBy: string;
  uploadDate: string;
  validations: number;
  description?: string;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  selfReportedProgress: number;
  validatedProgress: number;
  evidences: Evidence[];
  validations: {
    positive: number;
    warning: number;
    negative: number;
    userVotes: { [userId: string]: 'positive' | 'warning' | 'negative' };
    comments: Array<{
      id: string;
      userId: string;
      userName: string;
      content: string;
      timestamp: string;
      reputation: number;
    }>;
  };
}

interface ProjectImpact {
  projectId: string;
  projectTitle: string;
  objectives: Objective[];
  globalMetrics: {
    totalValidations: number;
    participationByRegion: { [region: string]: number };
    communityTrust: number;
    completionRate: number;
  };
  timeline: Array<{
    date: string;
    milestone: string;
    evidence?: string;
  }>;
}

interface ImpactTrackerProps {
  projectId: string;
  currentUser: User;
  canValidate: boolean;
}

const ImpactTracker: React.FC<ImpactTrackerProps> = ({ projectId, currentUser, canValidate }) => {
  const [impactData, setImpactData] = useState<ProjectImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [expandedObjectives, setExpandedObjectives] = useState<{ [key: string]: boolean }>({});
  const [validationModal, setValidationModal] = useState<{ objectiveId: string; show: boolean }>({ objectiveId: '', show: false });
  const [validationForm, setValidationForm] = useState({
    type: 'positive' as 'positive' | 'warning' | 'negative',
    comment: '',
    hasReadProject: false
  });

  // Datos simulados (en implementación real vendría de IPFS/blockchain)
  useEffect(() => {
    setTimeout(() => {
      setImpactData({
        projectId: projectId,
        projectTitle: "Huertos Comunitarios Descentralizados",
        objectives: [
          {
            id: "obj1",
            title: "Establecer 5 huertos comunitarios",
            description: "Crear espacios de cultivo urbano en diferentes barrios",
            selfReportedProgress: 80,
            validatedProgress: 60,
            evidences: [
              {
                id: "ev1",
                type: "image",
                title: "Huerto Barrio Centro - Mes 3",
                ipfsHash: "QmX...",
                uploadedBy: "Ana García",
                uploadDate: "2025-05-15",
                validations: 12,
                description: "Fotografías del progreso del huerto en el Barrio Centro"
              },
              {
                id: "ev2",
                type: "document",
                title: "Acta de Entrega Huerto Norte",
                ipfsHash: "QmY...",
                uploadedBy: "Carlos Mendez",
                uploadDate: "2025-04-20",
                validations: 8
              }
            ],
            validations: {
              positive: 15,
              warning: 3,
              negative: 1,
              userVotes: {},
              comments: [
                {
                  id: "c1",
                  userId: "user123",
                  userName: "María López",
                  content: "He visitado 3 de los huertos mencionados. El progreso es real pero más lento de lo reportado. Falta más participación vecinal.",
                  timestamp: "2025-06-10",
                  reputation: 85
                }
              ]
            }
          },
          {
            id: "obj2",
            title: "Capacitar 100 personas en agricultura urbana",
            description: "Talleres teórico-prácticos sobre cultivo sostenible",
            selfReportedProgress: 95,
            validatedProgress: 85,
            evidences: [
              {
                id: "ev3",
                type: "document",
                title: "Lista de Asistencia - Talleres Mayo",
                ipfsHash: "QmZ...",
                uploadedBy: "Elena Ruiz",
                uploadDate: "2025-05-30",
                validations: 18
              }
            ],
            validations: {
              positive: 22,
              warning: 2,
              negative: 0,
              userVotes: {},
              comments: []
            }
          }
        ],
        globalMetrics: {
          totalValidations: 61,
          participationByRegion: {
            "Centro": 25,
            "Norte": 18,
            "Sur": 12,
            "Este": 6
          },
          communityTrust: 78,
          completionRate: 72
        },
        timeline: [
          { date: "2025-03-15", milestone: "Inicio del proyecto", evidence: "ev_init" },
          { date: "2025-04-20", milestone: "Primer huerto establecido", evidence: "ev1" },
          { date: "2025-05-30", milestone: "Primer ciclo de talleres completado", evidence: "ev3" }
        ]
      });
      setLoading(false);
    }, 800);
  }, [projectId]);

  const getValidationIcon = (positive: number, warning: number, negative: number) => {
    const total = positive + warning + negative;
    if (total === 0) return <Clock className="w-4 h-4 text-gray-400" />;
    
    const ratio = positive / total;
    if (ratio >= 0.7) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (ratio >= 0.4) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getMotivationalMessage = (trust: number) => {
    if (trust >= 80) return "🌟 ¡La comunidad confía plenamente en este proyecto!";
    if (trust >= 60) return "🌱 Buen progreso, la comunidad valora el esfuerzo";
    if (trust >= 40) return "⚡ Hay espacio para mejorar la transparencia";
    return "🔍 La comunidad necesita más evidencias para confiar";
  };

  const handleValidation = async (objectiveId: string) => {
    if (!impactData || !canValidate || !validationForm.hasReadProject) return;
    
    // Simulación de validación (en implementación real se enviaría a blockchain)
    const updatedData = { ...impactData };
    const objective = updatedData.objectives.find(obj => obj.id === objectiveId);
    
    if (objective) {
      // Actualizar votos
      objective.validations[validationForm.type]++;
      objective.validations.userVotes[currentUser.id] = validationForm.type;
      
      // Agregar comentario si existe
      if (validationForm.comment.trim()) {
        objective.validations.comments.push({
          id: `c_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          content: validationForm.comment.trim(),
          timestamp: new Date().toISOString(),
          reputation: currentUser.reputation
        });
      }
      
      setImpactData(updatedData);
    }
    
    // Resetear form
    setValidationForm({
      type: 'positive',
      comment: '',
      hasReadProject: false
    });
    setValidationModal({ objectiveId: '', show: false });
  };

  const toggleObjectiveExpansion = (objectiveId: string) => {
    setExpandedObjectives(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!impactData) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin datos de impacto</h3>
          <p>Este proyecto aún no ha reportado resultados verificables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header con métricas globales */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Auditoría Ciudadana de Impacto
            </h2>
            <h3 className="text-lg text-gray-600">{impactData.projectTitle}</h3>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
            <Share2 className="w-4 h-4" />
            <span>Compartir Resultados</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{impactData.globalMetrics.totalValidations}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center mt-1">
              <Users className="w-4 h-4 mr-1" />
              Validaciones Ciudadanas
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{impactData.globalMetrics.communityTrust}%</div>
            <div className="text-sm text-gray-500 flex items-center justify-center mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              Confianza Comunitaria
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{impactData.globalMetrics.completionRate}%</div>
            <div className="text-sm text-gray-500 flex items-center justify-center mt-1">
              <Award className="w-4 h-4 mr-1" />
              Avance Validado
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {Object.keys(impactData.globalMetrics.participationByRegion).length}
            </div>
            <div className="text-sm text-gray-500 flex items-center justify-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              Zonas Participantes
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <p className="text-center font-medium text-gray-700">
            {getMotivationalMessage(impactData.globalMetrics.communityTrust)}
          </p>
        </div>
      </div>

      {/* Matrix de Objetivos vs Resultados */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
          Matriz de Objetivos vs Resultados
        </h3>
        
        {impactData.objectives.map((objective) => (
          <div key={objective.id} className="bg-white rounded-xl shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{objective.title}</h4>
                  <p className="text-gray-600 text-sm">{objective.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  {getValidationIcon(
                    objective.validations.positive,
                    objective.validations.warning,
                    objective.validations.negative
                  )}
                  <button
                    onClick={() => toggleObjectiveExpansion(objective.id)}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {expandedObjectives[objective.id] ? 
                      <ChevronUp className="w-5 h-5" /> : 
                      <ChevronDown className="w-5 h-5" />
                    }
                  </button>
                </div>
              </div>
              
              {/* Barras de progreso */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Auto-reportado</span>
                    <span className="font-medium">{objective.selfReportedProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${objective.selfReportedProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Validado por Comunidad</span>
                    <span className="font-medium">{objective.validatedProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${objective.validatedProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Validaciones ciudadanas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{objective.validations.positive}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{objective.validations.warning}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">{objective.validations.negative}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedEvidence(objective.evidences[0])}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{objective.evidences.length} Evidencias</span>
                  </button>
                  
                  {canValidate && !objective.validations.userVotes[currentUser.id] && (
                    <button
                      onClick={() => setValidationModal({ objectiveId: objective.id, show: true })}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Validar
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sección expandida */}
            {expandedObjectives[objective.id] && (
              <div className="border-t p-6 bg-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Evidencias */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Evidencias Verificables</h5>
                    <div className="space-y-2">
                      {objective.evidences.map((evidence) => (
                        <div key={evidence.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3">
                            {evidence.type === 'image' ? <Image className="w-4 h-4 text-blue-500" /> : 
                             evidence.type === 'document' ? <FileText className="w-4 h-4 text-green-500" /> :
                             <ExternalLink className="w-4 h-4 text-purple-500" />}
                            <div>
                              <div className="font-medium text-sm">{evidence.title}</div>
                              <div className="text-xs text-gray-500">
                                Por {evidence.uploadedBy} • {evidence.uploadDate}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedEvidence(evidence)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Ver
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Comentarios */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Comentarios de Validación</h5>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {objective.validations.comments.length > 0 ? (
                        objective.validations.comments.map((comment) => (
                          <div key={comment.id} className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{comment.userName}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Rep: {comment.reputation}</span>
                                <span className="text-xs text-gray-400">{comment.timestamp.split('T')[0]}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">Sin comentarios aún</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de evidencia */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedEvidence.title}</h3>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Subido por: {selectedEvidence.uploadedBy}</span>
                  <span>Fecha: {selectedEvidence.uploadDate}</span>
                  <span>{selectedEvidence.validations} validaciones</span>
                </div>
                
                {selectedEvidence.description && (
                  <p className="text-gray-700">{selectedEvidence.description}</p>
                )}
                
                <div className="p-8 bg-gray-50 rounded-lg text-center">
                  {selectedEvidence.type === 'image' ? (
                    <div>
                      <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Vista previa de imagen</p>
                      <p className="text-xs text-gray-500 mt-2">IPFS: {selectedEvidence.ipfsHash}</p>
                    </div>
                  ) : selectedEvidence.type === 'document' ? (
                    <div>
                      <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Documento PDF</p>
                      <p className="text-xs text-gray-500 mt-2">IPFS: {selectedEvidence.ipfsHash}</p>
                    </div>
                  ) : (
                    <div>
                      <ExternalLink className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Enlace externo</p>
                      <p className="text-xs text-gray-500 mt-2">IPFS: {selectedEvidence.ipfsHash}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Abrir en IPFS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validación */}
      {validationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Validar Objetivo</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Info className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Tu validación será pública y firmada con tu identidad descentralizada
                  </p>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={validationForm.hasReadProject}
                      onChange={(e) => setValidationForm(prev => ({ ...prev, hasReadProject: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">He leído el resumen del proyecto y las evidencias</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Tu validación:</label>
                  <div className="space-y-2">
                    {[
                      { value: 'positive', label: 'Validado ✅', desc: 'Las evidencias confirman el progreso' },
                      { value: 'warning', label: 'Con reservas ⚠️', desc: 'Progreso parcial o necesita mejoras' },
                      { value: 'negative', label: 'No validado ❌', desc: 'Evidencias insuficientes o inconsistentes' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="validation"
                          value={option.value}
                          checked={validationForm.type === option.value}
                          onChange={(e) => setValidationForm(prev => ({ ...prev, type: e.target.value as any }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-sm">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Comentario reflexivo (opcional, mín. 20 caracteres):
                  </label>
                  <textarea
                    value={validationForm.comment}
                    onChange={(e) => setValidationForm(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                    placeholder="Comparte tu perspectiva constructiva sobre este objetivo..."
                  />
                  {validationForm.comment.length > 0 && validationForm.comment.length < 20 && (
                    <p className="text-xs text-red-500 mt-1">
                      Mínimo 20 caracteres ({validationForm.comment.length}/20)
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setValidationModal({ objectiveId: '', show: false })}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleValidation(validationModal.objectiveId)}
                    disabled={!validationForm.hasReadProject || (validationForm.comment.length > 0 && validationForm.comment.length < 20)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Emitir Validación
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactTracker;