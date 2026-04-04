/**
 * Decentralized Identity (DID) & Verifiable Credentials Module
 * Implements W3C DID and VC standards for Shout Aloud
 */

import { randomBytes } from 'crypto';
import * as ed from '@noble/ed25519';
import { base58 } from '@scure/base';
import * as snarkjs from 'snarkjs';

// DID Document Structure
interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement: string[];
  created: string;
  updated: string;
}

interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
}

// Verifiable Credential Structure
interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    municipalityCode: number;
    stateCode: number;
    countryCode: string;
    eligibilityHash: string;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

// Zero-Knowledge Proof Circuit Inputs
interface IdentityCircuitInputs {
  // Private inputs
  biometricHash: bigint;
  documentNumber: bigint;
  birthDate: bigint;
  
  // Public inputs
  identityCommitment: bigint;
  municipalityCode: bigint;
  currentTimestamp: bigint;
}

/**
 * DID Manager - Handles Decentralized Identifiers
 */
export class DIDManager {
  private readonly DID_METHOD = 'shout';
  private readonly DID_NETWORK = 'polygon';
  
  /**
   * Generate a new DID with associated keypair
   */
  async generateDID(): Promise<{
    did: string;
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    didDocument: DIDDocument;
  }> {
    // Generate Ed25519 keypair
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKey(privateKey);
    
    // Create DID from public key
    const did = this.createDIDFromPublicKey(publicKey);
    
    // Create DID Document
    const didDocument = this.createDIDDocument(did, publicKey);
    
    return {
      did,
      privateKey,
      publicKey,
      didDocument
    };
  }
  
  /**
   * Create DID from public key
   */
  private createDIDFromPublicKey(publicKey: Uint8Array): string {
    const publicKeyBase58 = base58.encode(publicKey);
    const identifier = this.hashToIdentifier(publicKey);
    return `did:${this.DID_METHOD}:${this.DID_NETWORK}:${identifier}`;
  }
  
  /**
   * Create DID Document
   */
  private createDIDDocument(did: string, publicKey: Uint8Array): DIDDocument {
    const publicKeyMultibase = 'z' + base58.encode(publicKey);
    const verificationMethodId = `${did}#key-1`;
    
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: did,
      verificationMethod: [{
        id: verificationMethodId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase
      }],
      authentication: [verificationMethodId],
      assertionMethod: [verificationMethodId],
      keyAgreement: [verificationMethodId],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
  }
  
  /**
   * Hash public key to create identifier
   */
  private hashToIdentifier(publicKey: Uint8Array): string {
    const hash = randomBytes(16); // Simplified for demo
    return base58.encode(hash);
  }
  
  /**
   * Resolve DID to DID Document
   */
  async resolveDID(did: string): Promise<DIDDocument | null> {
    // In production, this would query the blockchain or DID registry
    // For now, return mock resolution
    console.log(`Resolving DID: ${did}`);
    return null;
  }
  
  /**
   * Sign data with DID
   */
  async signWithDID(
    data: any,
    privateKey: Uint8Array,
    did: string
  ): Promise<string> {
    const message = JSON.stringify(data);
    const messageBytes = new TextEncoder().encode(message);
    const signature = await ed.sign(messageBytes, privateKey);
    return base58.encode(signature);
  }
  
  /**
   * Verify DID signature
   */
  async verifyDIDSignature(
    data: any,
    signature: string,
    publicKey: Uint8Array
  ): Promise<boolean> {
    const message = JSON.stringify(data);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = base58.decode(signature);
    return ed.verify(signatureBytes, messageBytes, publicKey);
  }
}

/**
 * Verifiable Credentials Manager
 */
export class VCManager {
  private didManager: DIDManager;
  
  constructor() {
    this.didManager = new DIDManager();
  }
  
  /**
   * Issue Geographic Eligibility Credential
   */
  async issueGeographicCredential(
    subjectDID: string,
    municipalityCode: number,
    stateCode: number,
    countryCode: string,
    issuerDID: string,
    issuerPrivateKey: Uint8Array
  ): Promise<VerifiableCredential> {
    // Create eligibility hash from location data
    const eligibilityData = {
      municipalityCode,
      stateCode,
      countryCode,
      timestamp: Date.now()
    };
    
    const eligibilityHash = this.createHash(JSON.stringify(eligibilityData));
    
    // Create credential
    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://shout-aloud.org/contexts/geographic-eligibility/v1'
      ],
      id: `urn:uuid:${this.generateUUID()}`,
      type: ['VerifiableCredential', 'GeographicEligibilityCredential'],
      issuer: issuerDID,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      credentialSubject: {
        id: subjectDID,
        municipalityCode,
        stateCode,
        countryCode,
        eligibilityHash
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${issuerDID}#key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: ''
      }
    };
    
    // Sign credential
    const proofValue = await this.didManager.signWithDID(
      credential.credentialSubject,
      issuerPrivateKey,
      issuerDID
    );
    
    credential.proof.proofValue = proofValue;
    
    return credential;
  }
  
  /**
   * Verify Verifiable Credential
   */
  async verifyCredential(
    credential: VerifiableCredential,
    issuerPublicKey: Uint8Array
  ): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];
    
    // Check expiration
    if (credential.expirationDate) {
      const expDate = new Date(credential.expirationDate);
      if (expDate < new Date()) {
        errors.push('Credential has expired');
      }
    }
    
    // Verify signature
    const signatureValid = await this.didManager.verifyDIDSignature(
      credential.credentialSubject,
      credential.proof.proofValue,
      issuerPublicKey
    );
    
    if (!signatureValid) {
      errors.push('Invalid signature');
    }
    
    // Verify eligibility hash
    const eligibilityData = {
      municipalityCode: credential.credentialSubject.municipalityCode,
      stateCode: credential.credentialSubject.stateCode,
      countryCode: credential.credentialSubject.countryCode,
      timestamp: Date.now() // This would need to be stored in the credential
    };
    
    const expectedHash = this.createHash(JSON.stringify(eligibilityData));
    // Note: In production, we'd need to handle timestamp verification differently
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Create Verifiable Presentation
   */
  async createPresentation(
    credentials: VerifiableCredential[],
    holderDID: string,
    holderPrivateKey: Uint8Array,
    challenge?: string
  ): Promise<any> {
    const presentation = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1'
      ],
      type: ['VerifiablePresentation'],
      holder: holderDID,
      verifiableCredential: credentials,
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${holderDID}#key-1`,
        proofPurpose: 'authentication',
        challenge: challenge || this.generateUUID(),
        proofValue: ''
      }
    };
    
    // Sign presentation
    const proofValue = await this.didManager.signWithDID(
      {
        credentials: credentials.map(c => c.id),
        challenge: presentation.proof.challenge,
        holder: holderDID
      },
      holderPrivateKey,
      holderDID
    );
    
    presentation.proof.proofValue = proofValue;
    
    return presentation;
  }
  
  private createHash(data: string): string {
    // Simplified hash - in production use proper crypto
    return Buffer.from(data).toString('base64');
  }
  
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

/**
 * Zero-Knowledge Identity Verifier
 */
export class ZKIdentityVerifier {
  private readonly CIRCUIT_PATH = './circuits/identity/';
  
  /**
   * Generate identity commitment (one person = one identity)
   */
  async generateIdentityCommitment(
    biometricHash: string,
    documentNumber: string,
    birthDate: string
  ): Promise<{
    commitment: string;
    nullifier: string;
    secret: string;
  }> {
    // Create unique identity secret
    const identityData = {
      biometric: biometricHash,
      document: documentNumber,
      birthDate: birthDate
    };
    
    const secret = this.hash(JSON.stringify(identityData));
    
    // Generate commitment = hash(secret)
    const commitment = this.hash(secret);
    
    // Generate nullifier to prevent double registration
    const nullifier = this.hash(commitment + secret);
    
    return {
      commitment,
      nullifier,
      secret
    };
  }
  
  /**
   * Generate ZK proof for identity verification
   */
  async generateIdentityProof(
    secret: string,
    municipalityCode: number
  ): Promise<{
    proof: any;
    publicSignals: string[];
  }> {
    // Circuit inputs
    const circuitInputs = {
      // Private inputs
      secret: BigInt('0x' + secret),
      
      // Public inputs
      commitment: BigInt('0x' + this.hash(secret)),
      municipalityCode: BigInt(municipalityCode),
      currentTimestamp: BigInt(Math.floor(Date.now() / 1000))
    };
    
    // In production, load actual circuit files
    // const wasmPath = `${this.CIRCUIT_PATH}identity.wasm`;
    // const zkeyPath = `${this.CIRCUIT_PATH}identity_final.zkey`;
    
    // Generate proof (simulated)
    const proof = {
      pi_a: [
        '0x' + randomBytes(32).toString('hex'),
        '0x' + randomBytes(32).toString('hex')
      ],
      pi_b: [
        ['0x' + randomBytes(32).toString('hex'), '0x' + randomBytes(32).toString('hex')],
        ['0x' + randomBytes(32).toString('hex'), '0x' + randomBytes(32).toString('hex')]
      ],
      pi_c: [
        '0x' + randomBytes(32).toString('hex'),
        '0x' + randomBytes(32).toString('hex')
      ],
      protocol: 'groth16'
    };
    
    const publicSignals = [
      circuitInputs.commitment.toString(),
      circuitInputs.municipalityCode.toString(),
      circuitInputs.currentTimestamp.toString()
    ];
    
    return { proof, publicSignals };
  }
  
  /**
   * Verify identity proof
   */
  async verifyIdentityProof(
    proof: any,
    publicSignals: string[]
  ): Promise<boolean> {
    try {
      // In production, load verification key and verify with snarkjs
      // const vKey = await fetch(`${this.CIRCUIT_PATH}verification_key.json`).then(r => r.json());
      // return await snarkjs.groth16.verify(vKey, publicSignals, proof);
      
      // Simulated verification
      const [commitment, municipalityCode, timestamp] = publicSignals;
      
      // Check timestamp is recent (within 1 hour)
      const currentTime = Math.floor(Date.now() / 1000);
      const proofTime = parseInt(timestamp);
      if (currentTime - proofTime > 3600) return false;
      
      // Check municipality code is valid
      if (parseInt(municipalityCode) <= 0) return false;
      
      return true;
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }
  
  /**
   * Check if identity is unique (prevent duplicates)
   */
  async checkUniqueIdentity(
    nullifier: string,
    blockchainProvider: any
  ): Promise<boolean> {
    // Query blockchain for existing nullifier
    // In production, this would check the smart contract
    try {
      // const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
      // const exists = await contract.nullifierExists(nullifier);
      // return !exists;
      
      // Simulated check
      return true;
    } catch (error) {
      console.error('Uniqueness check failed:', error);
      return false;
    }
  }
  
  private hash(data: string): string {
    // In production, use proper cryptographic hash
    return Buffer.from(data).toString('hex').substring(0, 64);
  }
}

/**
 * Geographic Eligibility Token Manager
 */
export class GeographicTokenManager {
  private vcManager: VCManager;
  private zkVerifier: ZKIdentityVerifier;
  
  constructor() {
    this.vcManager = new VCManager();
    this.zkVerifier = new ZKIdentityVerifier();
  }
  
  /**
   * Issue eligibility token for voting
   */
  async issueEligibilityToken(
    userDID: string,
    identityProof: any,
    municipalityCode: number,
    issuerDID: string,
    issuerPrivateKey: Uint8Array
  ): Promise<{
    token: string;
    credential: VerifiableCredential;
    expiresAt: number;
  }> {
    // Verify identity proof first
    const proofValid = await this.zkVerifier.verifyIdentityProof(
      identityProof.proof,
      identityProof.publicSignals
    );
    
    if (!proofValid) {
      throw new Error('Invalid identity proof');
    }
    
    // Extract location data
    const stateCode = Math.floor(municipalityCode / 1000);
    const countryCode = 'MX'; // Example
    
    // Issue geographic credential
    const credential = await this.vcManager.issueGeographicCredential(
      userDID,
      municipalityCode,
      stateCode,
      countryCode,
      issuerDID,
      issuerPrivateKey
    );
    
    // Generate time-bound token
    const tokenData = {
      did: userDID,
      municipality: municipalityCode,
      state: stateCode,
      country: countryCode,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      credentialId: credential.id
    };
    
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    
    return {
      token,
      credential,
      expiresAt: tokenData.expiresAt
    };
  }
  
  /**
   * Verify eligibility token
   */
  async verifyEligibilityToken(
    token: string,
    requiredMunicipality?: number
  ): Promise<{
    valid: boolean;
    municipalityCode?: number;
    errors?: string[];
  }> {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      const errors: string[] = [];
      
      // Check expiration
      if (tokenData.expiresAt < Date.now()) {
        errors.push('Token has expired');
      }
      
      // Check municipality if required
      if (requiredMunicipality && tokenData.municipality !== requiredMunicipality) {
        errors.push('Token not valid for this municipality');
      }
      
      return {
        valid: errors.length === 0,
        municipalityCode: tokenData.municipality,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid token format']
      };
    }
  }
}

/**
 * Complete Identity Flow
 */
export class ShoutAloudIdentity {
  private didManager: DIDManager;
  private vcManager: VCManager;
  private zkVerifier: ZKIdentityVerifier;
  private geoTokenManager: GeographicTokenManager;
  
  constructor() {
    this.didManager = new DIDManager();
    this.vcManager = new VCManager();
    this.zkVerifier = new ZKIdentityVerifier();
    this.geoTokenManager = new GeographicTokenManager();
  }
  
  /**
   * Complete registration flow
   */
  async registerCitizen(
    biometricHash: string,
    documentNumber: string,
    birthDate: string,
    municipalityCode: number
  ): Promise<{
    did: string;
    credential: VerifiableCredential;
    eligibilityToken: string;
    privateKey: string; // Should be stored securely by user
  }> {
    // Step 1: Generate DID
    const { did, privateKey, publicKey } = await this.didManager.generateDID();
    
    // Step 2: Generate identity commitment
    const { commitment, nullifier, secret } = await this.zkVerifier.generateIdentityCommitment(
      biometricHash,
      documentNumber,
      birthDate
    );
    
    // Step 3: Check uniqueness
    const isUnique = await this.zkVerifier.checkUniqueIdentity(nullifier, null);
    if (!isUnique) {
      throw new Error('Identity already registered');
    }
    
    // Step 4: Generate ZK proof
    const { proof, publicSignals } = await this.zkVerifier.generateIdentityProof(
      secret,
      municipalityCode
    );
    
    // Step 5: Issue eligibility token and credential
    // In production, issuer would be a trusted validator node
    const issuerDID = 'did:shout:polygon:validator1';
    const issuerPrivateKey = new Uint8Array(32); // Mock issuer key
    
    const { token, credential } = await this.geoTokenManager.issueEligibilityToken(
      did,
      { proof, publicSignals },
      municipalityCode,
      issuerDID,
      issuerPrivateKey
    );
    
    return {
      did,
      credential,
      eligibilityToken: token,
      privateKey: base58.encode(privateKey)
    };
  }
  
  /**
   * Authenticate for voting
   */
  async authenticateForVoting(
    did: string,
    privateKeyBase58: string,
    eligibilityToken: string,
    proposalMunicipality: number
  ): Promise<{
    authorized: boolean;
    sessionToken?: string;
    errors?: string[];
  }> {
    // Verify eligibility token
    const { valid, municipalityCode, errors } = await this.geoTokenManager.verifyEligibilityToken(
      eligibilityToken,
      proposalMunicipality
    );
    
    if (!valid) {
      return { authorized: false, errors };
    }
    
    // Generate session token for voting
    const privateKey = base58.decode(privateKeyBase58);
    const sessionData = {
      did,
      municipality: municipalityCode,
      timestamp: Date.now(),
      purpose: 'voting',
      proposal: proposalMunicipality
    };
    
    const signature = await this.didManager.signWithDID(sessionData, privateKey, did);
    const sessionToken = Buffer.from(JSON.stringify({
      data: sessionData,
      signature
    })).toString('base64');
    
    return {
      authorized: true,
      sessionToken
    };
  }
}