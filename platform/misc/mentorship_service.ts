// frontend/src/services/mentorService.ts
// Sistema de mentoría ética para acompañar nuevos ciudadanos sin jerarquías

interface MentorProfile {
  did: string;
  name: string;
  reputation: number;
  specialization: string[];
  municipality: string;
  isAvailable: boolean;
  maxMentees: number;
  currentMentees: number;
  mentoringSince: Date;
  languages: string[];
  timeAvailability: {
    days: string[];
    hours: string;
    timezone: string;
  };
  mentorshipApproach: string;
  totalMentorships: number;
  successRate: number;
}

interface MenteeProfile {
  did: string;
  name: string;
  reputation: number;
  municipality: string;
  interests: string[];
  goals: string[];
  preferredLanguage: string;
  timeAvailability: {
    days: string[];
    hours: string;
    timezone: string;
  };
  learningStyle: 'visual' | 'practical' | 'theoretical' | 'collaborative';
}

interface MentorshipMatch {
  id: string;
  mentorDid: string;
  menteeDid: string;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  status: 'active' | 'completed' | 'paused' | 'terminated';
  matchScore: number; // 0-100
  matchingCriteria: {
    geographicProximity: number;
    specializationMatch: number;
    personalityFit: number;
    timeCompatibility: number;
    languageMatch: number;
  };
  goals: MentorshipGoal[];
  milestones: MentorshipMilestone[];
  communications: MentorshipCommunication[];
  signatures: {
    mentorSignature: string;
    menteeSignature: string;
    platformSignature: string;
  };
  ipfsHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MentorshipGoal {
  id: string;
  title: string;
  description: string;
  targetReputationGain: number;
  estimatedDuration: string; // "2 weeks", "1 month"
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  evidenceHashes: string[];
}

interface MentorshipMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
  reputationReward: number;
  evidenceRequired: boolean;
  evidenceHashes: string[];
  verifiedBy?: string;
}

interface MentorshipCommunication {
  id: string;
  type: 'message' | 'meeting' | 'resource_share' | 'milestone_update';
  from: string; // DID
  to: string; // DID
  content: string;
  timestamp: Date;
  isPrivate: boolean;
  relatedGoalId?: string;
  relatedMilestoneId?: string;
}

interface MentorshipProgress {
  mentorshipId: string;
  reputationProgress: {
    initialReputation: number;
    currentReputation: number;
    targetReputation: number;
    progressPercentage: number;
  };
  goalsProgress: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  milestonesProgress: {
    total: number;
    completed: number;
    overdue: number;
    upcoming: number;
  };
  engagementMetrics: {
    totalInteractions: number;
    averageResponseTime: string;
    lastActivity: Date;
    weeklyActivity: number;
  };
  skillsAcquired: string[];
  recommendedNextSteps: string[];
}

// Servicio de Mentoría Ética
export class MentorshipManager {
  private didService: any;
  private reputationService: any;
  private retryHelper: any;

  constructor(didService: any, reputationService: any, retryHelper: any) {
    this.didService = didService;
    this.reputationService = reputationService;
    this.retryHelper = retryHelper;
  }

  // === GESTIÓN DE MENTORES ===

  async registerAsMentor(mentorData: Partial<MentorProfile>): Promise<MentorProfile> {
    try {
      const userDid = await this.didService.getCurrentDid();
      const userReputation = await this.reputationService.getUserReputation(userDid);

      // Validar elegibilidad como mentor
      if (userReputation.totalPoints < 70) {
        throw new Error('Se requiere reputación mínima de 70 puntos para ser mentor');
      }

      const mentorProfile: MentorProfile = {
        did: userDid,
        name: mentorData.name || 'Mentor Anónimo',
        reputation: userReputation.totalPoints,
        specialization: mentorData.specialization || [],
        municipality: mentorData.municipality || '',
        isAvailable: true,
        maxMentees: mentorData.maxMentees || 3,
        currentMentees: 0,
        mentoringSince: new Date(),
        languages: mentorData.languages || ['es'],
        timeAvailability: mentorData.timeAvailability || {
          days: ['monday', 'wednesday', 'friday'],
          hours: '18:00-20:00',
          timezone: 'Europe/Madrid'
        },
        mentorshipApproach: mentorData.mentorshipApproach || 'collaborative',
        totalMentorships: 0,
        successRate: 100
      };

      // Firmar perfil de mentor
      const signature = await this.didService.signData({
        action: 'register_mentor',
        data: mentorProfile,
        timestamp: new Date().toISOString()
      });

      // Almacenar con retry automático
      const result = await this.retryHelper.executeWithRetry(
        () => this.storeMentorProfile(mentorProfile, signature),
        { operation: 'store_mentor_profile' }
      );

      return result;
    } catch (error) {
      console.error('Error registering mentor:', error);
      throw error;
    }
  }

  async getAvailableMentors(criteria?: {
    municipality?: string;
    specialization?: string[];
    language?: string;
  }): Promise<MentorProfile[]> {
    try {
      const mentors = this.loadMentorsFromStorage();
      
      return mentors.filter(mentor => {
        if (!mentor.isAvailable || mentor.currentMentees >= mentor.maxMentees) {
          return false;
        }

        if (criteria?.municipality && mentor.municipality !== criteria.municipality) {
          return false;
        }

        if (criteria?.specialization && criteria.specialization.length > 0) {
          const hasMatchingSpecialization = criteria.specialization.some(spec => 
            mentor.specialization.includes(spec)
          );
          if (!hasMatchingSpecialization) return false;
        }

        if (criteria?.language && !mentor.languages.includes(criteria.language)) {
          return false;
        }

        return true;
      });
    } catch (error) {
      console.error('Error getting available mentors:', error);
      return [];
    }
  }

  // === ASIGNACIÓN AUTOMÁTICA DE MENTORES ===

  async autoAssignMentor(menteeData: Partial<MenteeProfile>): Promise<MentorshipMatch | null> {
    try {
      const userDid = await this.didService.getCurrentDid();
      const userReputation = await this.reputationService.getUserReputation(userDid);

      // Verificar elegibilidad para mentoría
      if (userReputation.totalPoints >= 30) {
        throw new Error('El usuario ya tiene suficiente reputación (≥30)');
      }

      // Verificar si ya tiene mentor asignado
      const existingMentorship = await this.getActiveMentorship(userDid);
      if (existingMentorship) {
        throw new Error('El usuario ya tiene una mentoría activa');
      }

      const menteeProfile: MenteeProfile = {
        did: userDid,
        name: menteeData.name || 'Ciudadano Nuevo',
        reputation: userReputation.totalPoints,
        municipality: menteeData.municipality || '',
        interests: menteeData.interests || [],
        goals: menteeData.goals || ['aumentar_reputacion', 'participar_comunidad'],
        preferredLanguage: menteeData.preferredLanguage || 'es',
        timeAvailability: menteeData.timeAvailability || {
          days: ['evening'],
          hours: '19:00-21:00',
          timezone: 'Europe/Madrid'
        },
        learningStyle: menteeData.learningStyle || 'collaborative'
      };

      // Encontrar mejor mentor
      const bestMentor = await this.findBestMentorMatch(menteeProfile);
      
      if (!bestMentor) {
        // Si no hay mentores disponibles, agregar a lista de espera
        await this.addToMentorshipWaitlist(menteeProfile);
        return null;
      }

      // Crear mentoría
      const mentorship = await this.createMentorship(bestMentor, menteeProfile);
      
      return mentorship;
    } catch (error) {
      console.error('Error auto-assigning mentor:', error);
      throw error;
    }
  }

  private async findBestMentorMatch(mentee: MenteeProfile): Promise<MentorProfile | null> {
    const availableMentors = await this.getAvailableMentors({
      municipality: mentee.municipality,
      language: mentee.preferredLanguage
    });

    if (availableMentors.length === 0) {
      return null;
    }

    // Calcular score de compatibilidad para cada mentor
    const mentorScores = availableMentors.map(mentor => {
      const score = this.calculateMentorshipCompatibility(mentor, mentee);
      return { mentor, score };
    });

    // Ordenar por mejor score
    mentorScores.sort((a, b) => b.score.total - a.score.total);

    return mentorScores[0].mentor;
  }

  private calculateMentorshipCompatibility(mentor: MentorProfile, mentee: MenteeProfile): {
    total: number;
    breakdown: {
      geographic: number;
      specialization: number;
      time: number;
      language: number;
      capacity: number;
    };
  } {
    const geographic = mentor.municipality === mentee.municipality ? 100 : 50;
    
    const specialization = mentee.interests.length > 0 
      ? mentee.interests.filter(interest => 
          mentor.specialization.some(spec => spec.includes(interest))
        ).length / mentee.interests.length * 100
      : 50;

    const language = mentor.languages.includes(mentee.preferredLanguage) ? 100 : 0;
    
    const capacity = (1 - (mentor.currentMentees / mentor.maxMentees)) * 100;
    
    const time = this.calculateTimeCompatibility(mentor.timeAvailability, mentee.timeAvailability);

    const total = (geographic * 0.2 + specialization * 0.3 + time * 0.2 + language * 0.2 + capacity * 0.1);

    return {
      total,
      breakdown: {
        geographic,
        specialization,
        time,
        language,
        capacity
      }
    };
  }

  private calculateTimeCompatibility(mentorTime: any, menteeTime: any): number {
    // Lógica simplificada para compatibilidad de horarios
    // En implementación real, se haría análisis más sofisticado
    if (mentorTime.timezone !== menteeTime.timezone) return 70;
    
    const mentorHours = mentorTime.hours.split('-');
    const menteeHours = menteeTime.hours.split('-');
    
    // Verificar solapamiento básico
    return 85; // Simplificado para demo
  }

  // === CREACIÓN DE MENTORÍAS ===

  private async createMentorship(mentor: MentorProfile, mentee: MenteeProfile): Promise<MentorshipMatch> {
    const mentorshipId = `mentorship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const mentorship: MentorshipMatch = {
      id: mentorshipId,
      mentorDid: mentor.did,
      menteeDid: mentee.did,
      startDate: new Date(),
      expectedEndDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000), // 3 meses
      status: 'active',
      matchScore: this.calculateMentorshipCompatibility(mentor, mentee).total,
      matchingCriteria: this.calculateMentorshipCompatibility(mentor, mentee).breakdown,
      goals: this.generateDefaultGoals(mentee),
      milestones: this.generateDefaultMilestones(),
      communications: [],
      signatures: {
        mentorSignature: '',
        menteeSignature: '',
        platformSignature: ''
      },
      ipfsHash: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Obtener firmas de ambas partes
    const mentorSignature = await this.requestMentorSignature(mentor.did, mentorship);
    const menteeSignature = await this.didService.signData({
      action: 'accept_mentorship',
      mentorshipId: mentorshipId,
      data: mentorship,
      timestamp: new Date().toISOString()
    });

    const platformSignature = await this.didService.signData({
      action: 'create_mentorship',
      mentorshipId: mentorshipId,
      participants: [mentor.did, mentee.did],
      timestamp: new Date().toISOString()
    });

    mentorship.signatures = {
      mentorSignature,
      menteeSignature,
      platformSignature
    };

    // Almacenar en IPFS simulado con retry
    const ipfsHash = await this.retryHelper.executeWithRetry(
      () => this.storeMentorshipInIPFS(mentorship),
      { operation: 'store_mentorship_ipfs' }
    );

    mentorship.ipfsHash = ipfsHash;

    // Actualizar contadores
    await this.updateMentorMenteeCount(mentor.did, 1);
    
    // Almacenar mentoría
    this.storeMentorship(mentorship);

    return mentorship;
  }

  private generateDefaultGoals(mentee: MenteeProfile): MentorshipGoal[] {
    return [
      {
        id: 'goal_1',
        title: 'Primera Participación Exitosa',
        description: 'Participar en tu primer proyecto comunitario y completar una tarea',
        targetReputationGain: 10,
        estimatedDuration: '2 semanas',
        status: 'pending',
        createdAt: new Date(),
        evidenceHashes: []
      },
      {
        id: 'goal_2',
        title: 'Contribución Verificada',
        description: 'Realizar una contribución que sea verificada positivamente por la comunidad',
        targetReputationGain: 15,
        estimatedDuration: '1 mes',
        status: 'pending',
        createdAt: new Date(),
        evidenceHashes: []
      },
      {
        id: 'goal_3',
        title: 'Alcanzar Reputación Independiente',
        description: 'Llegar a 30 puntos de reputación y graduarse del programa de mentoría',
        targetReputationGain: 30,
        estimatedDuration: '3 meses',
        status: 'pending',
        createdAt: new Date(),
        evidenceHashes: []
      }
    ];
  }

  private generateDefaultMilestones(): MentorshipMilestone[] {
    const today = new Date();
    return [
      {
        id: 'milestone_1',
        title: 'Orientación Inicial',
        description: 'Completar sesión de orientación sobre la plataforma',
        targetDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 semana
        status: 'pending',
        reputationReward: 5,
        evidenceRequired: false,
        evidenceHashes: []
      },
      {
        id: 'milestone_2',
        title: 'Primera Contribución',
        description: 'Realizar primera contribución en proyecto comunitario',
        targetDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 semanas
        status: 'pending',
        reputationReward: 10,
        evidenceRequired: true,
        evidenceHashes: []
      },
      {
        id: 'milestone_3',
        title: 'Verificación Comunitaria',
        description: 'Recibir primera verificación positiva de la comunidad',
        targetDate: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000), // 5 semanas
        status: 'pending',
        reputationReward: 15,
        evidenceRequired: true,
        evidenceHashes: []
      }
    ];
  }

  // === SEGUIMIENTO DE PROGRESO ===

  async getMentorshipProgress(mentorshipId: string): Promise<MentorshipProgress | null> {
    try {
      const mentorship = this.getMentorshipById(mentorshipId);
      if (!mentorship) return null;

      const currentReputation = await this.reputationService.getUserReputation(mentorship.menteeDid);
      const initialReputation = 0; // Asumiendo que empezó en 0

      const goalsStats = mentorship.goals.reduce((acc, goal) => {
        if (goal.status === 'completed') acc.completed++;
        else if (goal.status === 'in_progress') acc.inProgress++;
        else acc.pending++;
        return acc;
      }, { total: mentorship.goals.length, completed: 0, inProgress: 0, pending: 0 });

      const milestonesStats = mentorship.milestones.reduce((acc, milestone) => {
        if (milestone.status === 'completed') acc.completed++;
        else if (milestone.status === 'overdue') acc.overdue++;
        else acc.upcoming++;
        return acc;
      }, { total: mentorship.milestones.length, completed: 0, overdue: 0, upcoming: 0 });

      const progress: MentorshipProgress = {
        mentorshipId,
        reputationProgress: {
          initialReputation,
          currentReputation: currentReputation.totalPoints,
          targetReputation: 30,
          progressPercentage: Math.min((currentReputation.totalPoints / 30) * 100, 100)
        },
        goalsProgress: goalsStats,
        milestonesProgress: milestonesStats,
        engagementMetrics: {
          totalInteractions: mentorship.communications.length,
          averageResponseTime: '2 horas', // Simplificado
          lastActivity: mentorship.communications[mentorship.communications.length - 1]?.timestamp || mentorship.createdAt,
          weeklyActivity: 5 // Simplificado
        },
        skillsAcquired: this.extractSkillsFromCompletedGoals(mentorship.goals),
        recommendedNextSteps: this.generateRecommendedNextSteps(mentorship, currentReputation.totalPoints)
      };

      return progress;
    } catch (error) {
      console.error('Error getting mentorship progress:', error);
      return null;
    }
  }

  private extractSkillsFromCompletedGoals(goals: MentorshipGoal[]): string[] {
    return goals
      .filter(goal => goal.status === 'completed')
      .map(goal => goal.title.toLowerCase().replace(/\s+/g, '_'));
  }

  private generateRecommendedNextSteps(mentorship: MentorshipMatch, currentReputation: number): string[] {
    const steps: string[] = [];

    if (currentReputation < 10) {
      steps.push('Completa tu perfil y únete a tu primer proyecto');
      steps.push('Participa en discusiones comunitarias');
    } else if (currentReputation < 20) {
      steps.push('Contribuye evidencia verificable a proyectos');
      steps.push('Ayuda a otros ciudadanos nuevos');
    } else if (currentReputation < 30) {
      steps.push('Lidera una iniciativa pequeña');
      steps.push('Verifica contribuciones de otros miembros');
    } else {
      steps.push('¡Felicidades! Ya puedes graduarte de la mentoría');
      steps.push('Considera convertirte en mentor de otros');
    }

    return steps;
  }

  // === GESTIÓN DE COMUNICACIONES ===

  async addCommunication(mentorshipId: string, communication: Omit<MentorshipCommunication, 'id' | 'timestamp'>): Promise<void> {
    try {
      const mentorship = this.getMentorshipById(mentorshipId);
      if (!mentorship) throw new Error('Mentoría no encontrada');

      const newCommunication: MentorshipCommunication = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ...communication
      };

      mentorship.communications.push(newCommunication);
      mentorship.updatedAt = new Date();

      // Actualizar en almacenamiento con retry
      await this.retryHelper.executeWithRetry(
        () => this.updateMentorshipStorage(mentorship),
        { operation: 'update_mentorship_communication' }
      );

    } catch (error) {
      console.error('Error adding communication:', error);
      throw error;
    }
  }

  // === VERIFICACIÓN ÉTICA ===

  async verifyMentorshipEthically(mentorshipId: string): Promise<{
    isEthical: boolean;
    verificationHash: string;
    publicEvidence: any;
  }> {
    try {
      const mentorship = this.getMentorshipById(mentorshipId);
      if (!mentorship) throw new Error('Mentoría no encontrada');

      // Crear evidencia pública (sin exponer identidades)
      const publicEvidence = {
        mentorshipId,
        startDate: mentorship.startDate,
        duration: Math.floor((Date.now() - mentorship.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        milestonesCompleted: mentorship.milestones.filter(m => m.status === 'completed').length,
        totalMilestones: mentorship.milestones.length,
        goalsAchieved: mentorship.goals.filter(g => g.status === 'completed').length,
        totalGoals: mentorship.goals.length,
        isActive: mentorship.status === 'active',
        hasValidSignatures: this.validateMentorshipSignatures(mentorship),
        municipality: 'hidden_for_privacy', // No exponer ubicación exacta
        matchScore: mentorship.matchScore
      };

      // Generar hash verificable
      const verificationHash = await this.generateVerificationHash(publicEvidence);

      return {
        isEthical: true,
        verificationHash,
        publicEvidence
      };
    } catch (error) {
      console.error('Error verifying mentorship ethically:', error);
      throw error;
    }
  }

  // === MÉTODOS PRIVADOS ===

  private async requestMentorSignature(mentorDid: string, mentorship: MentorshipMatch): Promise<string> {
    // En implementación real, enviaría notificación al mentor
    // Por ahora, simulamos que el mentor acepta automáticamente
    return this.didService.signData({
      action: 'accept_mentee',
      mentorshipId: mentorship.id,
      menteeDid: mentorship.menteeDid,
      timestamp: new Date().toISOString()
    });
  }

  private async storeMentorProfile(mentor: MentorProfile, signature: string): Promise<MentorProfile> {
    const mentors = this.loadMentorsFromStorage();
    mentors.push(mentor);
    
    localStorage.setItem('shout_aloud_mentors', JSON.stringify(mentors));
    
    // Simular almacenamiento en IPFS
    const ipfsHash = await this.generateIPFSHash({ mentor, signature });
    localStorage.setItem(`mentor_ipfs_${mentor.did}`, ipfsHash);
    
    return mentor;
  }

  private loadMentorsFromStorage(): MentorProfile[] {
    try {
      const stored = localStorage.getItem('shout_aloud_mentors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private storeMentorship(mentorship: MentorshipMatch): void {
    const mentorships = this.loadMentorshipsFromStorage();
    mentorships.push(mentorship);
    localStorage.setItem('shout_aloud_mentorships', JSON.stringify(mentorships));
  }

  private loadMentorshipsFromStorage(): MentorshipMatch[] {
    try {
      const stored = localStorage.getItem('shout_aloud_mentorships');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getMentorshipById(id: string): MentorshipMatch | null {
    const mentorships = this.loadMentorshipsFromStorage();
    return mentorships.find(m => m.id === id) || null;
  }

  private async getActiveMentorship(userDid: string): Promise<MentorshipMatch | null> {
    const mentorships = this.loadMentorshipsFromStorage();
    return mentorships.find(m => 
      (m.mentorDid === userDid || m.menteeDid === userDid) && 
      m.status === 'active'
    ) || null;
  }

  private async addToMentorshipWaitlist(mentee: MenteeProfile): Promise<void> {
    const waitlist = JSON.parse(localStorage.getItem('mentorship_waitlist') || '[]');
    waitlist.push({
      ...mentee,
      addedToWaitlist: new Date(),
      notified: false
    });
    localStorage.setItem('mentorship_waitlist', JSON.stringify(waitlist));
  }

  private async updateMentorMenteeCount(mentorDid: string, increment: number): Promise<void> {
    const mentors = this.loadMentorsFromStorage();
    const mentor = mentors.find(m => m.did === mentorDid);
    if (mentor) {
      mentor.currentMentees += increment;
      localStorage.setItem('shout_aloud_mentors', JSON.stringify(mentors));
    }
  }

  private async storeMentorshipInIPFS(mentorship: MentorshipMatch): Promise<string> {
    const content = JSON.stringify(mentorship);
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `QmMentorship${hashHex.substring(0, 40)}`;
  }

  private async updateMentorshipStorage(mentorship: MentorshipMatch): Promise<void> {
    const mentorships = this.loadMentorshipsFromStorage();
    const index = mentorships.findIndex(m => m.id === mentorship.id);
    if (index !== -1) {
      mentorships[index] = mentorship;
      localStorage.setItem('shout_aloud_mentorships', JSON.stringify(mentorships));
    }
  }

  private validateMentorshipSignatures(mentorship: MentorshipMatch): boolean {
    return !!(mentorship.signatures.mentorSignature && 
             mentorship.signatures.menteeSignature && 
             mentorship.signatures.platformSignature);
  }

  private async generateVerificationHash(data: any): Promise<string> {
    const content = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async generateIPFSHash(data: any): Promise<string> {
    const content = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `QmMentor${hashHex.substring(0, 42)}`;
  }
}

// Hook React para usar el servicio de mentoría
export const useMentorshipService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Asumir que estos servicios están disponibles globalmente o por contexto
  const didService = (window as any).didService;
  const reputationService = (window as any).reputationService;
  const retryHelper = (window as any).retryHelper;

  const mentorshipManager = useMemo(() => {
    return new MentorshipManager(didService, reputationService, retryHelper);
  }, [didService, reputationService, retryHelper]);

  const executeAction = useCallback(async <T>(
    action: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await action();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Mentorship service error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mentorshipManager,
    loading,
    error,
    executeAction
  };
};

export default MentorshipManager;