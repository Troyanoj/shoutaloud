// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// src/hooks/useProposals.ts
import { useQuery } from '@tanstack/react-query';
import { proposalsApi } from '../services/api/proposalsApi';
import { useIdentityStore } from '../stores/identityStore';

export const useProposals = (scope: string = 'all') => {
  const municipalityCode = useIdentityStore((state) => state.municipalityCode);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['proposals', scope, municipalityCode],
    queryFn: () => proposalsApi.getProposals(scope, municipalityCode),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000,
  });

  return {
    proposals: data?.proposals || [],
    isLoading,
    error,
    refetch,
  };
};

// src/hooks/useVoting.ts
import { useMutation } from '@tanstack/react-query';
import { votingService } from '../services/blockchain/voting';
import { useIdentityStore } from '../stores/identityStore';
import { generateVoteProof } from '../utils/zkProofs';

export const useVoting = () => {
  const { userDID, identityCommitment } = useIdentityStore();

  const castVoteMutation = useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: number; vote: number }) => {
      // Generate unique nullifier for this vote
      const voteNullifier = await generateVoteNullifier(proposalId, userDID);
      
      // Generate ZK proof
      const proof = await generateVoteProof(
        proposalId,
        identityCommitment,
        vote,
        voteNullifier
      );
      
      // Submit vote to blockchain
      return votingService.castVote(
        proposalId,
        identityCommitment,
        vote,
        voteNullifier,
        proof
      );
    },
  });

  const castVote = async (proposalId: number, vote: number) => {
    try {
      const result = await castVoteMutation.mutateAsync({ proposalId, vote });
      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    castVote,
    isVoting: castVoteMutation.isLoading,
  };
};

const generateVoteNullifier = async (proposalId: number, did: string): Promise<string> => {
  // Generate unique nullifier for this specific vote
  const data = `vote_${proposalId}_${did}_${Date.now()}`;
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// src/hooks/useAIAnalysis.ts
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../services/api/aiApi';

export const useAIAnalysis = (proposalId: number) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-analysis', proposalId],
    queryFn: () => aiApi.analyzeProposal(proposalId),
    staleTime: Infinity, // AI analysis doesn't change
    cacheTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });

  return {
    analysis: data?.analysis || null,
    isLoading,
    error,
  };
};

// src/hooks/useRealTimeResults.ts
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { votingApi } from '../services/api/votingApi';
import { votingService } from '../services/blockchain/voting';

export const useRealTimeResults = (proposalId: number) => {
  const [isActive, setIsActive] = useState(true);

  // Fetch results from API with frequent polling
  const { data, refetch } = useQuery({
    queryKey: ['results', proposalId],
    queryFn: () => votingApi.getResults(proposalId),
    refetchInterval: isActive ? 5000 : false, // Poll every 5 seconds if active
  });

  // Subscribe to blockchain events for real-time updates
  useEffect(() => {
    const unsubscribe = votingService.subscribeToVoteEvents(
      proposalId,
      (voteData) => {
        // Trigger refetch when new vote is detected
        refetch();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [proposalId, refetch]);

  // Check if voting is still active
  useEffect(() => {
    const checkActive = async () => {
      const status = await votingService.isProposalActive(proposalId);
      setIsActive(status);
    };
    
    checkActive();
    const interval = setInterval(checkActive, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [proposalId]);

  return {
    results: data?.results || {
      yes: 0,
      no: 0,
      abstain: 0,
      participationRate: 0,
    },
    zoneStats: data?.zoneStats || [],
    isActive,
    refetch,
  };
};

// src/services/api/proposalsApi.ts
import { API_BASE_URL } from '../../utils/constants';

interface Proposal {
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
  ipfsHash: string;
}

class ProposalsApi {
  async getProposals(scope: string, municipalityCode: number): Promise<{ proposals: Proposal[] }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/proposals?scope=${scope}&municipality=${municipalityCode}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching proposals:', error);
      // Return mock data for development
      return { proposals: this.getMockProposals() };
    }
  }

  async getProposalDetails(proposalId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch proposal details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      throw error;
    }
  }

  private getMockProposals(): Proposal[] {
    return [
      {
        id: 1,
        title: 'Mejora del Sistema de Transporte Público Municipal',
        category: 'infrastructure',
        scope: 'municipal',
        summary: 'Propuesta para modernizar la flota de autobuses y ampliar las rutas de transporte público en zonas desatendidas.',
        location: 'Benito Juárez, CDMX',
        daysLeft: 15,
        currentVotes: {
          yes: 3420,
          no: 890,
          abstain: 230,
        },
        aiRecommendation: 'Recomendado: Mejorará movilidad y reducirá emisiones',
        ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      },
      {
        id: 2,
        title: 'Reforma Fiscal para Pequeñas Empresas',
        category: 'economy',
        scope: 'state',
        summary: 'Reducción de impuestos para PyMEs con menos de 50 empleados para fomentar el empleo local.',
        location: 'Ciudad de México',
        daysLeft: 22,
        currentVotes: {
          yes: 12580,
          no: 8920,
          abstain: 1500,
        },
        aiRecommendation: 'Neutral: Beneficia PyMEs pero reduce ingresos públicos',
        ipfsHash: 'QmYwAPJzv5CZsnAzt8auVZRn3xY6rHJwh8ktDTpN5yQmJq',
      },
    ];
  }
}

export const proposalsApi = new ProposalsApi();

// src/services/api/votingApi.ts
interface VotingResults {
  results: {
    yes: number;
    no: number;
    abstain: number;
    participationRate: number;
  };
  zoneStats: Array<{
    zone: string;
    zoneCode: number;
    votes: {
      yes: number;
      no: number;
      abstain: number;
    };
    participation: number;
  }>;
}

class VotingApi {
  async getResults(proposalId: number): Promise<VotingResults> {
    try {
      const response = await fetch(`${API_BASE_URL}/voting/results/${proposalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching results:', error);
      // Return mock data for development
      return this.getMockResults();
    }
  }

  private getMockResults(): VotingResults {
    return {
      results: {
        yes: 3420,
        no: 890,
        abstain: 230,
        participationRate: 45.4,
      },
      zoneStats: [
        {
          zone: 'Benito Juárez',
          zoneCode: 9015,
          votes: {
            yes: 1200,
            no: 300,
            abstain: 80,
          },
          participation: 52.3,
        },
        {
          zone: 'Miguel Hidalgo',
          zoneCode: 9016,
          votes: {
            yes: 980,
            no: 250,
            abstain: 70,
          },
          participation: 48.1,
        },
      ],
    };
  }
}

export const votingApi = new VotingApi();

// src/services/api/aiApi.ts
interface AIAnalysisResponse {
  analysis: {
    personalImpact: string[];
    communityImpact: string[];
    beneficiaries: string[];
    potentialRisks: string[];
    recommendation: {
      type: 'positive' | 'negative' | 'neutral';
      reason: string;
    };
  };
}

class AIApi {
  async analyzeProposal(proposalId: number): Promise<AIAnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/analyze/${proposalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get AI analysis');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      // Return mock analysis for development
      return this.getMockAnalysis(proposalId);
    }
  }

  private getMockAnalysis(proposalId: number): AIAnalysisResponse {
    return {
      analysis: {
        personalImpact: [
          'Reducción de tiempos de traslado en 30%',
          'Menor costo de transporte mensual',
          'Acceso a más zonas de la ciudad',
        ],
        communityImpact: [
          'Reducción de emisiones de CO2 en 25%',
          'Creación de 500 empleos directos',
          'Mejor conectividad entre zonas marginadas',
        ],
        beneficiaries: [
          'Trabajadores (65%): Mejor acceso a empleos',
          'Estudiantes (20%): Transporte a escuelas',
          'Adultos mayores (15%): Movilidad mejorada',
        ],
        potentialRisks: [
          'Aumento temporal de tráfico durante construcción',
          'Costo inicial elevado para el municipio',
        ],
        recommendation: {
          type: 'positive',
          reason: 'Los beneficios a largo plazo superan ampliamente los costos iniciales. Mejorará significativamente la calidad de vida de los ciudadanos.',
        },
      },
    };
  }
}

export const aiApi = new AIApi();

// src/services/blockchain/voting.ts
import { ethers } from 'ethers';
import { VOTING_CONTRACT_ADDRESS, VOTING_ABI } from '../../utils/constants';
import { secureStorage } from '../storage/secureStorage';

class VotingService {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      'https://polygon-rpc.com'
    );
    this.contract = new ethers.Contract(
      VOTING_CONTRACT_ADDRESS,
      VOTING_ABI,
      this.provider
    );
  }

  async castVote(
    proposalId: number,
    identityCommitment: string,
    vote: number,
    nullifier: string,
    proof: any
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Get user's wallet from secure storage
      const privateKey = await secureStorage.getPrivateKey();
      if (!privateKey) {
        throw new Error('No wallet found');
      }

      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);

      // Format proof for contract
      const formattedProof = this.formatProof(proof);

      // Estimate gas
      const gasEstimate = await contractWithSigner.estimateGas.castVote(
        proposalId,
        identityCommitment,
        vote,
        nullifier,
        formattedProof,
        [] // Empty merkle proof
      );

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate.mul(120).div(100);

      // Submit transaction
      const tx = await contractWithSigner.castVote(
        proposalId,
        identityCommitment,
        vote,
        nullifier,
        formattedProof,
        [],
        { gasLimit }
      );

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Vote casting error:', error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  async isProposalActive(proposalId: number): Promise<boolean> {
    try {
      const results = await this.contract.getResults(proposalId);
      return results.isActive;
    } catch (error) {
      console.error('Error checking proposal status:', error);
      return false;
    }
  }

  subscribeToVoteEvents(
    proposalId: number,
    callback: (voteData: any) => void
  ): () => void {
    const filter = this.contract.filters.VoteCommitted(proposalId);
    
    const handleEvent = (proposalIdFromEvent: any, voteCommitment: any, zone: any) => {
      if (proposalIdFromEvent.toNumber() === proposalId) {
        callback({
          proposalId: proposalIdFromEvent.toNumber(),
          voteCommitment,
          zone: zone.toNumber(),
        });
      }
    };

    this.contract.on(filter, handleEvent);

    // Return unsubscribe function
    return () => {
      this.contract.off(filter, handleEvent);
    };
  }

  private formatProof(proof: any): string {
    // Convert proof to contract format
    const encoded = ethers.utils.defaultAbiCoder.encode(
      ['uint256[2]', 'uint256[2][2]', 'uint256[2]'],
      [proof.a, proof.b, proof.c]
    );
    return encoded;
  }

  private parseError(error: any): string {
    if (error.reason) {
      return error.reason;
    }
    if (error.message?.includes('Already voted')) {
      return 'Ya has votado en esta propuesta';
    }
    if (error.message?.includes('Not eligible')) {
      return 'No eres elegible para votar en esta propuesta';
    }
    if (error.message?.includes('Voting ended')) {
      return 'La votación ha finalizado';
    }
    return 'Error al procesar el voto. Intenta de nuevo.';
  }
}

export const votingService = new VotingService();

// src/stores/identityStore.ts
import { create } from 'zustand';
import { secureStorage } from '../services/storage/secureStorage';

interface IdentityState {
  isAuthenticated: boolean;
  userDID: string | null;
  identityCommitment: string | null;
  municipalityCode: number | null;
  stateCode: number | null;
  reputation: number;
  
  // Actions
  setAuthenticated: (value: boolean) => void;
  setIdentity: (data: {
    did: string;
    commitment: string;
    municipality: number;
    state: number;
  }) => void;
  authenticateUser: (did: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  isAuthenticated: false,
  userDID: null,
  identityCommitment: null,
  municipalityCode: null,
  stateCode: null,
  reputation: 0,

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  setIdentity: (data) => set({
    userDID: data.did,
    identityCommitment: data.commitment,
    municipalityCode: data.municipality,
    stateCode: data.state,
    isAuthenticated: true,
  }),

  authenticateUser: async (did) => {
    try {
      // Verify DID exists in secure storage
      const storedDID = await secureStorage.getDID();
      if (storedDID !== did) {
        return false;
      }

      // Load identity data
      const identityData = await secureStorage.getIdentityData();
      if (!identityData) {
        return false;
      }

      set({
        userDID: did,
        identityCommitment: identityData.commitment,
        municipalityCode: identityData.municipality,
        stateCode: identityData.state,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  },

  logout: async () => {
    set({
      isAuthenticated: false,
      userDID: null,
      identityCommitment: null,
      municipalityCode: null,
      stateCode: null,
      reputation: 0,
    });
    
    // Optionally clear secure storage
    // await secureStorage.clear();
  },

  initialize: async () => {
    try {
      const storedDID = await secureStorage.getDID();
      if (storedDID) {
        await get().authenticateUser(storedDID);
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
  },
}));

// src/services/storage/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

class SecureStorage {
  private readonly DID_KEY = 'shout_aloud_did';
  private readonly PRIVATE_KEY = 'shout_aloud_private_key';
  private readonly IDENTITY_KEY = 'shout_aloud_identity';

  async saveDID(did: string): Promise<void> {
    await SecureStore.setItemAsync(this.DID_KEY, did);
  }

  async getDID(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.DID_KEY);
  }

  async savePrivateKey(privateKey: string): Promise<void> {
    await SecureStore.setItemAsync(this.PRIVATE_KEY, privateKey);
  }

  async getPrivateKey(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.PRIVATE_KEY);
  }

  async saveIdentityData(data: any): Promise<void> {
    await SecureStore.setItemAsync(this.IDENTITY_KEY, JSON.stringify(data));
  }

  async getIdentityData(): Promise<any | null> {
    const data = await SecureStore.getItemAsync(this.IDENTITY_KEY);
    return data ? JSON.parse(data) : null;
  }

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(this.DID_KEY);
    await SecureStore.deleteItemAsync(this.PRIVATE_KEY);
    await SecureStore.deleteItemAsync(this.IDENTITY_KEY);
  }
}

export const secureStorage = new SecureStorage();

// src/utils/constants.ts
export const API_BASE_URL = process.env.API_URL || 'https://api.shoutaloud.org';
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
export const VOTING_CONTRACT_ADDRESS = '0x...'; // Replace with actual address
export const VOTING_ABI = [
  'function castVote(uint256 proposalId, bytes32 identityCommitment, uint8 vote, bytes32 nullifier, bytes calldata proof, bytes32[] calldata merkleProof)',
  'function getResults(uint256 proposalId) view returns (uint256 yesVotes, uint256 noVotes, uint256 abstainVotes, uint256 totalVotes, uint256 participationRate, bool isActive)',
  'event VoteCommitted(uint256 indexed proposalId, bytes32 indexed voteCommitment, uint256 indexed zone)',
];