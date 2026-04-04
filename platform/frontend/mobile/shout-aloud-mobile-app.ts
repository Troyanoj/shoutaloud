/**
 * Shout Aloud Mobile App
 * React Native implementation of the citizen voting platform
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';

// Types
interface Proposal {
  id: string;
  title: string;
  category: 'federal' | 'state' | 'municipal';
  summary: string;
  aiAnalysis: {
    personalImpact: string[];
    communityImpact: string[];
    beneficiaries: string[];
    recommendation: string;
  };
  votingDeadline: Date;
  currentVotes: {
    yes: number;
    no: number;
  };
}

interface UserProfile {
  identityHash: string;
  municipality: string;
  reputation: number;
  votescast: number;
}

// Welcome Screen Component
export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeContainer}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.logo}
        />
        <Text style={styles.welcomeTitle}>Shout Aloud</Text>
        <Text style={styles.welcomeSubtitle}>La voz del pueblo es la ley</Text>
        
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>
            Es tiempo de recuperar lo que nos pertenece: 
            el derecho a decidir nuestro propio destino.
          </Text>
          <Text style={styles.welcomeText}>
            Este es el momento.{'\n'}
            Este es el despertar.{'\n'}
            Esta es la voz del pueblo.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Identity')}
        >
          <Text style={styles.primaryButtonText}>Comenzar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Identity Verification Screen
export const IdentityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleBiometricCapture = async () => {
    setIsProcessing(true);
    // Simulate biometric capture
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
    }, 2000);
  };
  
  const handleDocumentCapture = async () => {
    setIsProcessing(true);
    // Simulate document capture
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
    }, 2000);
  };
  
  const handleLocationPermission = async () => {
    setIsProcessing(true);
    // Request location permission
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Identidad Verificada',
        'Tu identidad ha sido verificada de forma segura. Ningún dato personal ha sido almacenado.',
        [{ text: 'Continuar', onPress: () => navigation.navigate('Home') }]
      );
    }, 2000);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.screenTitle}>Verificación de Identidad</Text>
        <Text style={styles.screenSubtitle}>
          Tu privacidad es nuestra prioridad. Todos los datos se procesan localmente.
        </Text>
        
        {/* Step 1: Biometric */}
        <View style={[styles.stepCard, step === 1 && styles.activeStep]}>
          <Text style={styles.stepNumber}>Paso 1</Text>
          <Text style={styles.stepTitle}>Captura Biométrica</Text>
          <Text style={styles.stepDescription}>
            Tomaremos una foto para crear un hash único. 
            Tu imagen no se almacena.
          </Text>
          {step === 1 && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBiometricCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Capturar Rostro</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Step 2: Document */}
        <View style={[styles.stepCard, step === 2 && styles.activeStep]}>
          <Text style={styles.stepNumber}>Paso 2</Text>
          <Text style={styles.stepTitle}>Documento Oficial</Text>
          <Text style={styles.stepDescription}>
            Escanea tu documento de identidad. 
            Solo extraemos un hash verificador.
          </Text>
          {step === 2 && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDocumentCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Escanear Documento</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Step 3: Location */}
        <View style={[styles.stepCard, step === 3 && styles.activeStep]}>
          <Text style={styles.stepNumber}>Paso 3</Text>
          <Text style={styles.stepTitle}>Municipio de Residencia</Text>
          <Text style={styles.stepDescription}>
            Determinaremos tu municipio para mostrarte 
            solo las votaciones relevantes.
          </Text>
          {step === 3 && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLocationPermission}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Permitir Ubicación</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Home Screen with Proposals
export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'federal' | 'state' | 'municipal'>('all');
  
  useEffect(() => {
    // Load proposals from decentralized storage
    loadProposals();
  }, [filter]);
  
  const loadProposals = async () => {
    setLoading(true);
    // Simulate loading
    setTimeout(() => {
      setProposals([
        {
          id: '1',
          title: 'Reforma al Sistema de Salud Municipal',
          category: 'municipal',
          summary: 'Propuesta para mejorar los servicios de salud en centros comunitarios',
          aiAnalysis: {
            personalImpact: [
              'Reducción de tiempos de espera en 40%',
              'Acceso a especialistas sin costo adicional'
            ],
            communityImpact: [
              'Creación de 150 empleos locales',
              'Mejor atención para 50,000 residentes'
            ],
            beneficiaries: [
              'Ciudadanos de bajos recursos (85%)',
              'Contratistas médicos locales (15%)'
            ],
            recommendation: 'Recomendado: Beneficia directamente a la comunidad'
          },
          votingDeadline: new Date('2025-07-01'),
          currentVotes: { yes: 3420, no: 890 }
        }
      ]);
      setLoading(false);
    }, 1000);
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'federal': return '#3B82F6';
      case 'state': return '#10B981';
      case 'municipal': return '#F59E0B';
      default: return '#6B7280';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Propuestas Activas</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {(['all', 'federal', 'state', 'municipal'] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterTab, filter === cat && styles.activeFilterTab]}
            onPress={() => setFilter(cat)}
          >
            <Text style={[styles.filterTabText, filter === cat && styles.activeFilterTabText]}>
              {cat === 'all' ? 'Todas' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Proposals List */}
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          proposals.map((proposal) => (
            <TouchableOpacity
              key={proposal.id}
              style={styles.proposalCard}
              onPress={() => navigation.navigate('Voting', { proposal })}
            >
              <View style={styles.proposalHeader}>
                <View 
                  style={[
                    styles.categoryBadge, 
                    { backgroundColor: getCategoryColor(proposal.category) }
                  ]}
                >
                  <Text style={styles.categoryBadgeText}>
                    {proposal.category.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.deadline}>
                  Cierra: {proposal.votingDeadline.toLocaleDateString()}
                </Text>
              </View>
              
              <Text style={styles.proposalTitle}>{proposal.title}</Text>
              <Text style={styles.proposalSummary}>{proposal.summary}</Text>
              
              <View style={styles.aiRecommendation}>
                <Text style={styles.aiIcon}>🤖</Text>
                <Text style={styles.aiText}>{proposal.aiAnalysis.recommendation}</Text>
              </View>
              
              <View style={styles.voteStats}>
                <View style={styles.voteBar}>
                  <View 
                    style={[
                      styles.voteProgress, 
                      { 
                        width: `${(proposal.currentVotes.yes / (proposal.currentVotes.yes + proposal.currentVotes.no)) * 100}%`,
                        backgroundColor: '#10B981'
                      }
                    ]}
                  />
                </View>
                <View style={styles.voteNumbers}>
                  <Text style={styles.yesVotes}>✅ {proposal.currentVotes.yes}</Text>
                  <Text style={styles.noVotes}>❌ {proposal.currentVotes.no}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Voting Screen
export const VotingScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { proposal } = route.params;
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  const handleVote = async (support: boolean) => {
    setIsVoting(true);
    // Submit vote to blockchain
    setTimeout(() => {
      setIsVoting(false);
      setHasVoted(true);
      Alert.alert(
        'Voto Registrado',
        'Tu voto ha sido registrado en la blockchain de forma anónima y permanente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 2000);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.screenTitle}>{proposal.title}</Text>
        
        {/* AI Analysis */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>🤖 Análisis de IA</Text>
          
          <View style={styles.analysisCard}>
            <Text style={styles.analysisLabel}>Impacto Personal:</Text>
            {proposal.aiAnalysis.personalImpact.map((impact, i) => (
              <Text key={i} style={styles.analysisItem}>• {impact}</Text>
            ))}
          </View>
          
          <View style={styles.analysisCard}>
            <Text style={styles.analysisLabel}>Impacto Comunitario:</Text>
            {proposal.aiAnalysis.communityImpact.map((impact, i) => (
              <Text key={i} style={styles.analysisItem}>• {impact}</Text>
            ))}
          </View>
          
          <View style={styles.analysisCard}>
            <Text style={styles.analysisLabel}>Principales Beneficiarios:</Text>
            {proposal.aiAnalysis.beneficiaries.map((ben, i) => (
              <Text key={i} style={styles.analysisItem}>• {ben}</Text>
            ))}
          </View>
        </View>
        
        {/* Official Document Link */}
        <TouchableOpacity style={styles.documentLink}>
          <Text style={styles.documentLinkText}>📄 Ver Documento Oficial Completo</Text>
        </TouchableOpacity>
        
        {/* Voting Buttons */}
        {!hasVoted && (
          <View style={styles.votingButtons}>
            <TouchableOpacity
              style={[styles.voteButton, styles.yesButton]}
              onPress={() => handleVote(true)}
              disabled={isVoting}
            >
              {isVoting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.voteButtonIcon}>✅</Text>
                  <Text style={styles.voteButtonText}>Aprobar</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.voteButton, styles.noButton]}
              onPress={() => handleVote(false)}
              disabled={isVoting}
            >
              {isVoting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.voteButtonIcon}>❌</Text>
                  <Text style={styles.voteButtonText}>Rechazar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  scrollView: {
    flex: 1
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 30
  },
  welcomeTextContainer: {
    marginBottom: 40
  },
  welcomeText: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '600'
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    padding: 20,
    paddingBottom: 10
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    paddingHorizontal: 20,
    marginBottom: 20
  },
  stepCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155'
  },
  activeStep: {
    borderColor: '#10B981'
  },
  stepNumber: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 5
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10
  },
  stepDescription: {
    fontSize: 16,
    color: '#CBD5E1',
    marginBottom: 20,
    lineHeight: 22
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  profileIcon: {
    fontSize: 24
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#1E293B'
  },
  activeFilterTab: {
    backgroundColor: '#10B981'
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 16
  },
  activeFilterTabText: {
    color: '#fff',
    fontWeight: '600'
  },
  loader: {
    marginTop: 50
  },
  proposalCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  deadline: {
    color: '#94A3B8',
    fontSize: 14
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10
  },
  proposalSummary: {
    fontSize: 16,
    color: '#CBD5E1',
    marginBottom: 15,
    lineHeight: 22
  },
  aiRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15
  },
  aiIcon: {
    fontSize: 20,
    marginRight: 10
  },
  aiText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14
  },
  voteStats: {
    marginTop: 10
  },
  voteBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10
  },
  voteProgress: {
    height: '100%'
  },
  voteNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  yesVotes: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600'
  },
  noVotes: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600'
  },
  analysisSection: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,