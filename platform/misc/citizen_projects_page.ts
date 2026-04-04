import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Users, 
  MapPin, 
  Clock, 
  Target, 
  Shield,
  Hash,
  Lightbulb,
  Heart,
  Zap,
  ChevronRight,
  Star,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';

// Interfaces para tipado TypeScript
interface CitizenProfile {
  did: string;
  name: string;
  specialization: string;
  reputation: number;
  isPublic: boolean;
}

interface ProjectPhase {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  description: string;
}

interface CitizenProject {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  objectives: string[];
  creator: CitizenProfile;
  participants: CitizenProfile[];
  municipality: string;
  phase: ProjectPhase;
  status: 'open' | 'closed' | 'private';
  visibility: 'public' | 'private' | 'community';
  createdAt: Date;
  updatedAt: Date;
  requiredReputation: number;
  ipfsHash?: string;
  tags: string[];
  maxParticipants?: number;
  expectedImpact: string;
}

interface FilterState {
  category: string;
  municipality: string;
  status: string;
  phase: string;
}

const CitizenProjectsPage: React.FC = () => {
  // Estados principales
  const [projects, setProjects] = useState<CitizenProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<CitizenProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    municipality: '',
    status: '',
    phase: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CitizenProject | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  // Datos mock para demostración
  const mockProjects: CitizenProject[] = [
    {
      id: '1',
      title: 'Red de Compostaje Comunitario',
      category: 'Medio Ambiente',
      summary: 'Crear una red descentralizada de puntos de compostaje en barrios',
      description: 'Iniciativa para establecer puntos de compostaje comunitario que reduzcan residuos orgánicos y generen abono para huertos urbanos.',
      objectives: [
        'Reducir 40% de residuos orgánicos del barrio',
        'Crear 5 puntos de compostaje en 6 meses',
        'Formar 50 familias en técnicas de compostaje'
      ],
      creator: {
        did: 'did:peer:creator1',
        name: 'María González',
        specialization: 'Agricultura Sostenible',
        reputation: 85,
        isPublic: true
      },
      participants: [
        {
          did: 'did:peer:part1',
          name: 'Carlos Ruiz',
          specialization: 'Ingeniería Ambiental',
          reputation: 78,
          isPublic: true
        }
      ],
      municipality: 'Barcelona',
      phase: {
        id: 'planning',
        name: 'Planificación',
        status: 'active',
        description: 'Definiendo ubicaciones y recursos necesarios'
      },
      status: 'open',
      visibility: 'public',
      createdAt: new Date('2025-06-01'),
      updatedAt: new Date('2025-06-15'),
      requiredReputation: 50,
      ipfsHash: 'QmX7Y8Z9...',
      tags: ['compostaje', 'residuos', 'sostenibilidad'],
      maxParticipants: 20,
      expectedImpact: 'Reducción significativa de residuos orgánicos y fortalecimiento de la comunidad'
    },
    {
      id: '2',
      title: 'Plataforma de Intercambio de Habilidades',
      category: 'Tecnología Social',
      summary: 'Sistema P2P para intercambiar conocimientos y servicios entre vecinos',
      description: 'Desarrollo de una plataforma descentralizada donde ciudadanos puedan intercambiar habilidades, conocimientos y servicios sin intermediarios monetarios.',
      objectives: [
        'Conectar 200 ciudadanos en la primera fase',
        'Facilitar 100 intercambios exitosos en 3 meses',
        'Crear sistema de reputación transparente'
      ],
      creator: {
        did: 'did:peer:creator2',
        name: 'Luis Morales',
        specialization: 'Desarrollo de Software',
        reputation: 92,
        isPublic: true
      },
      participants: [
        {
          did: 'did:peer:part2',
          name: 'Ana Jiménez',
          specialization: 'Diseño UX/UI',
          reputation: 88,
          isPublic: true
        },
        {
          did: 'did:peer:part3',
          name: 'Pedro Sánchez',
          specialization: 'Blockchain',
          reputation: 81,
          isPublic: false
        }
      ],
      municipality: 'Madrid',
      phase: {
        id: 'execution',
        name: 'Ejecución',
        status: 'active',
        description: 'Desarrollando MVP de la plataforma'
      },
      status: 'open',
      visibility: 'public',
      createdAt: new Date('2025-05-15'),
      updatedAt: new Date('2025-06-18'),
      requiredReputation: 60,
      ipfsHash: 'QmA1B2C3...',
      tags: ['tecnología', 'p2p', 'intercambio', 'comunidad'],
      maxParticipants: 15,
      expectedImpact: 'Fortalecimiento de redes comunitarias y economía colaborativa'
    },
    {
      id: '3',
      title: 'Observatorio Ciudadano de Calidad del Aire',
      category: 'Salud Pública',
      summary: 'Red de sensores ciudadanos para monitorear la calidad del aire',
      description: 'Instalación y mantenimiento de una red de sensores de bajo costo para monitorear la calidad del aire en tiempo real.',
      objectives: [
        'Instalar 30 sensores en puntos estratégicos',
        'Crear dashboard público de datos',
        'Generar informes mensuales para la comunidad'
      ],
      creator: {
        did: 'did:peer:creator3',
        name: 'Elena Vázquez',
        specialization: 'Ciencias Ambientales',
        reputation: 79,
        isPublic: true
      },
      participants: [],
      municipality: 'Valencia',
      phase: {
        id: 'proposal',
        name: 'Propuesta',
        status: 'pending',
        description: 'Buscando colaboradores y definiendo alcance'
      },
      status: 'open',
      visibility: 'public',
      createdAt: new Date('2025-06-10'),
      updatedAt: new Date('2025-06-10'),
      requiredReputation: 40,
      tags: ['salud', 'medio ambiente', 'datos abiertos'],
      maxParticipants: 25,
      expectedImpact: 'Mayor conciencia ambiental y datos para políticas públicas'
    }
  ];

  // Categorías disponibles
  const categories = [
    'Medio Ambiente',
    'Tecnología Social',
    'Salud Pública',
    'Educación',
    'Cultura',
    'Economía Colaborativa',
    'Movilidad Sostenible',
    'Participación Ciudadana'
  ];

  // Fases de proyecto
  const projectPhases = [
    { id: 'proposal', name: 'Propuesta', icon: Lightbulb },
    { id: 'planning', name: 'Planificación', icon: Target },
    { id: 'execution', name: 'Ejecución', icon: Zap },
    { id: 'evaluation', name: 'Evaluación', icon: CheckCircle2 }
  ];

  // Cargar proyectos al montar el componente
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
      setLoading(false);
    };

    loadProjects();
  }, []);

  // Aplicar filtros y búsqueda
  useEffect(() => {
    let filtered = projects;

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtros por categoría
    if (filters.category) {
      filtered = filtered.filter(project => project.category === filters.category);
    }

    // Filtros por municipio
    if (filters.municipality) {
      filtered = filtered.filter(project => project.municipality === filters.municipality);
    }

    // Filtros por estado
    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    // Filtros por fase
    if (filters.phase) {
      filtered = filtered.filter(project => project.phase.id === filters.phase);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, filters, projects]);

  // Obtener municipios únicos
  const municipalities = Array.from(new Set(projects.map(p => p.municipality)));

  // Manejar cambio de filtros
  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      category: '',
      municipality: '',
      status: '',
      phase: ''
    });
    setSearchTerm('');
  };

  // Obtener color de fase
  const getPhaseColor = (phaseId: string) => {
    const colors = {
      proposal: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      planning: 'bg-blue-100 text-blue-800 border-blue-200',
      execution: 'bg-green-100 text-green-800 border-green-200',
      evaluation: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[phaseId as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Obtener color de estado
  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
      private: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Renderizar tarjeta de proyecto
  const ProjectCard: React.FC<{ project: CitizenProject }> = ({ project }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.title}
          </h3>
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
            {project.category}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
            {project.status === 'open' ? 'Abierto' : project.status === 'closed' ? 'Cerrado' : 'Privado'}
          </span>
          {project.ipfsHash && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Hash className="w-3 h-3" />
              <span>IPFS</span>
            </div>
          )}
        </div>
      </div>

      {/* Resumen */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {project.summary}
      </p>

      {/* Fase actual */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getPhaseColor(project.phase.id)} mb-4`}>
        {React.createElement(
          projectPhases.find(p => p.id === project.phase.id)?.icon || Lightbulb,
          { className: "w-4 h-4" }
        )}
        <span>{project.phase.name}</span>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{project.municipality}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{project.participants.length}</span>
            {project.maxParticipants && (
              <span>/ {project.maxParticipants}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{project.createdAt.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {project.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            #{tag}
          </span>
        ))}
        {project.tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
            +{project.tags.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">
              {project.creator.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{project.creator.name}</p>
            <p className="text-xs text-gray-500">{project.creator.specialization}</p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs text-gray-600">{project.creator.reputation}</span>
          </div>
        </div>
        <button
          onClick={() => setSelectedProject(project)}
          className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <span className="text-sm">Ver más</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                Proyectos Colaborativos Ciudadanos
              </h1>
              <p className="text-gray-600 mt-2">
                Conecta tu especialización con iniciativas que transforman tu comunidad
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Proyecto
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-sm text-gray-600">Proyectos Activos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((acc, p) => acc + p.participants.length + 1, 0)}
                </p>
                <p className="text-sm text-gray-600">Colaboradores</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{municipalities.length}</p>
                <p className="text-sm text-gray-600">Municipios</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                <p className="text-sm text-gray-600">Categorías</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar proyectos, tags, o palabras clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filters.municipality}
                onChange={(e) => handleFilterChange('municipality', e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los municipios</option>
                {municipalities.map(municipality => (
                  <option key={municipality} value={municipality}>{municipality}</option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="open">Abiertos</option>
                <option value="closed">Cerrados</option>
                <option value="private">Privados</option>
              </select>

              <select
                value={filters.phase}
                onChange={(e) => handleFilterChange('phase', e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las fases</option>
                {projectPhases.map(phase => (
                  <option key={phase.id} value={phase.id}>{phase.name}</option>
                ))}
              </select>

              {(searchTerm || Object.values(filters).some(f => f)) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Filtros activos */}
          {Object.entries(filters).some(([_, value]) => value) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">Filtros activos:</span>
              {Object.entries(filters).map(([key, value]) => value && (
                <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {key}: {value}
                  <button
                    onClick={() => handleFilterChange(key as keyof FilterState, '')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Resultados */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
            </h2>
            {searchTerm && (
              <p className="text-sm text-gray-600">
                Resultados para "{searchTerm}"
              </p>
            )}
          </div>
          
          {/* Selector de vista */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <div className="w-4 h-4 border border-gray-400 rounded"></div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <div className="flex flex-col gap-1">
                <div className="w-4 h-1 bg-gray-400 rounded"></div>
                <div className="w-4 h-1 bg-gray-400 rounded"></div>
                <div className="w-4 h-1 bg-gray-400 rounded"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Grid de proyectos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron proyectos
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta ajustar tus filtros o crear un nuevo proyecto
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear el primer proyecto
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Modales placeholders */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Proyecto</h3>
            <p className="text-gray-600 mb-6">
              Modal de creación de proyecto (próximo componente a desarrollar)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header del detalle */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedProject.title}
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {selectedProject.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status === 'open' ? 'Abierto' : selectedProject.status === 'closed' ? 'Cerrado' : 'Privado'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedProject.municipality}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Creado el {selectedProject.createdAt.toLocaleDateString()}</span>
                  </div>
                  {selectedProject.ipfsHash && (
                    <div className="flex items-center gap-1">
                      <Hash className="w-4 h-4" />
                      <span className="font-mono text-xs">{selectedProject.ipfsHash.slice(0, 12)}...</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ×
              </button>
            </div>

            {/* Fase actual */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getPhaseColor(selectedProject.phase.id)} mb-6`}>
              {React.createElement(
                projectPhases.find(p => p.id === selectedProject.phase.id)?.icon || Lightbulb,
                { className: "w-5 h-5" }
              )}
              <div>
                <span className="font-medium">{selectedProject.phase.name}</span>
                <p className="text-xs opacity-75">{selectedProject.phase.description}</p>
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Descripción del Proyecto</h4>
              <p className="text-gray-700 leading-relaxed">
                {selectedProject.description}
              </p>
            </div>

            {/* Objetivos */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Objetivos</h4>
              <ul className="space-y-2">
                {selectedProject.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <Target className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Impacto esperado */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Impacto Esperado</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-green-800">{selectedProject.expectedImpact}</p>
                </div>
              </div>
            </div>

            {/* Creador */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Creador del Proyecto</h4>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {selectedProject.creator.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selectedProject.creator.name}</p>
                  <p className="text-sm text-gray-600">{selectedProject.creator.specialization}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">Reputación: {selectedProject.creator.reputation}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-mono">
                    {selectedProject.creator.did.slice(0, 20)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Participantes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  Colaboradores ({selectedProject.participants.length}
                  {selectedProject.maxParticipants && `/${selectedProject.maxParticipants}`})
                </h4>
                {selectedProject.requiredReputation > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span>Reputación mín: {selectedProject.requiredReputation}</span>
                  </div>
                )}
              </div>
              
              {selectedProject.participants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Aún no hay colaboradores</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    ¡Sé el primero en unirte!
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProject.participants.map((participant, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium">
                          {participant.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {participant.isPublic ? participant.name : 'Perfil Privado'}
                        </p>
                        <p className="text-sm text-gray-600">{participant.specialization}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{participant.reputation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Etiquetas</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProject.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedProject(null)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              {selectedProject.status === 'open' && (
                <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Unirse al Proyecto
                </button>
              )}
              <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenProjectsPage;
            