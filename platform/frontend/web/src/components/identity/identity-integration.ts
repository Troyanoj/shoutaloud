/**
 * Identity Integration Layer
 * Connects DID/VC system with blockchain and application
 */

import { ethers } from 'ethers';
import { create as ipfsCreate } from 'ipfs-core';
import * as OrbitDB from 'orbit-db';
import { ShoutAloudIdentity, DIDManager, VCManager, GeographicTokenManager } from './did-vc-identity';

// Interfaces
interface IdentityRegistration {
  did: string;
  nullifier: string;
  municipalityCode: number;
  registrationBlock: number;
  ipfsHash: string; // Encrypted credential storage
}

interface IdentitySession {
  did: string;
  eligibilityToken: string;
  sessionToken: string;
  expiresAt: number;
  allowedMunicipalities: number[];
}

/**
 * Blockchain Identity Registry
 */
export class BlockchainIdentityRegistry {
  private contract: ethers.Contract;
  private provider: ethers.providers.Provider;
  private signer: ethers.Signer;
  
  constructor(
    contractAddress: string,
    contractABI: any[],
    provider: ethers.providers.Provider,
    signer: ethers.Signer
  ) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, contractABI, signer);
  }
  
  /**
   * Register identity on blockchain
   */
  async registerIdentity(
    did: string,
    nullifier: string,
    identityCommitment: string,
    municipalityCode: number,
    zkProof: any
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      // Check if nullifier already exists (one person = one identity)
      const exists = await this.contract.nullifierExists(nullifier);
      if (exists) {
        return {
          success: false,
          error: 'Identity already registered'
        };
      }
      
      // Prepare proof for contract
      const proofFormatted = this.formatProofForContract(zkProof);
      
      // Register identity
      const tx = await this.contract.registerIdentity(
        ethers.utils.id(did), // Hash DID for privacy
        nullifier,
        identityCommitment,
        municipalityCode,
        proofFormatted
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error: any) {
      console.error('Blockchain registration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify identity is registered
   */
  async verifyIdentityRegistered(did: string): Promise<boolean> {
    try {
      const didHash = ethers.utils.id(did);
      const registration = await this.contract.identities(didHash);
      return registration.registered;
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }
  
  /**
   * Get identity registration details
   */
  async getIdentityDetails(did: string): Promise<IdentityRegistration | null> {
    try {
      const didHash = ethers.utils.id(did);
      const registration = await this.contract.identities(didHash);
      
      if (!registration.registered) {
        return null;
      }
      
      return {
        did,
        nullifier: registration.nullifier,
        municipalityCode: registration.municipalityCode.toNumber(),
        registrationBlock: registration.blockNumber.toNumber(),
        ipfsHash: registration.ipfsHash
      };
    } catch (error) {
      console.error('Failed to get identity details:', error);
      return null;
    }
  }
  
  /**
   * Update municipality (for address changes)
   */
  async updateMunicipality(
    did: string,
    newMunicipalityCode: number,
    proof: any
  ): Promise<boolean> {
    try {
      const tx = await this.contract.updateMunicipality(
        ethers.utils.id(did),
        newMunicipalityCode,
        this.formatProofForContract(proof)
      );
      
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Municipality update failed:', error);
      return false;
    }
  }
  
  /**
   * Format ZK proof for smart contract
   */
  private formatProofForContract(proof: any): any {
    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [[proof.pi_b[0][0], proof.pi_b[0][1]], [proof.pi_b[1][0], proof.pi_b[1][1]]],
      c: [proof.pi_c[0], proof.pi_c[1]],
      publicSignals: proof.publicSignals || []
    };
  }
}

/**
 * Decentralized Credential Storage
 */
export class DecentralizedCredentialStorage {
  private ipfs: any;
  private orbitdb: any;
  private db: any;
  
  async initialize() {
    // Initialize IPFS
    this.ipfs = await ipfsCreate({
      repo: './ipfs-repo-' + Math.random(),
      config: {
        Addresses: {
          Swarm: [
            '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
            '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
          ]
        }
      }
    });
    
    // Initialize OrbitDB
    this.orbitdb = await OrbitDB.createInstance(this.ipfs);
    
    // Create/Open credentials database
    this.db = await this.orbitdb.docs('shout-aloud-credentials', {
      accessController: {
        write: ['*'] // In production, restrict write access
      }
    });
    
    await this.db.load();
  }
  
  /**
   * Store encrypted credential
   */
  async storeCredential(
    did: string,
    encryptedCredential: string,
    metadata: any
  ): Promise<string> {
    try {
      // Add to IPFS
      const { cid } = await this.ipfs.add({
        path: `credential-${did}`,
        content: Buffer.from(encryptedCredential)
      });
      
      // Store metadata in OrbitDB
      await this.db.put({
        _id: did,
        ipfsHash: cid.toString(),
        timestamp: Date.now(),
        ...metadata
      });
      
      return cid.toString();
    } catch (error) {
      console.error('Failed to store credential:', error);
      throw error;
    }
  }
  
  /**
   * Retrieve encrypted credential
   */
  async retrieveCredential(did: string): Promise<string | null> {
    try {
      // Get metadata from OrbitDB
      const records = await this.db.get(did);
      if (!records || records.length === 0) {
        return null;
      }
      
      const { ipfsHash } = records[0];
      
      // Retrieve from IPFS
      const chunks = [];
      for await (const chunk of this.ipfs.cat(ipfsHash)) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks).toString();
    } catch (error) {
      console.error('Failed to retrieve credential:', error);
      return null;
    }
  }
  
  /**
   * Delete credential (user request)
   */
  async deleteCredential(did: string): Promise<boolean> {
    try {
      await this.db.del(did);
      return true;
    } catch (error) {
      console.error('Failed to delete credential:', error);
      return false;
    }
  }
}

/**
 * Identity Session Manager
 */
export class IdentitySessionManager {
  private sessions: Map<string, IdentitySession> = new Map();
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Create voting session
   */
  async createSession(
    did: string,
    eligibilityToken: string,
    municipalityCode: number
  ): Promise<string> {
    // Generate session token
    const sessionData = {
      did,
      municipalityCode,
      timestamp: Date.now(),
      nonce: Math.random().toString(36)
    };
    
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    
    // Store session
    const session: IdentitySession = {
      did,
      eligibilityToken,
      sessionToken,
      expiresAt: Date.now() + this.SESSION_DURATION,
      allowedMunicipalities: [municipalityCode]
    };
    
    this.sessions.set(sessionToken, session);
    
    // Clean expired sessions
    this.cleanExpiredSessions();
    
    return sessionToken;
  }
  
  /**
   * Validate session for voting
   */
  validateSession(
    sessionToken: string,
    proposalMunicipality: number
  ): {
    valid: boolean;
    did?: string;
    error?: string;
  } {
    const session = this.sessions.get(sessionToken);
    
    if (!session) {
      return { valid: false, error: 'Invalid session' };
    }
    
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionToken);
      return { valid: false, error: 'Session expired' };
    }
    
    if (!session.allowedMunicipalities.includes(proposalMunicipality)) {
      return { valid: false, error: 'Not authorized for this municipality' };
    }
    
    return { valid: true, did: session.did };
  }
  
  /**
   * Revoke session
   */
  revokeSession(sessionToken: string): void {
    this.sessions.delete(sessionToken);
  }
  
  /**
   * Clean expired sessions
   */
  private cleanExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
      }
    }
  }
}

/**
 * Complete Identity Service
 */
export class IdentityService {
  private identity: ShoutAloudIdentity;
  private registry: BlockchainIdentityRegistry;
  private storage: DecentralizedCredentialStorage;
  private sessionManager: IdentitySessionManager;
  
  constructor(
    contractAddress: string,
    contractABI: any[],
    provider: ethers.providers.Provider,
    signer: ethers.Signer
  ) {
    this.identity = new ShoutAloudIdentity();
    this.registry = new BlockchainIdentityRegistry(contractAddress, contractABI, provider, signer);
    this.storage = new DecentralizedCredentialStorage();
    this.sessionManager = new IdentitySessionManager();
  }
  
  async initialize() {
    await this.storage.initialize();
  }
  
  /**
   * Complete citizen registration
   */
  async registerCitizen(
    biometricData: {
      faceImage: ArrayBuffer;
      voiceData?: ArrayBuffer;
    },
    documentData: {
      documentImage: ArrayBuffer;
      documentType: string;
      documentNumber: string;
    },
    personalData: {
      birthDate: string;
    },
    location: {
      latitude: number;
      longitude: number;
    }
  ): Promise<{
    success: boolean;
    did?: string;
    sessionToken?: string;
    error?: string;
  }> {
    try {
      // Process biometric data
      const biometricHash = await this.hashBiometric(biometricData.faceImage);
      
      // Determine municipality
      const municipalityCode = await this.getMunicipalityCode(location.latitude, location.longitude);
      
      // Register identity
      const registration = await this.identity.registerCitizen(
        biometricHash,
        documentData.documentNumber,
        personalData.birthDate,
        municipalityCode
      );
      
      // Generate ZK proof for blockchain
      const zkProof = await this.generateBlockchainProof(
        registration.did,
        biometricHash,
        documentData.documentNumber,
        personalData.birthDate
      );
      
      // Register on blockchain
      const blockchainResult = await this.registry.registerIdentity(
        registration.did,
        zkProof.nullifier,
        zkProof.commitment,
        municipalityCode,
        zkProof.proof
      );
      
      if (!blockchainResult.success) {
        return {
          success: false,
          error: blockchainResult.error
        };
      }
      
      // Encrypt and store credential
      const encryptedCredential = await this.encryptCredential(
        registration.credential,
        registration.privateKey
      );
      
      const ipfsHash = await this.storage.storeCredential(
        registration.did,
        encryptedCredential,
        {
          municipalityCode,
          registrationTx: blockchainResult.transactionHash
        }
      );
      
      // Create session
      const sessionToken = await this.sessionManager.createSession(
        registration.did,
        registration.eligibilityToken,
        municipalityCode
      );
      
      return {
        success: true,
        did: registration.did,
        sessionToken
      };
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Authenticate citizen for voting
   */
  async authenticateForVoting(
    did: string,
    biometricData: ArrayBuffer,
    proposalMunicipality: number
  ): Promise<{
    authorized: boolean;
    sessionToken?: string;
    error?: string;
  }> {
    try {
      // Verify biometric
      const biometricValid = await this.verifyBiometric(did, biometricData);
      if (!biometricValid) {
        return {
          authorized: false,
          error: 'Biometric verification failed'
        };
      }
      
      // Check blockchain registration
      const registered = await this.registry.verifyIdentityRegistered(did);
      if (!registered) {
        return {
          authorized: false,
          error: 'Identity not registered'
        };
      }
      
      // Get identity details
      const details = await this.registry.getIdentityDetails(did);
      if (!details) {
        return {
          authorized: false,
          error: 'Could not retrieve identity details'
        };
      }
      
      // Verify municipality eligibility
      if (details.municipalityCode !== proposalMunicipality) {
        return {
          authorized: false,
          error: 'Not eligible for this municipality'
        };
      }
      
      // Create session
      const sessionToken = await this.sessionManager.createSession(
        did,
        '', // Token would be retrieved from secure storage
        proposalMunicipality
      );
      
      return {
        authorized: true,
        sessionToken
      };
      
    } catch (error: any) {
      console.error('Authentication failed:', error);
      return {
        authorized: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update citizen municipality (for moves)
   */
  async updateMunicipality(
    did: string,
    sessionToken: string,
    newLocation: {
      latitude: number;
      longitude: number;
    },
    proof: any // Proof of new residence
  ): Promise<{
    success: boolean;
    newMunicipalityCode?: number;
    error?: string;
  }> {
    try {
      // Validate session
      const session = this.sessionManager.validateSession(sessionToken, 0);
      if (!session.valid || session.did !== did) {
        return {
          success: false,
          error: 'Invalid session'
        };
      }
      
      // Determine new municipality
      const newMunicipalityCode = await this.getMunicipalityCode(
        newLocation.latitude,
        newLocation.longitude
      );
      
      // Update on blockchain
      const updated = await this.registry.updateMunicipality(
        did,
        newMunicipalityCode,
        proof
      );
      
      if (!updated) {
        return {
          success: false,
          error: 'Failed to update municipality'
        };
      }
      
      return {
        success: true,
        newMunicipalityCode
      };
      
    } catch (error: any) {
      console.error('Municipality update failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Helper methods
  private async hashBiometric(biometricData: ArrayBuffer): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', biometricData);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  private async verifyBiometric(did: string, biometricData: ArrayBuffer): Promise<boolean> {
    // In production, this would use secure biometric matching
    // For now, simulate verification
    return true;
  }
  
  private async getMunicipalityCode(lat: number, lng: number): Promise<number> {
    // In production, use offline geocoding database
    // For now, generate deterministic code
    return Math.floor(Math.abs(lat * lng) % 100000);
  }
  
  private async generateBlockchainProof(
    did: string,
    biometricHash: string,
    documentNumber: string,
    birthDate: string
  ): Promise<any> {
    // Generate proof data
    return {
      commitment: this.hashData(did + biometricHash),
      nullifier: this.hashData(biometricHash + documentNumber),
      proof: {
        pi_a: ['0x1', '0x2'],
        pi_b: [['0x3', '0x4'], ['0x5', '0x6']],
        pi_c: ['0x7', '0x8'],
        publicSignals: []
      }
    };
  }
  
  private async encryptCredential(credential: any, privateKey: string): Promise<string> {
    // In production, use proper encryption
    return Buffer.from(JSON.stringify(credential)).toString('base64');
  }
  
  private hashData(data: string): string {
    // Simple hash for demo
    return Buffer.from(data).toString('hex').substring(0, 64);
  }
}

// Export all components
export {
  BlockchainIdentityRegistry,
  DecentralizedCredentialStorage,
  IdentitySessionManager,
  IdentityService
};