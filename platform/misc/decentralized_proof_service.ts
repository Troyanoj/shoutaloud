import { generateKeyPairSync, sign, verify } from 'crypto';

// ============================================================================
// TIPOS FUNDAMENTALES PARA VERIFICABILIDAD DESCENTRALIZADA
// ============================================================================

export interface ValidationProof {
  projectId: string;
  validatorDid: string;        // Identificador descentralizado del validador
  evidenceId: string;
  impactLevel: 'valid' | 'partial' | 'invalid' | 'needs_review';
  impactScore?: number;        // 0-100 si aplica
  comment: string;
  evidenceHash: string;        // Hash del contenido de la evidencia
  timestamp: number;
  signature?: string;          // Firma criptográfica
  ipfsHash?: string;          // Hash de almacenamiento descentralizado
  blockchainTx?: string;      // ID de transacción blockchain (opcional)
}

export interface DigitalIdentity {
  did: string;                 // did:shout:0x...
  publicKey: string;
  privateKey?: string;         // Solo para el propietario
  name: string;
  reputation: number;          // Basado en validaciones exitosas
  createdAt: number;
}

export interface ProofChain {
  proofId: string;
  proofs: ValidationProof[];
  merkleRoot: string;          // Raíz del árbol Merkle para eficiencia
  consensusLevel: 'individual' | 'community' | 'verified';
  verificationCount: number;
}

// ============================================================================
// SERVICIO PRINCIPAL DE PRUEBAS DESCENTRALIZADAS
// ============================================================================

export class DecentralizedProofService {
  private static instance: DecentralizedProofService;
  private proofStorage: Map<string, ValidationProof> = new Map();
  private identityStorage: Map<string, DigitalIdentity> = new Map();
  private proofChains: Map<string, ProofChain> = new Map();

  static getInstance(): DecentralizedProofService {
    if (!this.instance) {
      this.instance = new DecentralizedProofService();
    }
    return this.instance;
  }

  // ========================================================================
  // GESTIÓN DE IDENTIDADES DIGITALES
  // ========================================================================

  /**
   * Genera una nueva identidad digital descentralizada
   */
  generateDID(name: string): DigitalIdentity {
    const keyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const did = `did:shout:${this.generateShortHash(keyPair.publicKey)}`;
    
    const identity: DigitalIdentity = {
      did,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      name,
      reputation: 100, // Todos empiezan con reputación neutra
      createdAt: Date.now()
    };

    this.identityStorage.set(did, identity);
    return identity;
  }

  /**
   * Obtiene identidad por DID (sin clave privada para seguridad)
   */
  getPublicIdentity(did: string): Omit<DigitalIdentity, 'privateKey'> | null {
    const identity = this.identityStorage.get(did);
    if (!identity) return null;
    
    const { privateKey, ...publicIdentity } = identity;
    return publicIdentity;
  }

  /**
   * Obtiene identidades con mejor reputación (para sugerir validadores)
   */
  getTopValidators(limit: number = 10): Omit<DigitalIdentity, 'privateKey'>[] {
    return Array.from(this.identityStorage.values())
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit)
      .map(({ privateKey, ...identity }) => identity);
  }

  // ========================================================================
  // FIRMA Y VALIDACIÓN CRIPTOGRÁFICA
  // ========================================================================

  /**
   * Firma una validación de impacto con la clave privada del usuario
   */
  signValidation(validation: ValidationProof, privateKey: string): string {
    const dataToSign = this.serializeValidationForSigning(validation);
    const signature = sign('sha256', Buffer.from(dataToSign), privateKey);
    return signature.toString('base64');
  }

  /**
   * Verifica la integridad de una firma
   */
  verifySignature(validation: ValidationProof, publicKey: string): boolean {
    if (!validation.signature) return false;
    
    const dataToSign = this.serializeValidationForSigning(validation);
    try {
      return verify(
        'sha256',
        Buffer.from(dataToSign),
        publicKey,
        Buffer.from(validation.signature, 'base64')
      );
    } catch (error) {
      console.error('Error verificando firma:', error);
      return false;
    }
  }

  /**
   * Serializa validación para firma consistente
   */
  private serializeValidationForSigning(validation: ValidationProof): string {
    return JSON.stringify({
      projectId: validation.projectId,
      validatorDid: validation.validatorDid,
      evidenceId: validation.evidenceId,
      impactLevel: validation.impactLevel,
      impactScore: validation.impactScore,
      comment: validation.comment,
      evidenceHash: validation.evidenceHash,
      timestamp: validation.timestamp
    });
  }

  // ========================================================================
  // ALMACENAMIENTO DESCENTRALIZADO (IPFS MOCK)
  // ========================================================================

  /**
   * Almacena validación firmada en IPFS (simulado)
   */
  async storeValidationProofToIPFS(validation: ValidationProof): Promise<string> {
    // En implementación real, usar IPFS HTTP API o js-ipfs
    const content = JSON.stringify(validation, null, 2);
    const hash = this.generateIPFSHash(content);
    
    // Simular almacenamiento
    await this.simulateIPFSStorage(hash, content);
    
    return hash;
  }

  /**
   * Recupera validación desde IPFS
   */
  async retrieveValidationFromIPFS(ipfsHash: string): Promise<ValidationProof | null> {
    try {
      // En implementación real, hacer fetch a IPFS gateway
      const content = await this.simulateIPFSRetrieval(ipfsHash);
      return JSON.parse(content) as ValidationProof;
    } catch (error) {
      console.error('Error recuperando de IPFS:', error);
      return null;
    }
  }

  private generateIPFSHash(content: string): string {
    // Simula formato de hash IPFS
    return `Qm${this.generateShortHash(content).slice(0, 44)}`;
  }

  private async simulateIPFSStorage(hash: string, content: string): Promise<void> {
    // Mock storage - en prod usar IPFS real
    localStorage.setItem(`ipfs:${hash}`, content);
  }

  private async simulateIPFSRetrieval(hash: string): Promise<string> {
    const content = localStorage.getItem(`ipfs:${hash}`);
    if (!content) throw new Error('Contenido no encontrado en IPFS');
    return content;
  }

  // ========================================================================
  // GESTIÓN DE CADENAS DE PRUEBAS
  // ========================================================================

  /**
   * Crea o actualiza cadena de pruebas para un proyecto
   */
  addProofToChain(projectId: string, proof: ValidationProof): ProofChain {
    let chain = this.proofChains.get(projectId);
    
    if (!chain) {
      chain = {
        proofId: `chain:${projectId}`,
        proofs: [],
        merkleRoot: '',
        consensusLevel: 'individual',
        verificationCount: 0
      };
    }

    chain.proofs.push(proof);
    chain.merkleRoot = this.calculateMerkleRoot(chain.proofs);
    chain.verificationCount = chain.proofs.length;
    
    // Determinar nivel de consenso
    if (chain.verificationCount >= 10) {
      chain.consensusLevel = 'verified';
    } else if (chain.verificationCount >= 3) {
      chain.consensusLevel = 'community';
    }

    this.proofChains.set(projectId, chain);
    return chain;
  }

  /**
   * Obtiene cadena de pruebas para un proyecto
   */
  getProofChain(projectId: string): ProofChain | null {
    return this.proofChains.get(projectId) || null;
  }

  /**
   * Calcula raíz Merkle simplificada para eficiencia
   */
  private calculateMerkleRoot(proofs: ValidationProof[]): string {
    if (proofs.length === 0) return '';
    
    const hashes = proofs.map(proof => this.generateShortHash(
      proof.signature || proof.evidenceHash
    ));
    
    // Simplificado - en prod usar implementación Merkle completa
    return this.generateShortHash(hashes.join(''));
  }

  // ========================================================================
  // EXPORTACIÓN Y CERTIFICACIÓN
  // ========================================================================

  /**
   * Genera certificado verificable para descarga
   */
  generateVerifiableCertificate(projectId: string): {
    certificate: any;
    qrCode: string;
    pdfUrl: string;
  } {
    const chain = this.getProofChain(projectId);
    if (!chain) throw new Error('No se encontró cadena de pruebas');

    const certificate = {
      projectId,
      verificationLevel: chain.consensusLevel,
      totalValidations: chain.verificationCount,
      merkleRoot: chain.merkleRoot,
      validatedBy: chain.proofs.map(p => p.validatorDid),
      generatedAt: Date.now(),
      verificationUrl: `https://shout-aloud.org/verify/${chain.merkleRoot}`
    };

    const qrCode = this.generateQRCode(certificate.verificationUrl);
    const pdfUrl = this.generatePDFCertificate(certificate);

    return { certificate, qrCode, pdfUrl };
  }

  /**
   * Verifica certificado mediante URL pública
   */
  async verifyCertificate(merkleRoot: string): Promise<{
    isValid: boolean;
    details: any;
  }> {
    // En implementación real, consultar blockchain/IPFS
    const chain = Array.from(this.proofChains.values())
      .find(c => c.merkleRoot === merkleRoot);

    return {
      isValid: !!chain,
      details: chain ? {
        projectId: chain.proofId.replace('chain:', ''),
        consensusLevel: chain.consensusLevel,
        verificationCount: chain.verificationCount,
        lastUpdate: Math.max(...chain.proofs.map(p => p.timestamp))
      } : null
    };
  }

  // ========================================================================
  // UTILIDADES PRIVADAS
  // ========================================================================

  private generateShortHash(input: string): string {
    // Simulación de hash - en prod usar crypto real
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private generateQRCode(url: string): string {
    // Mock QR - en prod usar librería qrcode
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" fill="black" font-size="12">QR: ${url.slice(-10)}</text></svg>`;
  }

  private generatePDFCertificate(certificate: any): string {
    // Mock PDF - en prod usar jsPDF o similar
    return `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==`;
  }

  // ========================================================================
  // MÉTRICAS Y ANÁLISIS
  // ========================================================================

  /**
   * Obtiene métricas de verificabilidad del sistema
   */
  getSystemMetrics(): {
    totalIdentities: number;
    totalProofs: number;
    totalProjects: number;
    averageReputationScore: number;
    consensusDistribution: Record<string, number>;
  } {
    const chains = Array.from(this.proofChains.values());
    const identities = Array.from(this.identityStorage.values());

    return {
      totalIdentities: identities.length,
      totalProofs: chains.reduce((sum, chain) => sum + chain.proofs.length, 0),
      totalProjects: chains.length,
      averageReputationScore: identities.length > 0 
        ? identities.reduce((sum, id) => sum + id.reputation, 0) / identities.length 
        : 0,
      consensusDistribution: chains.reduce((dist, chain) => {
        dist[chain.consensusLevel] = (dist[chain.consensusLevel] || 0) + 1;
        return dist;
      }, {} as Record<string, number>)
    };
  }
}

// ============================================================================
// INSTANCIA SINGLETON EXPORTADA
// ============================================================================

export const proofService = DecentralizedProofService.getInstance();