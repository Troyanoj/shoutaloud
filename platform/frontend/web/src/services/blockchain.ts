import { ethers } from 'ethers';

// Get environment variables (exposed via Vite prefix VITE_)
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const RPC_URL = import.meta.env.VITE_BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const INFURA_ID = import.meta.env.VITE_WEB3_INFURA_ID;

// Network configuration - updated for Polygon
const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: RPC_URL,
  },
  amoy: {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
  },
};

// ABI del contrato ShoutAloudVoting (actualizado al contrato real)
const VOTING_CONTRACT_ABI = [
  // Roles
  {
    inputs: [{ name: 'role', type: 'bytes32' }],
    name: 'VALIDATOR_ROLE',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'role', type: 'bytes32' }],
    name: 'MUNICIPALITY_ADMIN_ROLE',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Identity
  {
    inputs: [
      { name: 'nullifier', type: 'bytes32' },
      { name: 'identityCommitment', type: 'bytes32' },
      { name: 'municipalityCode', type: 'uint256' },
      { name: 'stateCode', type: 'uint256' },
      { name: 'proof', type: 'bytes' },
    ],
    name: 'registerIdentity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'identityCommitment', type: 'bytes32' }],
    name: 'identities',
    outputs: [
      { name: 'registered', type: 'bool' },
      { name: 'nullifier', type: 'bytes32' },
      { name: 'identityCommitment', type: 'bytes32' },
      { name: 'municipalityCode', type: 'uint256' },
      { name: 'stateCode', type: 'uint256' },
      { name: 'registrationBlock', type: 'uint256' },
      { name: 'reputation', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Proposals
  {
    inputs: [
      { name: 'ipfsHash', type: 'string' },
      { name: 'scope', type: 'uint8' },
      { name: 'category', type: 'uint8' },
      { name: 'targetZone', type: 'uint256' },
      { name: 'votingDuration', type: 'uint256' },
      { name: 'merkleRoot', type: 'bytes32' },
    ],
    name: 'createProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { name: 'ipfsHash', type: 'string' },
      { name: 'scope', type: 'uint8' },
      { name: 'category', type: 'uint8' },
      { name: 'targetZone', type: 'uint256' },
      { name: 'startBlock', type: 'uint256' },
      { name: 'endBlock', type: 'uint256' },
      { name: 'finalized', type: 'bool' },
      { name: 'merkleRoot', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Voting
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'identityCommitment', type: 'bytes32' },
      { name: 'voteChoice', type: 'uint8' },
      { name: 'nullifier', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
      { name: 'merkleProof', type: 'bytes32[]' },
    ],
    name: 'castVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'getResults',
    outputs: [
      { name: 'yesVotes', type: 'uint256' },
      { name: 'noVotes', type: 'uint256' },
      { name: 'abstainVotes', type: 'uint256' },
      { name: 'totalVotes', type: 'uint256' },
      { name: 'participationRate', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Admin
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'finalizeProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'identityCommitment', type: 'bytes32' },
      { indexed: true, name: 'municipalityCode', type: 'uint256' },
      { indexed: false, name: 'stateCode', type: 'uint256' },
    ],
    name: 'IdentityRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: true, name: 'voteCommitment', type: 'bytes32' },
      { indexed: true, name: 'zone', type: 'uint256' },
    ],
    name: 'VoteCommitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'yesVotes', type: 'uint256' },
      { indexed: false, name: 'noVotes', type: 'uint256' },
      { indexed: false, name: 'abstainVotes', type: 'uint256' },
    ],
    name: 'ProposalFinalized',
    type: 'event',
  },
];

export interface VoteData {
  proposalId: number;
  identityCommitment: string;
  voteChoice: number;
  nullifier: string;
  proof: string;
  merkleProof: string[];
}

export interface BlockchainVoteResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}

export interface BlockchainStatus {
  connected: boolean;
  network?: string;
  chainId?: number;
  blockNumber?: number;
  contractAddress?: string;
  error?: unknown;
}

class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private isConnected: boolean = false;
  private currentNetwork: keyof typeof NETWORKS = 'hardhat';

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    try {
      const networkConfig = NETWORKS[this.currentNetwork];
      this.provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);

      // Verify connection
      const network = await this.provider.getNetwork();
      console.log('🔗 Connected to blockchain:', network.name, 'Chain ID:', network.chainId);

      this.isConnected = true;
    } catch (error) {
      console.error('❌ Error connecting to blockchain:', error);
      this.isConnected = false;
    }
  }

  setNetwork(network: keyof typeof NETWORKS) {
    this.currentNetwork = network;
    this.initializeProvider();
  }

  getNetworkConfig() {
    return NETWORKS[this.currentNetwork];
  }

  async connectWallet(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Switch to the correct network if needed
      const networkConfig = NETWORKS[this.currentNetwork];
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${networkConfig.chainId.toString(16)}`,
                chainName: networkConfig.name,
                rpcUrls: [networkConfig.rpcUrl],
              },
            ],
          });
        }
      }

      // Create provider and signer with MetaMask
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = web3Provider.getSigner();

      // Initialize contract
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, VOTING_CONTRACT_ABI, this.signer);

      const address = await this.signer.getAddress();
      console.log('🔐 Wallet connected:', address);

      return true;
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      return false;
    }
  }

  async getWalletAddress(): Promise<string | null> {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }

  private generateVoteHash(voteData: VoteData): string {
    const dataString = `${voteData.proposalId}-${voteData.identityCommitment}-${voteData.voteChoice}-${voteData.nullifier}`;
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
  }

  async submitVote(voteData: VoteData): Promise<BlockchainVoteResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Blockchain not connected. Connect your wallet first.');
      }

      console.log('📝 Submitting vote to blockchain...', {
        proposalId: voteData.proposalId,
        voteChoice: voteData.voteChoice,
      });

      const transaction = await this.contract.castVote(
        voteData.proposalId,
        voteData.identityCommitment,
        voteData.voteChoice,
        voteData.nullifier,
        voteData.proof,
        voteData.merkleProof,
        { gasLimit: 500000 }
      );

      console.log('⏳ Transaction sent:', transaction.hash);

      const receipt = await transaction.wait();

      console.log('✅ Vote confirmed on blockchain:', {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('❌ Error submitting vote to blockchain:', error);
      return {
        success: false,
        error: error.message || 'Unknown blockchain error',
      };
    }
  }

  async getVoteResults(proposalId: number) {
    try {
      if (!this.contract) {
        const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, VOTING_CONTRACT_ABI, this.provider);
        return await readOnlyContract.getResults(proposalId);
      }
      return await this.contract.getResults(proposalId);
    } catch (error) {
      console.error('Error getting vote results:', error);
      return null;
    }
  }

  async registerIdentity(nullifier: string, commitment: string, municipalityCode: number, stateCode: number, proof: string) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Blockchain not connected. Connect your wallet first.');
      }

      const transaction = await this.contract.registerIdentity(
        nullifier,
        commitment,
        municipalityCode,
        stateCode,
        proof,
        { gasLimit: 500000 }
      );

      const receipt = await transaction.wait();
      return { success: true, transactionHash: receipt.transactionHash };
    } catch (error: any) {
      console.error('Error registering identity:', error);
      return { success: false, error: error.message };
    }
  }

  async listenToVoteEvents(callback: (event: unknown) => void) {
    try {
      if (!this.contract) return;

      this.contract.on('VoteCommitted', (proposalId, voteCommitment, zone, event) => {
        console.log('🔔 New vote detected:', {
          proposalId: proposalId.toNumber(),
          voteCommitment,
          zone: zone.toNumber(),
          blockNumber: event.blockNumber,
        });

        callback({
          proposalId: proposalId.toNumber(),
          voteCommitment,
          zone: zone.toNumber(),
          blockNumber: event.blockNumber,
        });
      });

      console.log('👂 Listening for voting events...');
    } catch (error) {
      console.error('Error setting up event listener:', error);
    }
  }

  isWalletConnected(): boolean {
    return this.signer !== null;
  }

  isBlockchainConnected(): boolean {
    return this.isConnected;
  }

  async getBlockchainStatus(): Promise<BlockchainStatus> {
    try {
      if (!this.provider) return { connected: false };

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        connected: true,
        network: network.name,
        chainId: network.chainId,
        blockNumber,
        contractAddress: CONTRACT_ADDRESS,
      };
    } catch (error) {
      return { connected: false, error };
    }
  }

  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }

  getRpcUrl(): string {
    return NETWORKS[this.currentNetwork].rpcUrl;
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();

// Export configuration for use in other services
export const blockchainConfig = {
  contractAddress: CONTRACT_ADDRESS,
  rpcUrl: RPC_URL,
  network: NETWORKS,
};

export default blockchainService;