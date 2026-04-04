// frontend/src/utils/retryHelper.ts
// Sistema de reintentos automáticos para operaciones críticas con notificaciones éticas

interface RetryConfig {
  maxRetries?: number;
  backoffStrategy?: 'linear' | 'exponential' | 'fixed';
  baseDelay?: number;
  maxDelay?: number;
  operation?: string;
  criticalOperation?: boolean;
  userNotification?: boolean;
  retryCondition?: (error: Error) => boolean;
}

interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  retryLog: RetryAttempt[];
}

interface RetryAttempt {
  attempt: number;
  timestamp: Date;
  error?: string;
  delay: number;
  success: boolean;
}

interface NotificationManager {
  showRetryNotification: (attempt: number, maxRetries: number, operation: string) => void;
  showSuccessNotification: (operation: string, attempts: number) => void;
  showFailureNotification: (operation: string, attempts: number, error: string) => void;
}

// Operaciones críticas que requieren retry automático
const CRITICAL_OPERATIONS = {
  'signing': {
    maxRetries: 3,
    backoffStrategy: 'exponential' as const,
    baseDelay: 1000,
    userNotification: true,
    description: 'Firmando documento digitalmente'
  },
  'ipfs_upload': {
    maxRetries: 5,
    backoffStrategy: 'exponential' as const,
    baseDelay: 2000,
    userNotification: true,
    description: 'Subiendo a almacenamiento descentralizado'
  },
  'verification': {
    maxRetries: 3,
    backoffStrategy: 'linear' as const,
    baseDelay: 1500,
    userNotification: true,
    description: 'Verificando con la comunidad'
  },
  'store_mentor_profile': {
    maxRetries: 4,
    backoffStrategy: 'exponential' as const,
    baseDelay: 1000,
    userNotification: true,
    description: 'Guardando perfil de mentor'
  },
  'store_mentorship_ipfs': {
    maxRetries: 5,
    backoffStrategy: 'exponential' as const,
    baseDelay: 2000,
    userNotification: true,
    description: 'Almacenando mentoría'
  },
  'update_mentorship_communication': {
    maxRetries: 3,
    backoffStrategy: 'linear' as const,
    baseDelay: 1000,
    userNotification: false,
    description: 'Actualizando comunicación'
  }
};

export class RetryHelper {
  private notificationManager: NotificationManager;
  private retryStats: Map<string, number> = new Map();

  constructor(notificationManager?: NotificationManager) {
    this.notificationManager = notificationManager || this.createDefaultNotificationManager();
  }

  /**
   * Ejecuta una operación con reintentos automáticos
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const startTime = Date.now();
    const retryLog: RetryAttempt[] = [];
    
    // Configuración por defecto
    const finalConfig: Required<RetryConfig> = {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      operation: 'unknown_operation',
      criticalOperation: false,
      userNotification: true,
      retryCondition: (error: Error) => this.shouldRetry(error),
      ...config,
      // Usar configuración específica si la operación está definida
      ...(config.operation && CRITICAL_OPERATIONS[config.operation] ? CRITICAL_OPERATIONS[config.operation] : {})
    };

    let lastError: Error | null = null;
    let attempts = 0;

    for (attempts = 1; attempts <= finalConfig.maxRetries + 1; attempts++) {
      const attemptStart = Date.now();
      
      try {
        // Intentar ejecutar la operación
        const result = await operation();
        
        // Registrar intento exitoso
        retryLog.push({
          attempt: attempts,
          timestamp: new Date(),
          delay: 0,
          success: true
        });

        // Notificar éxito si hubo reintentos
        if (attempts > 1 && finalConfig.userNotification) {
          this.notificationManager.showSuccessNotification(
            finalConfig.operation,
            attempts
          );
        }

        // Actualizar estadísticas
        this.updateRetryStats(finalConfig.operation, attempts, true);

        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Registrar intento fallido
        retryLog.push({
          attempt: attempts,
          timestamp: new Date(),
          error: lastError.message,
          delay: 0,
          success: false
        });

        // Si es el último intento, no hacer retry
        if (attempts > finalConfig.maxRetries) {
          break;
        }

        // Verificar si se debe reintentar
        if (!finalConfig.retryCondition(lastError)) {
          break;
        }

        // Calcular delay para el siguiente intento
        const delay = this.calculateDelay(
          attempts,
          finalConfig.backoffStrategy,
          finalConfig.baseDelay,
          finalConfig.maxDelay
        );

        // Notificar al usuario sobre el reintento
        if (finalConfig.userNotification) {
          this.notificationManager.showRetryNotification(
            attempts,
            finalConfig.maxRetries,
            finalConfig.operation
          );
        }

        // Actualizar delay en el log
        retryLog[retryLog.length - 1].delay = delay;

        // Esperar antes del siguiente intento
        await this.delay(delay);
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    if (finalConfig.userNotification) {
      this.notificationManager.showFailureNotification(
        finalConfig.operation,
        attempts - 1,
        lastError?.message || 'Error desconocido'
      );
    }

    // Actualizar estadísticas de fallo
    this.updateRetryStats(finalConfig.operation, attempts - 1, false);

    // Lanzar el último error
    throw lastError || new Error('Operación falló después de múltiples intentos');
  }

  /**
   * Ejecuta múltiples operaciones con retry en paralelo
   */
  async executeMultipleWithRetry<T>(
    operations: Array<{
      operation: () => Promise<T>;
      config?: RetryConfig;
    }>
  ): Promise<T[]> {
    const promises = operations.map(({ operation, config }) =>
      this.executeWithRetry(operation, config)
    );

    return Promise.all(promises);
  }

  /**
   * Ejecuta operaciones en secuencia con retry
   */
  async executeSequentialWithRetry<T>(
    operations: Array<{
      operation: () => Promise<T>;
      config?: RetryConfig;
    }>
  ): Promise<T[]> {
    const results: T[] = [];

    for (const { operation, config } of operations) {
      const result = await this.executeWithRetry(operation, config);
      results.push(result);
    }

    return results;
  }

  /**
   * Método específico para operaciones de firma digital
   */
  async executeSigningWithRetry<T>(
    signingOperation: () => Promise<T>,
    additionalConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.executeWithRetry(signingOperation, {
      operation: 'signing',
      criticalOperation: true,
      ...additionalConfig
    });
  }

  /**
   * Método específico para subidas IPFS
   */
  async executeIPFSWithRetry<T>(
    ipfsOperation: () => Promise<T>,
    additionalConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.executeWithRetry(ipfsOperation, {
      operation: 'ipfs_upload',
      criticalOperation: true,
      ...additionalConfig
    });
  }

  /**
   * Método específico para verificaciones
   */
  async executeVerificationWithRetry<T>(
    verificationOperation: () => Promise<T>,
    additionalConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.executeWithRetry(verificationOperation, {
      operation: 'verification',
      criticalOperation: true,
      ...additionalConfig
    });
  }

  /**
   * Obtener estadísticas de reintentos
   */
  getRetryStats(): Record<string, { attempts: number; successes: number; failures: number }> {
    const stats: Record<string, { attempts: number; successes: number; failures: number }> = {};
    
    // Obtener datos del localStorage
    const storedStats = localStorage.getItem('shout_aloud_retry_stats');
    if (storedStats) {
      try {
        const parsed = JSON.parse(storedStats);
        Object.assign(stats, parsed);
      } catch (error) {
        console.warn('Error parsing retry stats:', error);
      }
    }

    return stats;
  }

  /**
   * Limpiar estadísticas de reintentos
   */
  clearRetryStats(): void {
    localStorage.removeItem('shout_aloud_retry_stats');
    this.retryStats.clear();
  }

  // === MÉTODOS PRIVADOS ===

  private calculateDelay(
    attempt: number,
    strategy: 'linear' | 'exponential' | 'fixed',
    baseDelay: number,
    maxDelay: number
  ): number {
    let delay: number;

    switch (strategy) {
      case 'linear':
        delay = baseDelay * attempt;
        break;
      case 'exponential':
        delay = baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = baseDelay;
        break;
    }

    // Añadir jitter aleatorio para evitar thundering herd
    const jitter = Math.random() * 0.3 * delay;
    delay += jitter;

    return Math.min(delay, maxDelay);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldRetry(error: Error): boolean {
    // Lista de errores que NO deben ser reintentados
    const nonRetryableErrors = [
      'ValidationError',
      'AuthenticationError', 
      'PermissionDenied',
      'InvalidSignature',
      'UserCancelled'
    ];

    // Lista de mensajes que indican errores no reintentables
    const nonRetryableMessages = [
      'usuario ya tiene mentor',
      'reputación insuficiente',
      'proyecto no encontrado',
      'acceso denegado'
    ];

    // Verificar nombre del error
    if (nonRetryableErrors.includes(error.constructor.name)) {
      return false;
    }

    // Verificar mensaje del error
    const errorMessage = error.message.toLowerCase();
    if (nonRetryableMessages.some(msg => errorMessage.includes(msg))) {
      return false;
    }

    // Lista de errores que SÍ deben ser reintentados
    const retryableMessages = [
      'network error',
      'timeout',
      'connection failed',
      'ipfs unavailable',
      'temporary failure',
      'service unavailable'
    ];

    return retryableMessages.some(msg => errorMessage.includes(msg)) || 
           errorMessage.includes('fetch');
  }

  private updateRetryStats(operation: string, attempts: number, success: boolean): void {
    try {
      const stats = this.getRetryStats();
      
      if (!stats[operation]) {
        stats[operation] = { attempts: 0, successes: 0, failures: 0 };
      }

      stats[operation].attempts += attempts;
      if (success) {
        stats[operation].successes++;
      } else {
        stats[operation].failures++;
      }

      localStorage.setItem('shout_aloud_retry_stats', JSON.stringify(stats));
    } catch (error) {
      console.warn('Error updating retry stats:', error);
    }
  }

  private createDefaultNotificationManager(): NotificationManager {
    return {
      showRetryNotification: (attempt: number, maxRetries: number, operation: string) => {
        const operationName = CRITICAL_OPERATIONS[operation]?.description || operation;
        console.log(`🔄 Reintentando ${operationName} (Intento ${attempt}/${maxRetries})`);
        
        // Mostrar notificación toast si está disponible
        if (typeof window !== 'undefined' && (window as any).showToast) {
          (window as any).showToast({
            type: 'info',
            title: 'Reintentando operación',
            message: `${operationName} - Intento ${attempt}/${maxRetries}`,
            duration: 3000,
            icon: '🔄'
          });
        }
      },

      showSuccessNotification: (operation: string, attempts: number) => {
        const operationName = CRITICAL_OPERATIONS[operation]?.description || operation;
        console.log(`✅ ${operationName} completada exitosamente después de ${attempts} intentos`);
        
        if (typeof window !== 'undefined' && (window as any).showToast) {
          (window as any).showToast({
            type: 'success',
            title: 'Operación exitosa',
            message: `${operationName} completada${attempts > 1 ? ` tras ${attempts} intentos` : ''}`,
            duration: 4000,
            icon: '✅'
          });
        }
      },

      showFailureNotification: (operation: string, attempts: number, error: string) => {
        const operationName = CRITICAL_OPERATIONS[operation]?.description || operation;
        console.error(`❌ ${operationName} falló después de ${attempts} intentos: ${error}`);
        
        if (typeof window !== 'undefined' && (window as any).showToast) {
          (window as any).showToast({
            type: 'error',
            title: 'Operación falló',
            message: `${operationName} no se pudo completar. ${error}`,
            duration: 6000,
            icon: '❌'
          });
        }
      }
    };
  }
}

// Instancia global del RetryHelper
let globalRetryHelper: RetryHelper | null = null;

/**
 * Obtener la instancia global del RetryHelper
 */
export const getRetryHelper = (): RetryHelper => {
  if (!globalRetryHelper) {
    globalRetryHelper = new RetryHelper();
  }
  return globalRetryHelper;
};

/**
 * Hook React para usar el RetryHelper
 */
export const useRetryHelper = () => {
  const retryHelper = useMemo(() => getRetryHelper(), []);
  
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryOperation, setRetryOperation] = useState<string>('');

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    config?: RetryConfig
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryOperation(config?.operation || 'unknown');
    
    try {
      const result = await retryHelper.executeWithRetry(operation, config);
      return result;
    } finally {
      setIsRetrying(false);
      setRetryOperation('');
    }
  }, [retryHelper]);

  return {
    retryHelper,
    executeWithRetry,
    isRetrying,
    retryOperation,
    retryStats: retryHelper.getRetryStats()
  };
};

// Funciones de utilidad para operaciones específicas
export const withRetry = {
  signing: <T>(operation: () => Promise<T>) => 
    getRetryHelper().executeSigningWithRetry(operation),
    
  ipfs: <T>(operation: () => Promise<T>) => 
    getRetryHelper().executeIPFSWithRetry(operation),
    
  verification: <T>(operation: () => Promise<T>) => 
    getRetryHelper().executeVerificationWithRetry(operation),
    
  custom: <T>(operation: () => Promise<T>, config?: RetryConfig) => 
    getRetryHelper().executeWithRetry(operation, config)
};

export default RetryHelper;