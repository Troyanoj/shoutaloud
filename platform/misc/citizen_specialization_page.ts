import React, { useState, useEffect } from 'react';
import { 
  User, 
  BookOpen, 
  Heart, 
  Leaf, 
  Car, 
  Scale, 
  DollarSign, 
  Users, 
  Award, 
  Download, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  MessageCircle, 
  ThumbsUp, 
  FileText,
  Info,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { PolarArea, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement
);

interface SpecializationArea {
  id: string;
  name: string;
  icon: React.ReactNode;
  level: number;
  maxLevel: number;
  contributions: {
    proposals: number;
    support: number;
    moderation: number;
    comments: number;
  };
  badge?: {
    name: string;
    icon: string;
    description: string;
  };
  motivationalMessage: string;
  color: string;
}

interface CitizenSpecializationData {
  userId: string;
  username: string;
  totalContributions: number;
  areas: SpecializationArea[];
  publicVisibility: {
    showBadges: boolean;
    showSpecializations: boolean;
  };
}

const CitizenSpecializationPage: React.FC = () => {
  const [data, setData] = useState<CitizenSpecializationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Simulación de datos (en producción vendría de API)
  useEffect(() => {
    const fetchSpecializationData = async () => {
      setLoading(true);
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: CitizenSpecializationData = {
        userId: 'user-123',
        username: 'María González',
        totalContributions: 127,
        publicVisibility: {
          showBadges: true,
          showSpecializations: false
        },
        areas: [
          {
            id: 'education',
            name: 'Educación',
            icon: <BookOpen className="w-5 h-5" />,
            level: 8,
            maxLevel: 10,
            contributions: {
              proposals: 12,
              support: 45,
              moderation: 8,
              comments: 23
            },
            badge: {
              name: 'Experta en Educación',
              icon: '🎓',
              description: 'Ha contribuido significativamente al desarrollo educativo comunitario'
            },
            motivationalMessage: 'Tu voz ha ayudado a transformar la conversación sobre educación en nuestra comunidad',
            color: '#3B82F6'
          },
          {
            id: 'health',
            name: 'Salud',
            icon: <Heart className="w-5 h-5" />,
            level: 6,
            maxLevel: 10,
            contributions: {
              proposals: 8,
              support: 32,
              moderation: 4,
              comments: 18
            },
            motivationalMessage: 'Tus aportes han enriquecido el diálogo sobre bienestar comunitario',
            color: '#EF4444'
          },
          {
            id: 'environment',
            name: 'Medioambiente',
            icon: <Leaf className="w-5 h-5" />,
            level: 9,
            maxLevel: 10,
            contributions: {
              proposals: 15,
              support: 38,
              moderation: 12,
              comments: 31
            },
            badge: {
              name: 'Guardiana Verde',
              icon: '🌱',
              description: 'Líder en iniciativas ambientales y sostenibilidad'
            },
            motivationalMessage: 'Tu compromiso ambiental está creando un impacto positivo duradero',
            color: '#22C55E'
          },
          {
            id: 'transport',
            name: 'Transporte',
            icon: <Car className="w-5 h-5" />,
            level: 3,
            maxLevel: 10,
            contributions: {
              proposals: 2,
              support: 12,
              moderation: 1,
              comments: 8
            },
            motivationalMessage: 'Tu perspectiva sobre movilidad urbana es valiosa para nuestra ciudad',
            color: '#F59E0B'
          },
          {
            id: 'justice',
            name: 'Justicia',
            icon: <Scale className="w-5 h-5" />,
            level: 4,
            maxLevel: 10,
            contributions: {
              proposals: 3,
              support: 18,
              moderation: 2,
              comments: 12
            },
            motivationalMessage: 'Contribuyes a fortalecer la justicia y equidad en nuestra comunidad',
            color: '#8B5CF6'
          },
          {
            id: 'economy',
            name: 'Economía Local',
            icon: <DollarSign className="w-5 h-5" />,
            level: 2,
            maxLevel: 10,
            contributions: {
              proposals: 1,
              support: 8,
              moderation: 0,
              comments: 4
            },
            motivationalMessage: 'Tu visión económica aporta valor al desarrollo local',
            color: '#06B6D4'
          },
          {
            id: 'culture',
            name: 'Cultura y Comunidad',
            icon: <Users className="w-5 h-5" />,
            level: 5,
            maxLevel: 10,
            contributions: {
              proposals: 6,
              support: 22,
              moderation: 3,
              comments: 15
            },
            motivationalMessage: 'Ayudas a tejer los lazos culturales que nos unen como comunidad',
            color: '#EC4899'
          }
        ]
      };

      setData(mockData);
      setLoading(false);
    };

    fetchSpecializationData();
  }, []);

  const toggleVisibility = (type: 'badges' | 'specializations') => {
    if (!data) return;
    
    setData({
      ...data,
      publicVisibility: {
        ...data.publicVisibility,
        [type === 'badges' ? 'showBadges' : 'showSpecializations']: 
          !data.publicVisibility[type === 'badges' ? 'showBadges' : 'showSpecializations']
      }
    });
  };

  const getRadarData = () => {
    if (!data) return null;

    return {
      labels: data.areas.map(area => area.name),
      datasets: [
        {
          label: 'Nivel de Especialización',
          data: data.areas.map(area => area.level),
          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#3B82F6',
        },
      ],
    };
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const areaIndex = context.dataIndex;
            const area = data?.areas[areaIndex];
            if (!area) return '';
            
            return [
              `Nivel: ${area.level}/${area.maxLevel}`,
              `Propuestas: ${area.contributions.proposals}`,
              `Apoyos: ${area.contributions.support}`,
              `Comentarios: ${area.contributions.comments}`
            ];
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 2,
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
        },
        grid: {
          color: isDarkMode ? '#374151' : '#E5E7EB',
        },
        angleLines: {
          color: isDarkMode ? '#374151' : '#E5E7EB',
        },
        pointLabels: {
          color: isDarkMode ? '#F3F4F6' : '#1F2937',
          font: {
            size: 12,
          }
        }
      },
    },
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Error al cargar datos</h2>
          <p>No se pudieron cargar tus datos de especialización.</p>
        </div>
      </div>
    );
  }

  const badges = data.areas.filter(area => area.badge);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tu Especialización Ciudadana</h1>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Descubre y desarrolla tus fortalezas temáticas
              </p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'overview', name: 'Resumen', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'areas', name: 'Por Áreas', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'badges', name: 'Logros', icon: <Award className="w-4 h-4" /> },
            { id: 'settings', name: 'Visibilidad', icon: <Eye className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Contribuciones
                    </p>
                    <p className="text-2xl font-bold">{data.totalContributions}</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Medallas Obtenidas
                    </p>
                    <p className="text-2xl font-bold">{badges.length}</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Áreas Activas
                    </p>
                    <p className="text-2xl font-bold">
                      {data.areas.filter(area => area.level > 0).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            <div className={`p-6 rounded-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
              <h3 className="text-xl font-semibold mb-6">Mapa de Especialización</h3>
              <div className="relative h-96">
                <Radar data={getRadarData()!} options={radarOptions} />
              </div>
              <div className={`mt-4 p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Recuerda:</span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  No tienes que saber de todo. Es valioso que participes donde más te importa. 
                  Tu especialización crece naturalmente con tus contribuciones.
                </p>
              </div>
            </div>

            {/* Top Areas */}
            <div className={`p-6 rounded-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
              <h3 className="text-xl font-semibold mb-6">Tus Áreas Más Fuertes</h3>
              <div className="space-y-4">
                {data.areas
                  .sort((a, b) => b.level - a.level)
                  .slice(0, 3)
                  .map((area, index) => (
                    <div
                      key={area.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${area.color}20` }}>
                          <div style={{ color: area.color }}>
                            {area.icon}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium">{area.name}</h4>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Nivel {area.level}/10
                          </p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className={`w-full rounded-full h-2 ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(area.level / area.maxLevel) * 100}%`,
                              backgroundColor: area.color
                            }}
                          />
                        </div>
                      </div>
                      {area.badge && (
                        <div className="text-2xl" title={area.badge.name}>
                          {area.badge.icon}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'areas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.areas.map((area) => (
              <div
                key={area.id}
                className={`p-6 rounded-xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${area.color}20` }}>
                      <div style={{ color: area.color }}>
                        {area.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{area.name}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Nivel {area.level}/10
                      </p>
                    </div>
                  </div>
                  {area.badge && (
                    <div className="text-2xl" title={area.badge.name}>
                      {area.badge.icon}
                    </div>
                  )}
                </div>

                <div className={`w-full rounded-full h-2 mb-4 ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(area.level / area.maxLevel) * 100}%`,
                      backgroundColor: area.color
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: area.color }}>
                      {area.contributions.proposals}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Propuestas
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: area.color }}>
                      {area.contributions.support}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Apoyos
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: area.color }}>
                      {area.contributions.moderation}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Moderación
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: area.color }}>
                      {area.contributions.comments}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Comentarios
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {area.motivationalMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-6">
            {badges.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {badges.map((area) => (
                    <div
                      key={area.id}
                      className={`p-6 rounded-xl ${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                      } shadow-sm text-center`}
                    >
                      <div className="text-4xl mb-3">{area.badge!.icon}</div>
                      <h3 className="font-semibold mb-2">{area.badge!.name}</h3>
                      <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {area.badge!.description}
                      </p>
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium`} 
                             style={{ backgroundColor: `${area.color}20`, color: area.color }}>
                          {area.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-6 rounded-xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Compartir Logros</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } transition-colors`}>
                      <Download className="w-4 h-4" />
                      <span>Descargar Medallas</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={`p-8 rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-sm text-center`}>
                <Award className={`w-16 h-16 mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className="text-xl font-semibold mb-2">¡Tus primeras medallas te esperan!</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                  Sigue participando activamente en las áreas que más te importan para ganar reconocimientos.
                </p>
                <button className={`px-6 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}>
                  Ver Propuestas Activas
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
              <h3 className="text-xl font-semibold mb-6">Control de Visibilidad</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium mb-1">Mostrar mis medallas públicamente</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Otros ciudadanos podrán ver tus logros en tu perfil
                    </p>
                  </div>
                  <button
                    onClick={() => toggleVisibility('badges')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      data.publicVisibility.showBadges
                        ? 'bg-blue-600'
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        data.publicVisibility.showBadges ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium mb-1">Mostrar mis especializaciones</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Otros podrán ver en qué áreas tienes más experiencia
                    </p>
                  </div>
                  <button
                    onClick={() => toggleVisibility('specializations')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      data.publicVisibility.showSpecializations
                        ? 'bg-blue-600'
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        data.publicVisibility.showSpecializations ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      Tu privacidad es importante
                    </p>
                    <p className={`text-sm mt-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-blue-700'
                    }`}>
                      Puedes cambiar estas configuraciones en cualquier momento. 
                      Solo tú tienes control sobre qué información compartes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className={`p-6 rounded-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
              <h3 className="text-xl font-semibold mb-4">Vista previa pública</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Así es como otros ciudadanos verán tu perfil:
              </p>
              
              <div className={`p-4 rounded-lg border-2 border-dashed ${
                isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 rounded-full ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  } flex items-center justify-center`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium">{data.username}</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Ciudadano activo
                    </p>
                  </div>
                </div>

                {data.publicVisibility.showBadges && badges.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Logros</h5>
                    <div className="flex space-x-2">
                      {badges.slice(0, 3).map((area) => (
                        <div
                          key={area.id}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'bg-gray-600' : 'bg-white'
                          } flex items-center space-x-1`}
                          title={area.badge!.name}
                        >
                          <span className="text-sm">{area.badge!.icon}</span>
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {area.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.publicVisibility.showSpecializations && (
                  <div>
                    <h5 className="font-medium mb-2">Especializaciones</h5>
                    <div className="flex flex-wrap gap-2">
                      {data.areas
                        .filter(area => area.level >= 6)
                        .slice(0, 3)
                        .map((area) => (
                          <div
                            key={area.id}
                            className="flex items-center space-x-1 px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: `${area.color}20`, color: area.color }}
                          >
                            {area.icon}
                            <span>{area.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {!data.publicVisibility.showBadges && !data.publicVisibility.showSpecializations && (
                  <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Este ciudadano mantiene privada su información de especialización.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`p-6 rounded-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Acciones</h3>
              <div className="flex flex-wrap gap-3">
                <button className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } transition-colors`}>
                  <ChevronRight className="w-4 h-4" />
                  <span>Ver Propuestas en mis Áreas Fuertes</span>
                </button>
                
                <button className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                } transition-colors`}>
                  <Lightbulb className="w-4 h-4" />
                  <span>Explorar Nuevas Áreas</span>
                </button>
              </div>
            </div>

            {/* Tips Section */}
            <div className={`p-6 rounded-xl ${
              isDarkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-50 to-purple-50'
            } border ${isDarkMode ? 'border-blue-800' : 'border-blue-200'}`}>
              <h3 className="text-lg font-semibold mb-4">💡 Tips para Desarrollar tu Especialización</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-black bg-opacity-20' : 'bg-white bg-opacity-50'
                }`}>
                  <h4 className="font-medium mb-1">Participa Consistentemente</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    La especialización crece con participación regular, no con grandes esfuerzos esporádicos.
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-black bg-opacity-20' : 'bg-white bg-opacity-50'
                }`}>
                  <h4 className="font-medium mb-1">Calidad sobre Cantidad</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Comentarios reflexivos y propuestas bien fundamentadas tienen más valor.
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-black bg-opacity-20' : 'bg-white bg-opacity-50'
                }`}>
                  <h4 className="font-medium mb-1">Escucha y Aprende</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    La moderación constructiva y el apoyo a buenas ideas también cuenta.
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-black bg-opacity-20' : 'bg-white bg-opacity-50'
                }`}>
                  <h4 className="font-medium mb-1">Mantén la Curiosidad</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    No tengas miedo de explorar nuevas áreas de vez en cuando.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenSpecializationPage;