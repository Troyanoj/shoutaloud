// src/screens/main/ProposalsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProposals } from '../../hooks/useProposals';
import { ProposalCard } from '../../components/proposals/ProposalCard';
import { FilterTabs } from '../../components/common/FilterTabs';
import Animated, { FadeInDown } from 'react-native-reanimated';

type ProposalScope = 'all' | 'municipal' | 'state' | 'federal';

export const ProposalsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [scope, setScope] = useState<ProposalScope>('all');
  const { proposals, isLoading, refetch } = useProposals(scope);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleProposalPress = (proposal: any) => {
    navigation.navigate('Voting', { proposal });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Propuestas Activas</Text>
      <Text style={styles.subtitle}>
        Participa en las decisiones de tu comunidad
      </Text>
      
      <FilterTabs
        options={[
          { key: 'all', label: 'Todas' },
          { key: 'municipal', label: 'Municipal' },
          { key: 'state', label: 'Estatal' },
          { key: 'federal', label: 'Federal' },
        ]}
        selected={scope}
        onSelect={setScope}
      />
    </View>
  );

  const renderProposal = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(600)}
    >
      <ProposalCard
        proposal={item}
        onPress={() => handleProposalPress(item)}
      />
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>
        No hay propuestas activas en tu zona
      </Text>
      <Text style={styles.emptySubtext}>
        Vuelve a revisar más tarde
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={proposals}
          renderItem={renderProposal}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#10B981"
            />
          }
        />
        
        {isLoading && !refreshing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#E2E8F0',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#94A3B8',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// src/screens/main/VotingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AIExplanation } from '../../components/proposals/AIExplanation';
import { VoteButtons } from '../../components/proposals/VoteButtons';
import { useVoting } from '../../hooks/useVoting';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const VotingScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { proposal } = route.params as { proposal: any };
  
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { castVote } = useVoting();
  const { analysis, isLoading: isLoadingAnalysis } = useAIAnalysis(proposal.id);

  const handleVote = async (vote: number) => {
    setSelectedVote(vote);
    
    Alert.alert(
      'Confirmar Voto',
      `¿Estás seguro de votar ${getVoteText(vote)}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setSelectedVote(null),
        },
        {
          text: 'Confirmar',
          onPress: () => submitVote(vote),
        },
      ]
    );
  };

  const getVoteText = (vote: number) => {
    switch (vote) {
      case 1: return 'SÍ';
      case 2: return 'NO';
      case 3: return 'ABSTENCIÓN';
      default: return '';
    }
  };

  const submitVote = async (vote: number) => {
    try {
      setIsSubmitting(true);
      
      const result = await castVote(proposal.id, vote);
      
      if (result.success) {
        Alert.alert(
          '✅ Voto Registrado',
          'Tu voto ha sido registrado de forma anónima en la blockchain.',
          [
            {
              text: 'Ver Resultados',
              onPress: () => navigation.navigate('Results', { proposalId: proposal.id }),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo registrar tu voto');
        setSelectedVote(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al procesar tu voto');
      setSelectedVote(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Atrás</Text>
          </TouchableOpacity>

          <Animated.View
            entering={FadeInDown.duration(600)}
            style={styles.header}
          >
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {proposal.category.toUpperCase()}
              </Text>
            </View>
            
            <Text style={styles.title}>{proposal.title}</Text>
            
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>{proposal.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⏰</Text>
                <Text style={styles.metaText}>
                  Cierra en {proposal.daysLeft} días
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>📄 Resumen</Text>
            <Text style={styles.summaryText}>{proposal.summary}</Text>
            
            <TouchableOpacity style={styles.documentLink}>
              <Text style={styles.documentLinkText}>
                Ver documento oficial completo →
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {isLoadingAnalysis ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>
                Analizando propuesta con IA...
              </Text>
            </View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(400).duration(600)}
            >
              <AIExplanation analysis={analysis} />
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
            style={styles.voteSection}
          >
            <Text style={styles.sectionTitle}>🗳️ Emite tu voto</Text>
            
            <VoteButtons
              onVote={handleVote}
              selectedVote={selectedVote}
              disabled={isSubmitting}
            />
            
            {isSubmitting && (
              <View style={styles.submittingOverlay}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.submittingText}>
                  Registrando voto en blockchain...
                </Text>
              </View>
            )}
          </Animated.View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              Tu voto es completamente anónimo. Nadie puede rastrear tu decisión.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const votingStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 36,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 24,
    marginBottom: 12,
  },
  documentLink: {
    marginTop: 8,
  },
  documentLinkText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
  },
  voteSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  submittingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  privacyNote: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
});

// src/screens/main/ResultsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ResultsChart } from '../../components/results/ResultsChart';
import { ZoneStats } from '../../components/results/ZoneStats';
import { useRealTimeResults } from '../../hooks/useRealTimeResults';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const ResultsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { proposalId } = route.params as { proposalId: number };
  
  const [refreshing, setRefreshing] = useState(false);
  const { results, zoneStats, refetch, isActive } = useRealTimeResults(proposalId);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const totalVotes = results.yes + results.no + results.abstain;
  const yesPercentage = totalVotes > 0 ? (results.yes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (results.no / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (results.abstain / totalVotes) * 100 : 0;

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#10B981"
            />
          }
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Atrás</Text>
          </TouchableOpacity>

          <Animated.View
            entering={FadeInDown.duration(600)}
            style={styles.header}
          >
            <Text style={styles.title}>Resultados en Tiempo Real</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
              <Text style={styles.statusText}>
                {isActive ? 'Votación Activa' : 'Votación Finalizada'}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.mainResults}
          >
            <ResultsChart
              yes={yesPercentage}
              no={noPercentage}
              abstain={abstainPercentage}
              totalVotes={totalVotes}
            />
            
            <View style={styles.resultsGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultValue}>{results.yes}</Text>
                <Text style={styles.resultLabel}>SÍ</Text>
                <Text style={styles.resultPercentage}>
                  {yesPercentage.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.resultItem}>
                <Text style={[styles.resultValue, styles.noColor]}>
                  {results.no}
                </Text>
                <Text style={styles.resultLabel}>NO</Text>
                <Text style={styles.resultPercentage}>
                  {noPercentage.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.resultItem}>
                <Text style={[styles.resultValue, styles.abstainColor]}>
                  {results.abstain}
                </Text>
                <Text style={styles.resultLabel}>ABSTENCIÓN</Text>
                <Text style={styles.resultPercentage}>
                  {abstainPercentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.participationSection}
          >
            <Text style={styles.sectionTitle}>📊 Participación</Text>
            <View style={styles.participationCard}>
              <View style={styles.participationRow}>
                <Text style={styles.participationLabel}>Total de votos</Text>
                <Text style={styles.participationValue}>{totalVotes}</Text>
              </View>
              <View style={styles.participationRow}>
                <Text style={styles.participationLabel}>Tasa de participación</Text>
                <Text style={styles.participationValue}>
                  {results.participationRate.toFixed(1)}%
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
          >
            <Text style={styles.sectionTitle}>🗺️ Resultados por Zona</Text>
            <ZoneStats stats={zoneStats} />
          </Animated.View>

          {isActive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                Actualizándose en tiempo real
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const resultsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  mainResults: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  resultsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  noColor: {
    color: '#EF4444',
  },
  abstainColor: {
    color: '#F59E0B',
  },
  resultLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  resultPercentage: {
    fontSize: 18,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  participationSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  participationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  participationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participationLabel: {
    color: '#94A3B8',
    fontSize: 16,
  },
  participationValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});

// Export styles
export const styles = { ...votingStyles, ...resultsStyles };