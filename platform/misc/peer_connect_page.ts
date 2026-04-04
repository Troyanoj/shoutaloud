import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Shield, 
  Star, 
  BookOpen, 
  Heart,
  Filter,
  Send,
  UserCheck,
  Lock,
  FileText,
  Award,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  Globe,
  Building,
  Lightbulb,
  Leaf,
  Scale,
  Car,
  GraduationCap
} from 'lucide-react';

interface PeerProfile {
  id: string;
  anonymousName: string;
  specializations: Record<string, number>;
  availableFor: string[];
  description: string;
  contributionAreas: string[];
  resources: Resource[];
  isAvailable: boolean;
  responseRate: number;
  helpfulnessScore: number;
}

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'article' | 'guide';
  description: string;
  specialization: string;
}

interface Connection {
  id: string;
  peerId: string;
  peerName: string;
  specialization: string;
  status: 'pending' | 'active' | 'completed';
  lastMessage: string;
  createdAt: Date;
}

const SPECIALIZATION_AREAS = [
  { 
    id: 'governance', 
    label: 'Gobernanza y Transparencia', 
    icon: Building,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  { 
    id: 'environment', 
    label: 'Medio Ambiente', 
    icon: Leaf,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  { 
    id: 'education', 
    label: 'Educación y Cultura', 
    icon: GraduationCap,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  { 
    id: 'economy', 
    label: 'Economía Local', 
    icon: Globe,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  { 
    id: 'justice', 
    label: 'Justicia Social', 
    icon: Scale,
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  { 
    id: 'infrastructure', 
    label: 'Infraestructura', 
    icon: Car,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  { 
    id: 'innovation', 
    label: 'Innovación Cívica', 
    icon: Lightbulb,
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
];

const PeerConnectPage: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [availablePeers, setAvailablePeers] = useState<PeerProfile[]>([]);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<PeerProfile | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [isAvailableForConnect, setIsAvailableForConnect] = useState(false);
  const [mySpecializations, setMySpecializations] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'discover' | 'connections' | 'resources'>('discover');
  const [showCodeOfConduct, setShowCodeOfConduct] = useState(false);
  const [acceptedCode, setAcceptedCode] = useState(false);

  // Simular datos del usuario actual
  useEffect(() => {
    setMySpecializations({
      governance: 3,
      environment: 2,
      education: 4,
      economy: 1,
      justice: 2,
      infrastructure: 1,
      innovation: 3
    });

    // Simular peers disponibles
    setAvailablePeers([
      {
        id: '1',
        anonymousName: 'Ciudadano Verde',
        specializations: { environment: 5, innovation: 3 },
        availableFor: ['mentoria', 'colaboracion'],
        description: 'Experto en sostenibilidad urbana. Disponible para compartir estrategias de economía circular.',
        contributionAreas: ['Proyectos comunitarios', 'Educación ambiental'],
        resources: [
          {
            id: 'r1',
            title: 'Guía de Compostaje Urbano',
            type: 'pdf',
            description: 'Manual práctico para implementar compostaje en espacios reducidos',
            specialization: 'environment'
          }
        ],
        isAvailable: true,
        responseRate: 95,
        helpfulnessScore: 4.8
      },
      {
        id: '2',
        anonymousName: 'Educador Cívico',
        specializations: { education: 4, governance: 3 },
        availableFor: ['mentoria', 'recursos'],
        description: 'Pedagogo especializado en educación ciudadana. Comparto recursos y metodologías.',
        contributionAreas: ['Talleres ciudadanos', 'Materiales educativos'],
        resources: [],
        isAvailable: true,
        responseRate: 88,
        helpfulnessScore: 4.6
      },
      {
        id: '3',
        anonymousName: 'Innovador Local',
        specializations: { innovation: 5, economy: 4, governance: 2 },
        availableFor: ['colaboracion', 'proyectos'],
        description: 'Desarrollador de soluciones tecnológicas para comunidades. Busco colaboradores para proyectos de impacto social.',
        contributionAreas: ['Apps cívicas', 'Plataformas colaborativas'],
        resources: [
          {
            id: 'r2',
            title: 'Kit de Herramientas Digitales',
            type: 'link',
            description: 'Repositorio de herramientas open-source para organizaciones civiles',
            specialization: 'innovation'
          }
        ],
        isAvailable: true,
        responseRate: 92,
        helpfulnessScore: 4.9
      }
    ]);
  }, []);

  const getSpecializationLevel = (level: number): string => {
    if (level >= 4) return 'Experto';
    if (level >= 3) return 'Avanzado';
    if (level >= 2) return 'Intermedio';
    return 'Principiante';
  };

  const getSpecializationColor = (level: number): string => {
    if (level >= 4) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (level >= 3) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (level >= 2) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const handleConnectionRequest = () => {
    if (!acceptedCode) {
      setShowCodeOfConduct(true);
      return;
    }

    if (connectionMessage.trim().length < 20) {
      alert('Por favor, incluye un mensaje más detallado explicando cómo te gustaría colaborar.');
      return;
    }

    // Simular envío de solicitud
    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      peerId: selectedPeer!.id,
      peerName: selectedPeer!.anonymousName,
      specialization: selectedArea,
      status: 'pending',
      lastMessage: connectionMessage,
      createdAt: new Date()
    };

    setMyConnections([...myConnections, newConnection]);
    setShowConnectionModal(false);
    setConnectionMessage('');
    setSelectedPeer(null);

    alert('¡Solicitud enviada exitosamente! El ciudadano recibirá tu mensaje y podrá decidir si conectar contigo.');
  };

  const filteredPeers = selectedArea 
    ? availablePeers.filter(peer => 
        peer.specializations[selectedArea] && 
        peer.specializations[selectedArea] > (mySpecializations[selectedArea] || 0)
      )
    : availablePeers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conexión entre Pares</h1>
              <p className="text-gray-600">Colabora, aprende y comparte conocimiento cívico</p>
            </div>
          </div>

          {/* Mis Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{myConnections.length}</div>
              <div className="text-sm text-gray-600">Conexiones</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(mySpecializations).filter(level => level >= 3).length}
              </div>
              <div className="text-sm text-gray-600">Especializaciones</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">4.2</div>
              <div className="text-sm text-gray-600">Valoración</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-gray-600">Ayudas Brindadas</div>
            </div>
          </div>

          {/* Configuración de Disponibilidad */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Tu Disponibilidad</h3>
                  <p className="text-sm text-gray-600">
                    {isAvailableForConnect 
                      ? 'Disponible para nuevas conexiones' 
                      : 'No disponible actualmente'
                    }
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isAvailableForConnect}
                  onChange={(e) => setIsAvailableForConnect(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'discover', label: 'Descubrir Pares', icon: Users },
              { id: 'connections', label: 'Mis Conexiones', icon: MessageCircle },
              { id: 'resources', label: 'Recursos Compartidos', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab: Descubrir Pares */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* Filtro por Área */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Explorar por Especialización</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SPECIALIZATION_AREAS.map((area) => {
                  const Icon = area.icon;
                  const myLevel = mySpecializations[area.id] || 0;
                  return (
                    <button
                      key={area.id}
                      onClick={() => setSelectedArea(selectedArea === area.id ? '' : area.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedArea === area.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{area.label}</span>
                      </div>
                      <div className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getSpecializationColor(myLevel)}`}>
                        Tu nivel: {getSpecializationLevel(myLevel)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista de Pares Disponibles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedArea 
                    ? `Pares en ${SPECIALIZATION_AREAS.find(a => a.id === selectedArea)?.label}`
                    : 'Todos los Pares Disponibles'
                  }
                </h2>
                <span className="text-sm text-gray-500">{filteredPeers.length} disponibles</span>
              </div>

              {filteredPeers.map((peer) => (
                <div key={peer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {peer.anonymousName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{peer.anonymousName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">
                            {peer.helpfulnessScore}/5 • {peer.responseRate}% respuesta
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">Disponible</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{peer.description}</p>

                  {/* Especializaciones */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Especializaciones:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(peer.specializations).map(([spec, level]) => {
                        const area = SPECIALIZATION_AREAS.find(a => a.id === spec);
                        if (!area) return null;
                        return (
                          <div
                            key={spec}
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getSpecializationColor(level)}`}
                          >
                            {area.label} • {getSpecializationLevel(level)}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Áreas de Contribución */}
                  {peer.contributionAreas.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Contribuye en:</h4>
                      <div className="flex flex-wrap gap-2">
                        {peer.contributionAreas.map((area, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recursos Disponibles */}
                  {peer.resources.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recursos compartidos:</h4>
                      <div className="space-y-2">
                        {peer.resources.map((resource) => (
                          <div key={resource.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{resource.title}</span>
                              <p className="text-xs text-gray-600">{resource.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedPeer(peer);
                        setShowConnectionModal(true);
                      }}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Solicitar Conexión
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Ver Perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Mis Conexiones */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mis Conexiones Activas</h2>
              
              {myConnections.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aún no tienes conexiones activas.</p>
                  <p className="text-gray-500 text-sm">¡Explora la pestaña "Descubrir Pares" para comenzar!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myConnections.map((connection) => (
                    <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {connection.peerName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{connection.peerName}</h3>
                            <p className="text-sm text-gray-600">
                              {SPECIALIZATION_AREAS.find(a => a.id === connection.specialization)?.label}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            connection.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : connection.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {connection.status === 'active' ? 'Activa' : 
                             connection.status === 'pending' ? 'Pendiente' : 'Completada'}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>Último mensaje:</strong> {connection.lastMessage}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                          <MessageCircle className="w-4 h-4" />
                          Continuar Chat
                        </button>
                        <span className="text-xs text-gray-500">
                          Iniciado {connection.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Recursos Compartidos */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Biblioteca de Recursos Colaborativa</h2>
              <p className="text-gray-600 mb-6">
                Recursos compartidos por la comunidad de ciudadanos especializados
              </p>
              
              <div className="grid gap-4">
                {availablePeers.flatMap(peer => peer.resources).map((resource) => (
                  <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{resource.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            SPECIALIZATION_AREAS.find(a => a.id === resource.specialization)?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {SPECIALIZATION_AREAS.find(a => a.id === resource.specialization)?.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm">
                            <BookOpen className="w-4 h-4" />
                            Acceder
                          </button>
                          <button className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors text-sm">
                            <Heart className="w-4 h-4" />
                            Útil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Conexión */}
      {showConnectionModal && selectedPeer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Solicitar Conexión</h2>
                <button
                  onClick={() => setShowConnectionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {selectedPeer.anonymousName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedPeer.anonymousName}</h3>
                  <p className="text-sm text-gray-600">{selectedPeer.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje de presentación
                  </label>
                  <textarea
                    value={connectionMessage}
                    onChange={(e) => setConnectionMessage(e.target.value)}
                    placeholder="Hola, me interesa conectar contigo porque... ¿Podrías ayudarme con...? Mi experiencia en... podría ser útil para..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 20 caracteres. Sé específico sobre cómo quieres colaborar.
                  </p>
                </div>

                {!acceptedCode && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800 mb-1">Código de Conducta Cívica</h4>
                        <p className="text-sm text-amber-700 mb-3">
                          Antes de conectar, debes aceptar nuestro compromiso de respeto y colaboración constructiva.
                        </p>
                        <button
                          onClick={() => setShowCodeOfConduct(true)}
                          className="text-sm text-amber-800 underline hover:text-amber-900"
                        >
                          Leer y aceptar código de conducta
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConnectionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConnectionRequest}
                    disabled={!acceptedCode || connectionMessage.length < 20}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Solicitud
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Código de Conducta */}
      {showCodeOfConduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Código de Conducta Cívica</h2>
                <button
                  onClick={() => setShowCodeOfConduct(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Respeto y Dignidad</h3>
                    <p className="text-gray-700 text-sm">
                      Tratamos a todos los ciudadanos con respeto, independientemente de sus ideas, experiencia o trasfondo. 
                      No toleramos discriminación, acoso o lenguaje ofensivo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Colaboración Constructiva</h3>
                    <p className="text-gray-700 text-sm">
                      Nos enfocamos en colaborar para el bien común. Compartimos conocimiento generosamente y 
                      buscamos soluciones que beneficien a la comunidad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Lock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Privacidad y Confianza</h3>
                    <p className="text-gray-700 text-sm">
                      Respetamos la privacidad de otros ciudadanos. No compartimos información personal 
                      sin consentimiento explícito ni usamos las conexiones para fines comerciales o partidistas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Transparencia en Intenciones</h3>
                    <p className="text-gray-700 text-sm">
                      Somos claros sobre nuestras intenciones de colaboración. No usamos las conexiones 
                      para promoción personal, spam o actividades que no sean de interés cívico genuino.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Consecuencias</h3>
                    <p className="text-gray-700 text-sm">
                      El incumplimiento de este código puede resultar en la restricción de conexiones 
                      y la suspensión de la cuenta. Reportamos comportamientos inapropiados para mantener 
                      un ambiente seguro y constructivo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Compromiso Personal</h4>
                </div>
                <p className="text-sm text-blue-800">
                  Al aceptar este código, me comprometo a participar en Shout Aloud con integridad, 
                  respeto y enfoque en el bienestar colectivo de mi comunidad.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCodeOfConduct(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Revisar Más Tarde
                </button>
                <button
                  onClick={() => {
                    setAcceptedCode(true);
                    setShowCodeOfConduct(false);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Acepto y Me Comprometo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer con Principios Éticos */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Privacidad Garantizada</h3>
              <p className="text-sm text-gray-600">
                Sin algoritmos invasivos. Tus datos permanecen privados y las conexiones son voluntarias.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Colaboración Genuina</h3>
              <p className="text-sm text-gray-600">
                Enfocado en aprendizaje mutuo y construcción comunitaria, no en networking comercial.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Empoderamiento Ciudadano</h3>
              <p className="text-sm text-gray-600">
                Fortalecemos la capacidad colectiva sin depender de estructuras centralizadas.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <strong>Shout Aloud</strong> • Conectando ciudadanos para construir comunidad soberana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerConnectPage;