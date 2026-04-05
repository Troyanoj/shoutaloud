import axios from 'axios';

// Get environment variables (exposed via Vite prefix VITE_)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const IPFS_URL = import.meta.env.VITE_IPFS_API_URL || 'https://ipfs.io/ipfs';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

// Types
export interface Proposal {
  id: string;
  title: string;
  description: string;
  municipality: string;
  status: 'active' | 'completed' | 'draft';
  votes_for: number;
  votes_against: number;
  total_votes: number;
  created_at: string;
  end_date: string;
  ai_analysis?: {
    legal_viability: number;
    impact_score: number;
    recommendation: string;
    tags: string[];
  };
}

export interface Municipality {
  id: string;
  name: string;
  state: string;
  population: number;
  active_proposals: number;
  participation_rate: number;
}

export interface Vote {
  proposal_id: string;
  vote: 'for' | 'against';
  user_id: string;
  municipality: string;
}

export interface VoteResult {
  proposal_id: string;
  total_votes: number;
  votes_for: number;
  votes_against: number;
  participation_by_municipality: Record<string, number>;
}

export interface Official {
  id: string;
  name: string;
  position: string;
  municipality: string;
  rating: number;
  total_ratings: number;
  tags: string[];
}

// API Functions
export const apiService = {
  // Proposals
  getProposals: async (municipality?: string): Promise<Proposal[]> => {
    const params = municipality ? { municipality } : {};
    const response = await api.get('/api/proposals', { params });
    return response.data;
  },

  getProposal: async (id: string): Promise<Proposal> => {
    const response = await api.get(`/api/proposals/${id}`);
    return response.data;
  },

  createProposal: async (proposal: Partial<Proposal>): Promise<Proposal> => {
    const response = await api.post('/api/proposals', proposal);
    return response.data;
  },

  // Voting
  vote: async (voteData: Vote): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/api/vote', voteData);
    return response.data;
  },

  getVoteResults: async (proposalId: string): Promise<VoteResult> => {
    const response = await api.get(`/api/vote/results/${proposalId}`);
    return response.data;
  },

  // Municipalities
  getMunicipalities: async (): Promise<Municipality[]> => {
    const response = await api.get('/api/municipalities');
    return response.data;
  },

  getMunicipality: async (id: string): Promise<Municipality> => {
    const response = await api.get(`/api/municipalities/${id}`);
    return response.data;
  },

  // Officials
  getOfficials: async (municipality?: string): Promise<Official[]> => {
    const params = municipality ? { municipality } : {};
    const response = await api.get('/api/officials', { params });
    return response.data;
  },

  rateOfficial: async (
    officialId: string,
    rating: number,
    tags: string[]
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/officials/${officialId}/rate`, { rating, tags });
    return response.data;
  },

  // Simulation
  getSimulationData: async () => {
    const response = await api.get('/api/simulation/data');
    return response.data;
  },

  runSimulation: async (params: any) => {
    const response = await api.post('/api/simulation/run', params);
    return response.data;
  },

  // AI Analysis
  analyzeProposal: async (proposalText: string) => {
    const response = await api.post('/api/ai/analyze', { text: proposalText });
    return response.data;
  },
};

// IPFS helper functions
export const ipfsService = {
  uploadToIPFS: async (data: string): Promise<string> => {
    // This would typically call an IPFS upload endpoint
    // For now, returning a placeholder
    const response = await api.post('/api/ipfs/upload', { data });
    return response.data.hash;
  },

  getFromIPFS: async (hash: string): Promise<string> => {
    const response = await api.get(`/api/ipfs/${hash}`);
    return response.data;
  },

  getGatewayUrl: (hash: string): string => {
    return `${IPFS_URL}/${hash}`;
  },
};

// Export configuration for use in other services
export const config = {
  apiUrl: API_URL,
  ipfsUrl: IPFS_URL,
};

export default api;