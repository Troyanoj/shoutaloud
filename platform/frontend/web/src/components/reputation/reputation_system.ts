// reputation_engine.ts
import { createHash } from 'crypto';

export interface ReputationAction {
  id: string;
  userId: string;
  type: ReputationActionType;
  points: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  hash: string;
}

export type ReputationActionType = 
  | 'create_proposal'
  | 'support_proposal'
  | 'reject_proposal'
  | 'confirm_moderation'
  | 'report_moderation'
  | 'false_report_penalty'
  | 'spam_proposal_penalty';

export interface ReputationLevel {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  benefits?: string[];
}

export interface UserReputation {
  userId: string;
  totalPoints: number;
  level: ReputationLevel;
  actions: ReputationAction[];
  lastUpdated: Date;
}

export class ReputationEngine {
  private static readonly POINT_VALUES: Record<ReputationActionType, number> = {
    create_proposal: 5,
    support_proposal: 2,
    reject_proposal: 1,
    confirm_moderation: 2,
    report_moderation: 3,
    false_report_penalty: -5,
    spam_proposal_penalty: -10,
  };

  private static readonly LEVELS: ReputationLevel[] = [
    {
      name: 'Ciudadano Nuevo',
      minPoints: 0,
      maxPoints: 20,
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '🟢',
      benefits: ['Participación básica en propuestas']
    },
    {
      name: 'Participante Activo',
      minPoints: 21,
      maxPoints: 50,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '🔵',
      benefits: ['Notificaciones avanzadas', 'Historial extendido']
    },
    {
      name: 'Voz de Confianza',
      minPoints: 51,
      maxPoints: 100,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '🟣',
      benefits: ['Moderación colaborativa', 'Filtros personalizados']
    },
    {
      name: 'Líder Comunitario',
      minPoints: 101,
      maxPoints: Infinity,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '🟡',
      benefits: ['Propuestas destacadas', 'Mentorías comunitarias']
    }
  ];

  static calculatePoints(actionType: ReputationActionType): number {
    return this.POINT_VALUES[actionType] || 0;
  }

  static getLevelByPoints(points: number): ReputationLevel {
    return this.LEVELS.find(level => 
      points >= level.minPoints && points <= level.maxPoints
    ) || this.LEVELS[0];
  }

  static createAction(
    userId: string,
    type: ReputationActionType,
    metadata?: Record<string, any>
  ): ReputationAction {
    const points = this.calculatePoints(type);
    const timestamp = new Date();
    const id = `${userId}_${type}_${timestamp.getTime()}`;
    
    // Crear hash verificable para integridad
    const hashData = `${id}${userId}${type}${points}${timestamp.toISOString()}`;
    const hash = createHash('sha256').update(hashData).digest('hex');

    return {
      id,
      userId,
      type,
      points,
      timestamp,
      metadata,
      hash
    };
  }

  static verifyAction(action: ReputationAction): boolean {
    const hashData = `${action.id}${action.userId}${action.type}${action.points}${action.timestamp.toISOString()}`;
    const expectedHash = createHash('sha256').update(hashData).digest('hex');
    return expectedHash === action.hash;
  }

  static calculateUserReputation(actions: ReputationAction[]): UserReputation {
    const validActions = actions.filter(action => this.verifyAction(action));
    const totalPoints = Math.max(0, validActions.reduce((sum, action) => sum + action.points, 0));
    const level = this.getLevelByPoints(totalPoints);
    
    return {
      userId: validActions[0]?.userId || '',
      totalPoints,
      level,
      actions: validActions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      lastUpdated: new Date()
    };
  }

  static getProgressToNextLevel(currentPoints: number): { 
    current: ReputationLevel; 
    next?: ReputationLevel; 
    progress: number; 
    pointsNeeded: number; 
  } {
    const current = this.getLevelByPoints(currentPoints);
    const currentIndex = this.LEVELS.indexOf(current);
    const next = currentIndex < this.LEVELS.length - 1 ? this.LEVELS[currentIndex + 1] : undefined;
    
    if (!next) {
      return { current, progress: 100, pointsNeeded: 0 };
    }

    const rangeSize = next.minPoints - current.minPoints;
    const userProgress = currentPoints - current.minPoints;
    const progress = Math.min(100, (userProgress / rangeSize) * 100);
    const pointsNeeded = next.minPoints - currentPoints;

    return { current, next, progress, pointsNeeded };
  }
}

// useReputationService.ts
import { useState, useEffect, useCallback } from 'react';
import { ReputationEngine, UserReputation, ReputationAction, ReputationActionType } from './reputation_engine';

interface ReputationService {
  getUserReputation: (userId: string) => Promise<UserReputation | null>;
  incrementReputation: (userId: string, type: ReputationActionType, metadata?: Record<string, any>) => Promise<void>;
  getReputationHistory: (userId: string, limit?: number) => Promise<ReputationAction[]>;
  subscribeToReputationChanges: (userId: string, callback: (reputation: UserReputation) => void) => () => void;
}

// Mock implementation - en producción se conectaría a la blockchain/base de datos
class MockReputationService implements ReputationService {
  private static instance: MockReputationService;
  private userReputations: Map<string, ReputationAction[]> = new Map();
  private subscribers: Map<string, ((reputation: UserReputation) => void)[]> = new Map();

  static getInstance(): MockReputationService {
    if (!MockReputationService.instance) {
      MockReputationService.instance = new MockReputationService();
    }
    return MockReputationService.instance;
  }

  async getUserReputation(userId: string): Promise<UserReputation | null> {
    const actions = this.userReputations.get(userId) || [];
    if (actions.length === 0) {
      return {
        userId,
        totalPoints: 0,
        level: ReputationEngine.getLevelByPoints(0),
        actions: [],
        lastUpdated: new Date()
      };
    }
    return ReputationEngine.calculateUserReputation(actions);
  }

  async incrementReputation(
    userId: string, 
    type: ReputationActionType, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const action = ReputationEngine.createAction(userId, type, metadata);
    const existingActions = this.userReputations.get(userId) || [];
    const updatedActions = [...existingActions, action];
    
    this.userReputations.set(userId, updatedActions);
    
    // Notificar suscriptores
    const reputation = ReputationEngine.calculateUserReputation(updatedActions);
    const callbacks = this.subscribers.get(userId) || [];
    callbacks.forEach(callback => callback(reputation));
  }

  async getReputationHistory(userId: string, limit = 50): Promise<ReputationAction[]> {
    const actions = this.userReputations.get(userId) || [];
    return actions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  subscribeToReputationChanges(
    userId: string, 
    callback: (reputation: UserReputation) => void
  ): () => void {
    const callbacks = this.subscribers.get(userId) || [];
    callbacks.push(callback);
    this.subscribers.set(userId, callbacks);

    return () => {
      const updatedCallbacks = this.subscribers.get(userId)?.filter(cb => cb !== callback) || [];
      this.subscribers.set(userId, updatedCallbacks);
    };
  }
}

export function useReputationService() {
  const service = MockReputationService.getInstance();
  
  const [userReputation, setUserReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserReputation = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const reputation = await service.getUserReputation(userId);
      setUserReputation(reputation);
      return reputation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener reputación');
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const incrementReputation = useCallback(async (
    userId: string, 
    type: ReputationActionType, 
    metadata?: Record<string, any>
  ) => {
    try {
      await service.incrementReputation(userId, type, metadata);
      // Actualizar reputación local
      await getUserReputation(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar reputación');
      throw err;
    }
  }, [service, getUserReputation]);

  const getReputationHistory = useCallback(async (userId: string, limit?: number) => {
    try {
      return await service.getReputationHistory(userId, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener historial');
      return [];
    }
  }, [service]);

  const subscribeToReputationChanges = useCallback((
    userId: string, 
    callback: (reputation: UserReputation) => void
  ) => {
    return service.subscribeToReputationChanges(userId, callback);
  }, [service]);

  return {
    userReputation,
    loading,
    error,
    getUserReputation,
    incrementReputation,
    getReputationHistory,
    subscribeToReputationChanges
  };
}

// ReputationBadge.tsx
import React, { useState } from 'react';
import { UserReputation, ReputationEngine } from './reputation_engine';

interface ReputationBadgeProps {
  reputation: UserReputation;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hideOnUserRequest?: boolean;
  className?: string;
}

export function ReputationBadge({ 
  reputation, 
  showProgress = false, 
  size = 'md', 
  hideOnUserRequest = false,
  className = '' 
}: ReputationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [userHiddenBadge, setUserHiddenBadge] = useState(false);

  if (hideOnUserRequest && userHiddenBadge) {
    return null;
  }

  const { level, totalPoints } = reputation;
  const progress = ReputationEngine.getProgressToNextLevel(totalPoints);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-full border font-medium
          ${level.color} ${sizeClasses[size]}
          cursor-help transition-all duration-200 hover:shadow-md
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        role="img"
        aria-label={`Reputación: ${level.name} con ${totalPoints} puntos`}
      >
        <span className={iconSizes[size]} role="img" aria-hidden="true">
          {level.icon}
        </span>
        <span>{level.name}</span>
        {size !== 'sm' && (
          <span className="opacity-75">({totalPoints})</span>
        )}
      </div>

      {/* Tooltip detallado */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="text-sm">
            <div className="font-semibold text-gray-900 mb-1">
              {level.icon} {level.name}
            </div>
            <div className="text-gray-600 mb-2">
              {totalPoints} puntos totales
            </div>
            
            {progress.next && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progreso al siguiente nivel</span>
                  <span>{progress.pointsNeeded} puntos restantes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(progress.progress)}% hacia {progress.next.icon} {progress.next.name}
                </div>
              </div>
            )}

            {level.benefits && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Beneficios:</div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {level.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {hideOnUserRequest && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setUserHiddenBadge(true)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Ocultar mi insignia
              </button>
            </div>
          )}

          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200" />
        </div>
      )}
    </div>
  );
}

// Componente de progreso independiente
export function ReputationProgress({ reputation }: { reputation: UserReputation }) {
  const progress = ReputationEngine.getProgressToNextLevel(reputation.totalPoints);
  
  if (!progress.next) {
    return (
      <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
        <div className="text-lg font-bold text-yellow-800 mb-1">
          🏆 ¡Nivel Máximo Alcanzado!
        </div>
        <div className="text-sm text-yellow-700">
          Has llegado al nivel más alto de la comunidad
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Progreso hacia {progress.next.icon} {progress.next.name}
        </span>
        <span className="text-xs text-gray-500">
          {progress.pointsNeeded} puntos restantes
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-600 text-center">
        {Math.round(progress.progress)}% completado
      </div>
    </div>
  );
}

// Ejemplo de integración en ProposalDetailPage.tsx
import React, { useEffect } from 'react';
import { ReputationBadge } from './ReputationBadge';
import { useReputationService } from './useReputationService';

interface ProposalDetailPageProps {
  proposal: {
    id: string;
    title: string;
    description: string;
    authorId: string;
    authorName: string;
    // ... otros campos
  };
}

export function ProposalDetailPage({ proposal }: ProposalDetailPageProps) {
  const { getUserReputation, userReputation, loading } = useReputationService();

  useEffect(() => {
    getUserReputation(proposal.authorId);
  }, [proposal.authorId, getUserReputation]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header de la propuesta */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {proposal.title}
        </h1>
        
        {/* Información del autor con reputación */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {proposal.authorName.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {proposal.authorName}
            </div>
            <div className="text-sm text-gray-600">
              Autor de la propuesta
            </div>
          </div>
          
          {/* Badge de reputación del autor */}
          {userReputation && !loading && (
            <ReputationBadge 
              reputation={userReputation} 
              size="md"
              className="ml-auto"
            />
          )}
          
          {loading && (
            <div className="w-20 h-6 bg-gray-200 animate-pulse rounded-full" />
          )}
        </div>
        
        <div className="prose max-w-none text-gray-700">
          {proposal.description}
        </div>
      </div>
      
      {/* Resto del contenido de la propuesta */}
      {/* ... */}
    </div>
  );
}