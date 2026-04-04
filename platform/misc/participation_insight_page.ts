import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, RadarChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useReputationService } from '../services/useReputationService';
import { useParticipationStats } from '../services/useParticipationStats';

const { width: screenWidth } = Dimensions.get('window');

interface ParticipationData {
  userStats: {
    proposals: number;
    supports: number;
    moderations: number;
    comments: number;
    reputation: number;
  };
  communityAverages: {
    proposals: number;
    supports: number;
    moderations: number;
    comments: number;
    reputation: number;
  };
  distributionData: number[];
  activeUsersPercentile: number;
  monthlyTrend: Array<{ month: string; participation: number }>;
  impactMetrics: {
    proposalsValidated: number;
    consensusContributions: number;
    communityHelped: number;
  };
}

const ParticipationInsightPage: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { getUserReputation } = useReputationService();
  const { getParticipationStats } = useParticipationStats();
  
  const [data, setData] = useState<ParticipationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'radar' | 'distribution' | 'impact'>('radar');

  useEffect(() => {
    loadParticipationData();
  }, []);

  const loadParticipationData = async () => {
    try {
      setLoading(true);
      
      // Mock data - En producción, esto vendría de los servicios reales
      const mockData: ParticipationData = {
        userStats: {
          proposals: 3,
          supports: 15,
          moderations: 7,
          comments: 22,
          reputation: 78
        },
        communityAverages: {
          proposals: 2.1,
          supports: 8.5,
          moderations: 4.2,
          comments: 12.3,
          reputation: 45.7
        },
        distributionData: [5, 12, 23, 35, 45, 38, 28, 15, 8, 3],
        activeUsersPercentile: 72,
        monthlyTrend: [
          { month: 'Ene', participation: 20 },
          { month: 'Feb', participation: 35 },
          { month: 'Mar', participation: 28 },
          { month: 'Abr', participation: 42 },
          { month: 'May', participation: 38 },
          { month: 'Jun', participation: 47 }
        ],
        impactMetrics: {
          proposalsValidated: 8,
          consensusContributions: 23,
          communityHelped: 156
        }
      };

      // Simular carga asíncrona
      setTimeout(() => {
        setData(mockData);
        setLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Error loading participation data:', error);
      setLoading(false);
    }
  };

  const getMotivationalMessage = () => {
    if (!data) return '';
    
    const messages = [
      '🌱 Cada paso cuenta. Lo importante es participar.',
      '⭐ Tu voz es parte del tejido colectivo.',
      '💡 No importa cuántos, importa que existas aquí.',
      '🧭 Navegas la democracia con propósito.',
      '🌍 Tu participación construye comunidad.',
      '🛠️ Cada acción fortalece el sistema.',
      '🗳️ Tu criterio enriquece las decisiones.'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const renderRadarChart = () => {
    if (!data) return null;

    const radarData = {
      labels: ['Propuestas', 'Apoyos', 'Moderación', 'Comentarios', 'Reputación'],
      datasets: [
        {
          label: 'Tu Participación',
          data: [
            (data.userStats.proposals / Math.max(data.communityAverages.proposals * 2, 1)) * 100,
            (data.userStats.supports / Math.max(data.communityAverages.supports * 2, 1)) * 100,
            (data.userStats.moderations / Math.max(data.communityAverages.moderations * 2, 1)) * 100,
            (data.userStats.comments / Math.max(data.communityAverages.comments * 2, 1)) * 100,
            (data.userStats.reputation / 100) * 100
          ],
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeColor: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 2
        },
        {
          label: 'Promedio Comunitario',
          data: [
            (data.communityAverages.proposals / Math.max(data.communityAverages.proposals * 2, 1)) * 100,
            (data.communityAverages.supports / Math.max(data.communityAverages.supports * 2, 1)) * 100,
            (data.communityAverages.moderations / Math.max(data.communityAverages.moderations * 2, 1)) * 100,
            (data.communityAverages.comments / Math.max(data.communityAverages.comments * 2, 1)) * 100,
            (data.communityAverages.reputation / 100) * 100
          ],
          color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
          strokeColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
          strokeWidth: 1
        }
      ]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Tu Huella Participativa
        </Text>
        <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
          Comparación con promedios comunitarios anónimos
        </Text>
        
        <RadarChart
          data={radarData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: theme.background,
            backgroundGradientTo: theme.background,
            color: (opacity = 1) => theme.primary + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
            strokeWidth: 2,
            barPercentage: 0.5,
            useShadowColorFromDataset: false,
            propsForLabels: {
              fontSize: 12,
              fill: theme.text
            }
          }}
          style={styles.chart}
        />
      </View>
    );
  };

  const renderDistributionChart = () => {
    if (!data) return null;

    const distributionData = {
      labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'],
      datasets: [{
        data: data.distributionData,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Distribución Anónima de Participación
        </Text>
        <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
          ¿Dónde te ubicas en la curva comunitaria?
        </Text>
        
        <BarChart
          data={distributionData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: theme.background,
            backgroundGradientTo: theme.background,
            color: (opacity = 1) => theme.primary + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
            strokeWidth: 2,
            barPercentage: 0.7,
            propsForLabels: {
              fontSize: 10,
              fill: theme.text
            }
          }}
          style={styles.chart}
        />
        
        <View style={[styles.percentileIndicator, { backgroundColor: theme.cardBackground }]}>
          <Icon name="trending-up" size={20} color={theme.primary} />
          <Text style={[styles.percentileText, { color: theme.text }]}>
            Estás entre el {data.activeUsersPercentile}% de ciudadanos más activos este mes
          </Text>
        </View>
      </View>
    );
  };

  const renderImpactMetrics = () => {
    if (!data) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Tu Impacto Colectivo
        </Text>
        <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
          Cómo tu participación fortalece la comunidad
        </Text>
        
        <View style={styles.impactGrid}>
          <View style={[styles.impactCard, { backgroundColor: theme.cardBackground }]}>
            <Icon name="check-circle" size={32} color="#10B981" />
            <Text style={[styles.impactNumber, { color: theme.text }]}>
              {data.impactMetrics.proposalsValidated}
            </Text>
            <Text style={[styles.impactLabel, { color: theme.textSecondary }]}>
              Propuestas que ayudaste a validar
            </Text>
          </View>
          
          <View style={[styles.impactCard, { backgroundColor: theme.cardBackground }]}>
            <Icon name="handshake" size={32} color="#3B82F6" />
            <Text style={[styles.impactNumber, { color: theme.text }]}>
              {data.impactMetrics.consensusContributions}
            </Text>
            <Text style={[styles.impactLabel, { color: theme.textSecondary }]}>
              Contribuciones al consenso
            </Text>
          </View>
          
          <View style={[styles.impactCard, { backgroundColor: theme.cardBackground }]}>
            <Icon name="account-group" size={32} color="#8B5CF6" />
            <Text style={[styles.impactNumber, { color: theme.text }]}>
              {data.impactMetrics.communityHelped}
            </Text>
            <Text style={[styles.impactLabel, { color: theme.textSecondary }]}>
              Ciudadanos beneficiados indirectamente
            </Text>
          </View>
        </View>

        <View style={[styles.trendContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.trendTitle, { color: theme.text }]}>
            Tu Evolución Mensual
          </Text>
          <LineChart
            data={{
              labels: data.monthlyTrend.map(item => item.month),
              datasets: [{
                data: data.monthlyTrend.map(item => item.participation),
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                strokeWidth: 3
              }]
            }}
            width={screenWidth - 80}
            height={120}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: theme.cardBackground,
              backgroundGradientTo: theme.cardBackground,
              color: (opacity = 1) => theme.primary + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
              strokeWidth: 2,
              propsForLabels: {
                fontSize: 10,
                fill: theme.textSecondary
              }
            }}
            bezier
            style={styles.trendChart}
          />
        </View>
      </View>
    );
  };

  const renderViewSelector = () => (
    <View style={[styles.viewSelector, { backgroundColor: theme.cardBackground }]}>
      <TouchableOpacity
        style={[
          styles.viewButton,
          selectedView === 'radar' && { backgroundColor: theme.primary }
        ]}
        onPress={() => setSelectedView('radar')}
      >
        <Icon 
          name="radar" 
          size={20} 
          color={selectedView === 'radar' ? '#FFFFFF' : theme.textSecondary} 
        />
        <Text style={[
          styles.viewButtonText,
          { color: selectedView === 'radar' ? '#FFFFFF' : theme.textSecondary }
        ]}>
          Radar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewButton,
          selectedView === 'distribution' && { backgroundColor: theme.primary }
        ]}
        onPress={() => setSelectedView('distribution')}
      >
        <Icon 
          name="chart-histogram" 
          size={20} 
          color={selectedView === 'distribution' ? '#FFFFFF' : theme.textSecondary} 
        />
        <Text style={[
          styles.viewButtonText,
          { color: selectedView === 'distribution' ? '#FFFFFF' : theme.textSecondary }
        ]}>
          Distribución
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewButton,
          selectedView === 'impact' && { backgroundColor: theme.primary }
        ]}
        onPress={() => setSelectedView('impact')}
      >
        <Icon 
          name="heart-pulse" 
          size={20} 
          color={selectedView === 'impact' ? '#FFFFFF' : theme.textSecondary} 
        />
        <Text style={[
          styles.viewButtonText,
          { color: selectedView === 'impact' ? '#FFFFFF' : theme.textSecondary }
        ]}>
          Impacto
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentChart = () => {
    switch (selectedView) {
      case 'radar':
        return renderRadarChart();
      case 'distribution':
        return renderDistributionChart();
      case 'impact':
        return renderImpactMetrics();
      default:
        return renderRadarChart();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Icon name="chart-line" size={48} color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Analizando tu participación...
        </Text>
        <Text style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
          Generando insights anónimos
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header motivacional */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <Icon name="compass" size={32} color={theme.primary} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Tu Brújula Participativa
        </Text>
        <Text style={[styles.motivationalMessage, { color: theme.textSecondary }]}>
          {getMotivationalMessage()}
        </Text>
      </View>

      {/* Selector de vista */}
      {renderViewSelector()}

      {/* Gráfico actual */}
      {renderCurrentChart()}

      {/* Botón de mejora */}
      <TouchableOpacity 
        style={[styles.improvementButton, { backgroundColor: theme.primary }]}
        onPress={() => {
          // Navegar a tips de participación
          console.log('Mostrar tips de mejora');
        }}
      >
        <Icon name="lightbulb-on" size={20} color="#FFFFFF" />
        <Text style={styles.improvementButtonText}>
          ¿Cómo mejoro mi participación?
        </Text>
      </TouchableOpacity>

      {/* Footer explicativo */}
      <View style={[styles.footer, { backgroundColor: theme.cardBackground }]}>
        <Icon name="shield-check" size={20} color={theme.primary} />
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Todos los datos son anónimos y agregados. Tu privacidad está protegida.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  motivationalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  viewSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  percentileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  percentileText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  impactCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  impactNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  impactLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  trendContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  trendChart: {
    borderRadius: 8,
  },
  improvementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  improvementButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});

export default ParticipationInsightPage;