// platform/frontend-mobile/web/src/utils/GamificationEngine.ts

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: Date;
  category: 'participation' | 'moderation' | 'impact' | 'community';
  requirement: {
    type: 'count' | 'milestone' | 'quality';
    threshold: number;
    metric: string;
  };
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface UserParticipationData {
  did: string;
  proposalsCreated: number;
  votesParticipated: number;
  moderationsPerformed: number;
  successfulReports: number;
  highImpactValidations: number;
  communityHelpActions: number;
  daysActive: number;
  reputationScore: number;
}

class GamificationEngine {
  private achievements: Achievement[] = [];
  private userDataCache: Map<string, UserParticipationData> = new Map();

  constructor() {
    this.initializeAchievements();
    this.loadMockUserData();
  }

  private initializeAchievements() {
    this.achievements = [
      // Participación inicial
      {
        id: 'first-step',
        name: 'Primer Paso',
        icon: '🧩',
        description: 'Has creado tu primera propuesta ciudadana. ¡Bienvenido a la democracia participativa!',
        category: 'participation',
        requirement: { type: 'count', threshold: 1, metric: 'proposalsCreated' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'active-voice',
        name: 'Voz Activa',
        icon: '🗳️',
        description: 'Has participado en 5 votaciones. Tu opinión cuenta en la construcción de consensos.',
        category: 'participation',
        requirement: { type: 'count', threshold: 5, metric: 'votesParticipated' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'engaged-citizen',
        name: 'Ciudadano Comprometido',
        icon: '🔥',
        description: 'Has participado en 10 votaciones. Demuestras un compromiso constante con la democracia.',
        category: 'participation',
        requirement: { type: 'count', threshold: 10, metric: 'votesParticipated' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 10
      },
      
      // Moderación y cuidado comunitario
      {
        id: 'initial-moderator',
        name: 'Moderador Inicial',
        icon: '🤝',
        description: 'Has validado o reportado 3 propuestas. Ayudas a mantener la calidad del diálogo.',
        category: 'moderation',
        requirement: { type: 'count', threshold: 3, metric: 'moderationsPerformed' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 3
      },
      {
        id: 'system-defender',
        name: 'Defensor del Sistema',
        icon: '🛡️',
        description: 'Has reportado exitosamente 5 propuestas problemáticas. Proteges la integridad del espacio.',
        category: 'moderation',
        requirement: { type: 'count', threshold: 5, metric: 'successfulReports' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'community-guardian',
        name: 'Guardián Comunitario',
        icon: '🌟',
        description: 'Has realizado 15 moderaciones exitosas. Eres un pilar de la comunidad.',
        category: 'moderation',
        requirement: { type: 'count', threshold: 15, metric: 'moderationsPerformed' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 15
      },

      // Impacto y calidad
      {
        id: 'symbolic-constituent',
        name: 'Constituyente Simbólico',
        icon: '📜',
        description: 'Has validado 1 propuesta con alto impacto. Contribuyes a decisiones importantes.',
        category: 'impact',
        requirement: { type: 'count', threshold: 1, metric: 'highImpactValidations' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'change-catalyst',
        name: 'Catalizador de Cambio',
        icon: '⚡',
        description: 'Has validado 3 propuestas de alto impacto. Impulsas transformaciones significativas.',
        category: 'impact',
        requirement: { type: 'count', threshold: 3, metric: 'highImpactValidations' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 3
      },

      // Construcción de comunidad
      {
        id: 'helpful-neighbor',
        name: 'Vecino Solidario',
        icon: '🤲',
        description: 'Has ayudado a otros ciudadanos 5 veces. Fortaleces los lazos comunitarios.',
        category: 'community',
        requirement: { type: 'count', threshold: 5, metric: 'communityHelpActions' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'consistent-participant',
        name: 'Participante Constante',
        icon: '📅',
        description: 'Has estado activo por 30 días. Demuestras compromiso a largo plazo.',
        category: 'community',
        requirement: { type: 'count', threshold: 30, metric: 'daysActive' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 30
      },
      {
        id: 'trusted-citizen',
        name: 'Ciudadano de Confianza',
        icon: '💎',
        description: 'Has alcanzado 500 puntos de reputación. La comunidad confía en tu criterio.',
        category: 'impact',
        requirement: { type: 'milestone', threshold: 500, metric: 'reputationScore' },
        isUnlocked: false,
        progress: 0,
        maxProgress: 500
      }
    ];
  }

  private loadMockUserData() {
    // Datos simulados para diferentes usuarios
    const mockUsers: UserParticipationData[] = [
      {
        did: 'did:example:alice',
        proposalsCreated: 3,
        votesParticipated: 12,
        moderationsPerformed: 8,
        successfulReports: 2,
        highImpactValidations: 1,
        communityHelpActions: 6,
        daysActive: 25,
        reputationScore: 450
      },
      {
        did: 'did:example:bob',
        proposalsCreated: 1,
        votesParticipated: 6,
        moderationsPerformed: 3,
        successfulReports: 1,
        highImpactValidations: 0,
        communityHelpActions: 2,
        daysActive: 15,
        reputationScore: 280
      },
      {
        did: 'did:example:charlie',
        proposalsCreated: 0,
        votesParticipated: 2,
        moderationsPerformed: 1,
        successfulReports: 0,
        highImpactValidations: 0,
        communityHelpActions: 1,
        daysActive: 5,
        reputationScore: 120
      }
    ];

    mockUsers.forEach(user => {
      this.userDataCache.set(user.did, user);
    });
  }

  private getUserData(did: string): UserParticipationData {
    // Si no existe el usuario, crear datos por defecto
    if (!this.userDataCache.has(did)) {
      const defaultData: UserParticipationData = {
        did,
        proposalsCreated: 0,
        votesParticipated: 0,
        moderationsPerformed: 0,
        successfulReports: 0,
        highImpactValidations: 0,
        communityHelpActions: 0,
        daysActive: 1,
        reputationScore: 100
      };
      this.userDataCache.set(did, defaultData);
      return defaultData;
    }
    return this.userDataCache.get(did)!;
  }

  private calculateProgress(userData: UserParticipationData, achievement: Achievement): number {
    const metricValue = (userData as any)[achievement.requirement.metric] || 0;
    return Math.min(metricValue, achievement.requirement.threshold);
  }

  private isAchievementUnlocked(userData: UserParticipationData, achievement: Achievement): boolean {
    const metricValue = (userData as any)[achievement.requirement.metric] || 0;
    return metricValue >= achievement.requirement.threshold;
  }

  public async evaluateUserAchievements(did: string): Promise<Achievement[]> {
    const userData = this.getUserData(did);
    
    return this.achievements.map(achievement => {
      const progress = this.calculateProgress(userData, achievement);
      const isUnlocked = this.isAchievementUnlocked(userData, achievement);
      
      return {
        ...achievement,
        isUnlocked,
        progress,
        unlockedAt: isUnlocked ? new Date() : undefined
      };
    });
  }

  public async getUnlockedAchievements(did: string): Promise<Achievement[]> {
    const achievements = await this.evaluateUserAchievements(did);
    return achievements.filter(achievement => achievement.isUnlocked);
  }

  public async getProgressTowardsAchievements(did: string): Promise<Achievement[]> {
    const achievements = await this.evaluateUserAchievements(did);
    return achievements.filter(achievement => !achievement.isUnlocked && achievement.progress > 0);
  }

  public async getAchievementsByCategory(did: string, category: Achievement['category']): Promise<Achievement[]> {
    const achievements = await this.evaluateUserAchievements(did);
    return achievements.filter(achievement => achievement.category === category);
  }

  public async getUserStats(did: string): Promise<{
    totalAchievements: number;
    unlockedAchievements: number;
    categories: Record<Achievement['category'], { unlocked: number; total: number }>;
  }> {
    const achievements = await this.evaluateUserAchievements(did);
    const unlocked = achievements.filter(a => a.isUnlocked);
    
    const categories = {
      participation: { unlocked: 0, total: 0 },
      moderation: { unlocked: 0, total: 0 },
      impact: { unlocked: 0, total: 0 },
      community: { unlocked: 0, total: 0 }
    };

    achievements.forEach(achievement => {
      categories[achievement.category].total++;
      if (achievement.isUnlocked) {
        categories[achievement.category].unlocked++;
      }
    });

    return {
      totalAchievements: achievements.length,
      unlockedAchievements: unlocked.length,
      categories
    };
  }

  // Método para simular la actualización de datos del usuario
  public updateUserData(did: string, updates: Partial<UserParticipationData>): void {
    const currentData = this.getUserData(did);
    const updatedData = { ...currentData, ...updates };
    this.userDataCache.set(did, updatedData);
  }
}

// Instancia singleton
export const gamificationEngine = new GamificationEngine();

// Función principal para usar en componentes
export async function evaluateUserAchievements(did: string): Promise<Achievement[]> {
  return gamificationEngine.evaluateUserAchievements(did);
}

export async function getUserGamificationStats(did: string) {
  return gamificationEngine.getUserStats(did);
}