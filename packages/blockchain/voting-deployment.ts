/**
 * Deployment and Integration Script for Shout Aloud Voting System
 * Deploys on Polygon for low fees and environmental efficiency
 */

import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  polygon: {
    mainnet: {
      rpc: 'https://polygon-rpc.com',
      chainId: 137,
      gasPrice: '50000000000', // 50 Gwei
      confirmations: 5
    },
    mumbai: {
      rpc: 'https://rpc-mumbai.maticvigil.com',
      chainId: 80001,
      gasPrice: '30000000000', // 30 Gwei
      confirmations: 3
    }
  }
};

/**
 * Main deployment function
 */
async function main() {
  console.log('🚀 Deploying Shout Aloud Voting System on Polygon\n');
  
  // Get deployment network
  const network = process.env.NETWORK || 'mumbai';
  const config = DEPLOYMENT_CONFIG.polygon[network];
  
  console.log(`📍 Network: Polygon ${network}`);
  console.log(`🔗 Chain ID: ${config.chainId}\n`);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await deployer.getBalance();
  console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} MATIC\n`);
  
  // Deploy contracts
  const contracts = await deployContracts(deployer);
  
  // Configure contracts
  await configureContracts(contracts, deployer);
  
  // Verify contracts
  if (network === 'mainnet') {
    await verifyContracts(contracts);
  }
  
  // Save deployment info
  await saveDeploymentInfo(contracts, network);
  
  console.log('\n✅ Deployment complete!');
}

/**
 * Deploy all contracts
 */
async function deployContracts(deployer: Signer): Promise<{
  voting: Contract;
  verifier: Contract;
}> {
  console.log('📦 Deploying contracts...\n');
  
  // Deploy ZK Verifier
  console.log('1️⃣ Deploying ZK Verifier...');
  const VerifierFactory = await ethers.getContractFactory('ShoutAloudZKVerifier');
  const verifier = await VerifierFactory.deploy();
  await verifier.deployed();
  console.log(`   ✅ ZK Verifier deployed at: ${verifier.address}`);
  
  // Deploy Voting Contract
  console.log('\n2️⃣ Deploying Voting Contract...');
  const VotingFactory = await ethers.getContractFactory('ShoutAloudVoting');
  const voting = await VotingFactory.deploy();
  await voting.deployed();
  console.log(`   ✅ Voting Contract deployed at: ${voting.address}`);
  
  return { voting, verifier };
}

/**
 * Configure contracts with initial settings
 */
async function configureContracts(
  contracts: { voting: Contract; verifier: Contract },
  deployer: Signer
): Promise<void> {
  console.log('\n⚙️ Configuring contracts...\n');
  
  const deployerAddress = await deployer.getAddress();
  
  // Setup roles
  console.log('1️⃣ Setting up roles...');
  
  // Grant validator role to initial validators
  const validators = process.env.VALIDATORS?.split(',') || [deployerAddress];
  for (const validator of validators) {
    const tx = await contracts.voting.grantRole(
      await contracts.voting.VALIDATOR_ROLE(),
      validator
    );
    await tx.wait();
    console.log(`   ✅ Validator role granted to: ${validator}`);
  }
  
  // Grant municipality admin roles
  const municipalityAdmins = process.env.MUNICIPALITY_ADMINS?.split(',') || [];
  for (const admin of municipalityAdmins) {
    const tx = await contracts.voting.grantRole(
      await contracts.voting.MUNICIPALITY_ADMIN_ROLE(),
      admin
    );
    await tx.wait();
    console.log(`   ✅ Municipality admin role granted to: ${admin}`);
  }
  
  // Setup initial configuration
  console.log('\n2️⃣ Initial configuration...');
  console.log('   ✅ Contracts configured successfully');
}

/**
 * Verify contracts on Polygonscan
 */
async function verifyContracts(contracts: {
  voting: Contract;
  verifier: Contract;
}): Promise<void> {
  console.log('\n🔍 Verifying contracts on Polygonscan...\n');
  
  try {
    // Verify ZK Verifier
    await run('verify:verify', {
      address: contracts.verifier.address,
      constructorArguments: []
    });
    console.log('✅ ZK Verifier verified');
    
    // Verify Voting Contract
    await run('verify:verify', {
      address: contracts.voting.address,
      constructorArguments: []
    });
    console.log('✅ Voting Contract verified');
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

/**
 * Save deployment information
 */
async function saveDeploymentInfo(
  contracts: { voting: Contract; verifier: Contract },
  network: string
): Promise<void> {
  const deploymentInfo = {
    network,
    timestamp: new Date().toISOString(),
    contracts: {
      voting: {
        address: contracts.voting.address,
        abi: 'ShoutAloudVoting.json'
      },
      verifier: {
        address: contracts.verifier.address,
        abi: 'ShoutAloudZKVerifier.json'
      }
    }
  };
  
  const deploymentPath = path.join(__dirname, `../deployments/${network}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
}

/**
 * Integration examples
 */
export class VotingIntegration {
  private voting: Contract;
  private verifier: Contract;
  private provider: ethers.providers.Provider;
  
  constructor(
    votingAddress: string,
    verifierAddress: string,
    provider: ethers.providers.Provider
  ) {
    this.provider = provider;
    this.voting = new ethers.Contract(votingAddress, VOTING_ABI, provider);
    this.verifier = new ethers.Contract(verifierAddress, VERIFIER_ABI, provider);
  }
  
  /**
   * Register a new identity
   */
  async registerIdentity(
    nullifier: string,
    identityCommitment: string,
    municipalityCode: number,
    stateCode: number,
    proof: any
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      // Format proof for contract
      const formattedProof = this.formatProof(proof);
      
      // Call contract
      const tx = await this.voting.registerIdentity(
        nullifier,
        identityCommitment,
        municipalityCode,
        stateCode,
        formattedProof
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Cast a vote
   */
  async castVote(
    proposalId: number,
    identityCommitment: string,
    vote: number, // 1: YES, 2: NO, 3: ABSTAIN
    nullifier: string,
    proof: any,
    merkleProof: string[] = []
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      // Validate vote
      if (vote < 1 || vote > 3) {
        throw new Error('Invalid vote option');
      }
      
      // Format proof
      const formattedProof = this.formatProof(proof);
      
      // Cast vote
      const tx = await this.voting.castVote(
        proposalId,
        identityCommitment,
        vote,
        nullifier,
        formattedProof,
        merkleProof
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get proposal results
   */
  async getResults(proposalId: number): Promise<{
    yes: number;
    no: number;
    abstain: number;
    total: number;
    participationRate: number;
    isActive: boolean;
  }> {
    const results = await this.voting.getResults(proposalId);
    
    return {
      yes: results.yesVotes.toNumber(),
      no: results.noVotes.toNumber(),
      abstain: results.abstainVotes.toNumber(),
      total: results.totalVotes.toNumber(),
      participationRate: results.participationRate.toNumber() / 100, // Convert from basis points
      isActive: results.isActive
    };
  }
  
  /**
   * Get zone-specific results for auditing
   */
  async getZoneResults(
    proposalId: number,
    zone: number
  ): Promise<{
    votes: {
      yes: number;
      no: number;
      abstain: number;
      total: number;
    };
    participation: {
      eligible: number;
      actual: number;
      rate: number;
    };
  }> {
    const results = await this.voting.getZoneResults(proposalId, zone);
    
    const eligible = results.eligibleVoters.toNumber();
    const actual = results.actualVoters.toNumber();
    
    return {
      votes: {
        yes: results.yesVotes.toNumber(),
        no: results.noVotes.toNumber(),
        abstain: results.abstainVotes.toNumber(),
        total: results.totalVotes.toNumber()
      },
      participation: {
        eligible,
        actual,
        rate: eligible > 0 ? (actual / eligible) * 100 : 0
      }
    };
  }
  
  /**
   * Create a new proposal
   */
  async createProposal(
    ipfsHash: string,
    scope: number, // 0: Municipal, 1: State, 2: Federal
    category: number,
    targetZone: number,
    votingDurationInDays: number,
    eligibleVotersMerkleRoot?: string
  ): Promise<{
    success: boolean;
    proposalId?: number;
    error?: string;
  }> {
    try {
      // Convert days to blocks (assuming ~2 second blocks on Polygon)
      const blocksPerDay = 43200;
      const votingDuration = votingDurationInDays * blocksPerDay;
      
      const merkleRoot = eligibleVotersMerkleRoot || ethers.constants.HashZero;
      
      const tx = await this.voting.createProposal(
        ipfsHash,
        scope,
        category,
        targetZone,
        votingDuration,
        merkleRoot
      );
      
      const receipt = await tx.wait();
      
      // Extract proposal ID from events
      const event = receipt.events?.find(e => e.event === 'ProposalCreated');
      const proposalId = event?.args?.proposalId?.toNumber();
      
      return {
        success: true,
        proposalId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Format proof for contract interaction
   */
  private formatProof(proof: any): string {
    // Convert proof to bytes format expected by contract
    const encoded = ethers.utils.defaultAbiCoder.encode(
      ['uint256[2]', 'uint256[2][2]', 'uint256[2]'],
      [proof.a, proof.b, proof.c]
    );
    return encoded;
  }
}

// ABIs (simplified - in production load from artifacts)
const VOTING_ABI = [
  'function registerIdentity(bytes32 nullifier, bytes32 identityCommitment, uint256 municipalityCode, uint256 stateCode, bytes calldata proof)',
  'function castVote(uint256 proposalId, bytes32 identityCommitment, uint8 vote, bytes32 nullifier, bytes calldata proof, bytes32[] calldata merkleProof)',
  'function getResults(uint256 proposalId) view returns (uint256 yesVotes, uint256 noVotes, uint256 abstainVotes, uint256 totalVotes, uint256 participationRate, bool isActive)',
  'function getZoneResults(uint256 proposalId, uint256 zone) view returns (uint256 yesVotes, uint256 noVotes, uint256 abstainVotes, uint256 totalVotes, uint256 eligibleVoters, uint256 actualVoters)',
  'function createProposal(string memory ipfsHash, uint8 scope, uint8 category, uint256 targetZone, uint256 votingDuration, bytes32 merkleRoot) returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId, uint8 scope, uint256 targetZone, uint256 startBlock, uint256 endBlock)',
  'event VoteCommitted(uint256 indexed proposalId, bytes32 indexed voteCommitment, uint256 indexed zone)'
];

const VERIFIER_ABI = [
  'function verifyIdentityProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[4] memory publicInputs) view returns (bool)',
  'function verifyVoteProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[5] memory publicInputs) view returns (bool)'
];

// Run deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// Export for use in other modules
export { deployContracts, VotingIntegration };