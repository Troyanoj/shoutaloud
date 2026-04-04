// src/components/proposals/ProposalCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface ProposalCardProps {
  proposal: {
    id: number;
    title: string;
    category: string;
    scope: 'municipal' | 'state' | 'federal';
    summary: string;
    location: string;
    daysLeft: number;
    currentVotes: {
      yes: number;
      no: number;
      abstain: number;
    };
    aiRecommendation?: string;
  };
  onPress: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onPress }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getScopeColor = () => {
    switch (proposal.scope) {
      case 'municipal': return ['#F59E0B', '#D97706'];
      case 'state': return ['#10B981', '#059669'];
      case 'federal': return ['#3B82F6', '#2563EB'];
      default: return ['#64748B', '#475569'];
    }
  };

  const totalVotes = proposal.currentVotes.yes + proposal.currentVotes.no + proposal.currentVotes.abstain;
  const yesPercentage = totalVotes > 0 ? (proposal.currentVotes.yes / totalVotes) * 100 : 0;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <LinearGradient
              colors={getScopeColor()}
              style={styles.scopeBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.scopeText}>
                {proposal.scope.toUpperCase()}
              </Text>
            </LinearGradient>
            
            <View style={styles.timeLeft}>
              <Text style={styles.timeIcon}>⏰</Text>
              <Text style={styles.timeText}>{proposal.daysLeft}d</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {proposal.title}
          </Text>
          
          <Text style={styles.summary} numberOfLines={3}>
            {proposal.summary}
          </Text>

          <View style={styles.location}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{proposal.location}</Text>
          </View>

          {proposal.aiRecommendation && (
            <View style={styles.aiRecommendation}>
              <Text style={styles.aiIcon}>🤖</Text>
              <Text style={styles.aiText} numberOfLines={1}>
                {proposal.aiRecommendation}
              </Text>
            </View>
          )}

          <View style={styles.votePreview}>
            <View style={styles.voteBar}>
              <View 
                style={[
                  styles.voteProgress,
                  { width: `${yesPercentage}%` }
                ]}
              />
            </View>
            <View style={styles.voteStats}>
              <Text style={styles.voteCount}>
                {totalVotes} votos
              </Text>
              <Text style={styles.yesPercentage}>
                {yesPercentage.toFixed(0)}% SÍ
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scopeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scopeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  timeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeIcon: {
    fontSize: 14,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 26,
  },
  summary: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
    marginBottom: 12,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  aiRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  aiIcon: {
    fontSize: 16,
  },
  aiText: {
    flex: 1,
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  votePreview: {
    marginTop: 4,
  },
  voteBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  voteProgress: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  voteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voteCount: {
    color: '#94A3B8',
    fontSize: 13,
  },
  yesPercentage: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
});

// src/components/proposals/AIExplanation.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeIn,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AIAnalysis {
  personalImpact: string[];
  communityImpact: string[];
  beneficiaries: string[];
  potentialRisks: string[];
  recommendation: {
    type: 'positive' | 'negative' | 'neutral';
    reason: string;
  };
}

interface AIExplanationProps {
  analysis: AIAnalysis;
}

export const AIExplanation: React.FC<AIExplanationProps> = ({ analysis }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getRecommendationColor = () => {
    switch (analysis.recommendation.type) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'neutral': return '#F59E0B';
    }
  };

  const getRecommendationIcon = () => {
    switch (analysis.recommendation.type) {
      case 'positive': return '✅';
      case 'negative': return '❌';
      case 'neutral': return '⚖️';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤖</Text>
        <Text style={styles.headerTitle}>Análisis de IA</Text>
      </View>

      <View 
        style={[
          styles.recommendationCard,
          { borderColor: getRecommendationColor() }
        ]}
      >
        <Text style={styles.recommendationIcon}>
          {getRecommendationIcon()}
        </Text>
        <View style={styles.recommendationContent}>
          <Text style={[
            styles.recommendationTitle,
            { color: getRecommendationColor() }
          ]}>
            {analysis.recommendation.type === 'positive' 
              ? 'Recomendado'
              : analysis.recommendation.type === 'negative'
              ? 'No Recomendado'
              : 'Requiere Consideración'}
          </Text>
          <Text style={styles.recommendationReason}>
            {analysis.recommendation.reason}
          </Text>
        </View>
      </View>

      <ExplanationSection
        title="Impacto Personal"
        icon="👤"
        items={analysis.personalImpact}
        expanded={expandedSection === 'personal'}
        onToggle={() => toggleSection('personal')}
      />

      <ExplanationSection
        title="Impacto Comunitario"
        icon="🏘️"
        items={analysis.communityImpact}
        expanded={expandedSection === 'community'}
        onToggle={() => toggleSection('community')}
      />

      <ExplanationSection
        title="Principales Beneficiarios"
        icon="🎯"
        items={analysis.beneficiaries}
        expanded={expandedSection === 'beneficiaries'}
        onToggle={() => toggleSection('beneficiaries')}
      />

      <ExplanationSection
        title="Riesgos Potenciales"
        icon="⚠️"
        items={analysis.potentialRisks}
        expanded={expandedSection === 'risks'}
        onToggle={() => toggleSection('risks')}
      />
    </View>
  );
};

interface ExplanationSectionProps {
  title: string;
  icon: string;
  items: string[];
  expanded: boolean;
  onToggle: () => void;
}

const ExplanationSection: React.FC<ExplanationSectionProps> = ({
  title,
  icon,
  items,
  expanded,
  onToggle,
}) => {
  const height = useSharedValue(0);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: height.value > 0 ? 1 : 0,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  React.useEffect(() => {
    if (expanded) {
      height.value = withTiming(items.length * 30 + 20);
      rotation.value = withTiming(90);
    } else {
      height.value = withTiming(0);
      rotation.value = withTiming(0);
    }
  }, [expanded]);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitleText}>{title}</Text>
        </View>
        <Animated.Text style={[styles.arrow, arrowStyle]}>›</Animated.Text>
      </TouchableOpacity>
      
      <Animated.View style={[styles.sectionContent, animatedStyle]}>
        {items.map((item, index) => (
          <Animated.View
            key={index}
            entering={FadeIn.delay(index * 50)}
            layout={Layout}
            style={styles.item}
          >
            <Text style={styles.itemBullet}>•</Text>
            <Text style={styles.itemText}>{item}</Text>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
};

const aiStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    gap: 12,
  },
  recommendationIcon: {
    fontSize: 24,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  arrow: {
    fontSize: 20,
    color: '#94A3B8',
  },
  sectionContent: {
    backgroundColor: '#1E293B',
    marginTop: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    paddingVertical: 6,
    gap: 8,
  },
  itemBullet: {
    color: '#10B981',
    fontSize: 14,
  },
  itemText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
});

// src/components/proposals/VoteButtons.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface VoteButtonsProps {
  onVote: (vote: number) => void;
  selectedVote: number | null;
  disabled?: boolean;
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  onVote,
  selectedVote,
  disabled = false,
}) => {
  const renderVoteButton = (
    vote: number,
    label: string,
    icon: string,
    colors: string[]
  ) => {
    const scale = useSharedValue(1);
    const isSelected = selectedVote === vote;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : 1,
    }));

    const handlePressIn = () => {
      if (!disabled) {
        scale.value = withSpring(0.95);
      }
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    return (
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !disabled && onVote(vote)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          <LinearGradient
            colors={isSelected ? colors : ['#1E293B', '#1E293B']}
            style={[
              styles.button,
              isSelected && styles.selectedButton,
              { borderColor: colors[0] }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[
              styles.label,
              isSelected && styles.selectedLabel
            ]}>
              {label}
            </Text>
            {isSelected && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkIcon}>✓</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {renderVoteButton(1, 'SÍ', '✅', ['#10B981', '#059669'])}
      {renderVoteButton(2, 'NO', '❌', ['#EF4444', '#DC2626'])}
      {renderVoteButton(3, 'ABSTENCIÓN', '🤐', ['#F59E0B', '#D97706'])}
    </View>
  );
};

const voteStyles = StyleSheet.create({
  container: {
    gap: 12,
  },
  buttonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    gap: 12,
  },
  selectedButton: {
    borderWidth: 0,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
  checkmark: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

// src/components/common/FilterTabs.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface FilterOption {
  key: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  selected: string;
  onSelect: (key: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  options,
  selected,
  onSelect,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {options.map((option) => (
        <FilterTab
          key={option.key}
          option={option}
          isSelected={selected === option.key}
          onPress={() => onSelect(option.key)}
        />
      ))}
    </ScrollView>
  );
};

interface FilterTabProps {
  option: FilterOption;
  isSelected: boolean;
  onPress: () => void;
}

const FilterTab: React.FC<FilterTabProps> = ({ option, isSelected, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.tab,
          isSelected && styles.selectedTab
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={[
          styles.tabText,
          isSelected && styles.selectedTabText
        ]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const filterStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  content: {
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedTab: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
});

// Export all styles
export const styles = { ...aiStyles, ...voteStyles, ...filterStyles };