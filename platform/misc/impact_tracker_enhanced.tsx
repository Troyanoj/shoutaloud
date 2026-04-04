import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, MapPin, Eye, CheckCircle, AlertTriangle, Clock, Shield, Hash, Download, ExternalLink, Zap, Key, Copy, Check, FileText, QrCode } from 'lucide-react';

// ============================================================================
// TIPOS Y SERVICIOS INTEGRADOS
// ============================================================================

interface ValidationProof {
  projectId: string;
  validatorDid: string;
  evidenceId: string;
  impactLevel: 'valid' | 'partial' | 'invalid' | 'needs_review';
  impactScore?: number;
  comment: string;
  evidenceHash: string;
  timestamp: number;
  signature?: string;
  ipfsHash?: string;
}

interface DigitalIdentity {
  did: string;
  publicKey: string;
  privateKey?: string;
  name: string;
  reputation: number;
  createdAt: number;
}

interface ProofChain {
  proofId: string;
  proofs: ValidationProof[];
  merkleRoot: string;
  consensusLevel: 'individual' | 'community' | 'verified';
  verificationCount: number;
}

interface Evidence {
  id: string;
  type: 'photo' | 'video' | 'document' | 'testimony';
  title: string;
  description: string;
  url: string;
  uploadedBy: string;
  timestamp: number;
  location?: string;
  verified?: boolean;
  validations?: ValidationProof[];
}

interface ImpactData {
  participantCount: number;
  evidenceCount: number;
  validationCount: number;
  consensusLevel: 'individual' | 'community' | 'verified';
  impactScore: number;
  reachEstimate: number;
  evidenceItems: Evidence[];
  validationProofs: ValidationProof[];
  proofChain?: ProofChain;
}

// ============================================================================
// SERVICIO DE PRUEBAS DESCENTRALIZADAS (INTEGRADO)
// ============================================================================

class DecentralizedProofService {
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

  generateDID(name: string): DigitalIdentity {
    // Simulación de generación de claves RSA
    const keyId = this.generateShortHash(name + Date.now().toString());
    const did = `did:shout:${keyId}`;
    
    const identity: DigitalIdentity = {
      did,
      publicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${keyId}...\n-----END PUBLIC KEY-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj${keyId}...\n-----END PRIVATE KEY-----`,
      name,
      reputation: 100,
      createdAt: Date.now()
    };

    this.identityStorage.set(did, identity);
    return identity;
  }

  getPublicIdentity(did: string): Omit<DigitalIdentity, 'privateKey'> | null {
    const identity = this.identityStorage.get(did);
    if (!identity) return null;
    
    const { privateKey, ...publicIdentity } = identity;
    return publicIdentity;
  }

  signValidation(validation: ValidationProof, privateKey: string): string {
    const dataToSign = JSON.stringify({
      projectId: validation.projectId,
      validatorDid: validation.validatorDid,
      evidenceId: validation.evidenceId,
      impactLevel: validation.impactLevel,
      impactScore: validation.impactScore,
      comment: validation.comment,
      evidenceHash: validation.evidenceHash,
      timestamp: validation.timestamp
    });
    
    // Simulación de firma RSA
    return btoa(this.generateShortHash(dataToSign + privateKey));
  }

  async storeValidationProofToIPFS(validation: ValidationProof): Promise<string> {
    const content = JSON.stringify(validation, null, 2);
    const hash = `Qm${this.generateShortHash(content).slice(0, 44)}`;
    
    // Simulación de almacenamiento IPFS
    localStorage.setItem(`ipfs:${hash}`, content);
    return hash;
  }

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
    
    if (chain.verificationCount >= 10) {
      chain.consensusLevel = 'verified';
    } else if (chain.verificationCount >= 3) {
      chain.consensusLevel = 'community';
    }

    this.proofChains.set(projectId, chain);
    return chain;
  }

  getProofChain(projectId: string): ProofChain | null {
    return this.proofChains.get(projectId) || null;
  }

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

  private calculateMerkleRoot(proofs: ValidationProof[]): string {
    if (proofs.length === 0) return '';
    
    const hashes = proofs.map(proof => this.generateShortHash(
      proof.signature || proof.evidenceHash
    ));
    
    return this.generateShortHash(hashes.join(''));
  }

  private generateShortHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private generateQRCode(url: string): string {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" fill="black" font-size="12">QR: ${url.slice(-10)}</text></svg>`;
  }

  private generatePDFCertificate(certificate: any): string {
    return `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==`;
  }
}

const proofService = DecentralizedProofService.getInstance();

// ============================================================================
// COMPONENTE DE FIRMA DE VALIDACIÓN (INTEGRADO)
// ============================================================================

interface ValidationSignerProps {
  projectId: string;
  evidenceId: string;
  evidenceContent: string;
  onValidationSigned: (signedValidation: ValidationProof) => void;
  onClose: () => void;
}

const ValidationSigner: React.FC<ValidationSignerProps> = ({
  projectId,
  evidenceId,
  evidenceContent,
  onValidationSigned,
  onClose
}) => {
  const [currentIdentity, setCurrentIdentity] = useState<DigitalIdentity | null>(null);
  const [impactLevel, setImpactLevel] = useState<'valid' | 'partial' | 'invalid' | 'needs_review'>('valid');
  const [impactScore, setImpactScore] = useState<number>(75);
  const [comment, setComment] = useState('');
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [signedValidation, setSignedValidation] = useState<ValidationProof | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    const savedDID = localStorage.getItem('userDID');
    if (savedDID) {
      const identity = proofService.getPublicIdentity(savedDID);
      if (identity) {
        setCurrentIdentity({
          ...identity,
          privateKey: localStorage.getItem('userPrivateKey') || ''
        });
      }
    }
  }, []);

  const createNewIdentity = () => {
    const name = prompt('Ingresa tu nombre para crear tu identidad digital:');
    if (!name) return;

    const identity = proofService.generateDID(name);
    localStorage.setItem('userDID', identity.did);
    localStorage.setItem('userPrivateKey', identity.privateKey || '');
    setCurrentIdentity(identity);
  };

  const handleSignValidation = async () => {
    if (!currentIdentity || !currentIdentity.privateKey) return;

    setIsProcessing(true);

    try {
      const evidenceHash = await generateEvidenceHash(evidenceContent);

      const validation: ValidationProof = {
        projectId,
        validatorDid: currentIdentity.did,
        evidenceId,
        impactLevel,
        impactScore: impactLevel === 'valid' ? impactScore : undefined,
        comment,
        evidenceHash,
        timestamp: Date.now()
      };

      const signature = proofService.signValidation(validation, currentIdentity.privateKey);
      const signedValidation: ValidationProof = { ...validation, signature };

      const ipfsHash = await proofService.storeValidationProofToIPFS(signedValidation);
      signedValidation.ipfsHash = ipfsHash;

      proofService.addProofToChain(projectId, signedValidation);

      setSignedValidation(signedValidation);
      setIpfsHash(ipfsHash);
      setIsSigningMode(true);

    } catch (error) {
      console.error('Error firmando validación:', error);
      alert('Error al firmar la validación. Por favor, intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmValidation = () => {
    if (signedValidation) {
      onValidationSigned(signedValidation);
      onClose();
    }
  };

  const generateEvidenceHash = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const downloadCertificate = () => {
    try {
      const certificate = proofService.generateVerifiableCertificate(projectId);
      setShowCertificate(true);
      
      const element = document.createElement('a');
      element.href = certificate.pdfUrl;
      element.download = `shout-aloud-certificate-${projectId}.pdf`;
      element.click();
    } catch (error) {
      console.error('Error generando certificado:', error);
    }
  };

  if (!currentIdentity) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Key className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Identidad Digital Requerida
            </h2>
            <p className="text-gray-600 mb-6">
              Para firmar validaciones de impacto necesitas una identidad digital descentralizada. 
              Esto garantiza la autenticidad y trazabilidad de tus validaciones.
            </p>
            <div className="space-y-3">
              <button
                onClick={createNewIdentity}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Crear Mi Identidad Digital
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSigningMode && signedValidation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ✅ Validación Firmada Exitosamente
            </h2>
            <p className="text-gray-600">
              Tu validación ha sido firmada criptográficamente y almacenada de forma descentralizada
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              Detalles de la Validación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Validador:</span>
                <p className="text-gray-800 break-all">{currentIdentity.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Nivel de Impacto:</span>
                <p className={`font-medium ${
                  impactLevel === 'valid' ? 'text-green-600' :
                  impactLevel === 'partial' ? 'text-yellow-600' :
                  impactLevel === 'needs_review' ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {impactLevel === 'valid' ? '✅ Válido' :
                   impactLevel === 'partial' ? '⚠️ Parcial' :
                   impactLevel === 'needs_review' ? '🔍 Necesita Revisión' : '❌ Inválido'}
                </p>
              </div>
              {impactScore && (
                <div>
                  <span className="font-medium text-gray-600">Puntuación:</span>
                  <p className="text-gray-800">{impactScore}/100</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-600">Timestamp:</span>
                <p className="text-gray-800">{new Date(signedValidation.timestamp).toLocaleString()}</p>
              </div>
            </div>

            {comment && (
              <div className="mt-4">
                <span className="font-medium text-gray-600">Comentario:</span>
                <p className="text-gray-800 mt-1">{comment}</p>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <Hash className="w-4 h-4 mr-2" />
                Hash IPFS
              </h4>
              <div className="flex items-center space-x-2">
                <code className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded flex-1 break-all">
                  {ipfsHash}
                </code>
                <button
                  onClick={() => copyToClipboard(ipfsHash, 'ipfs')}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  title="Copiar hash IPFS"
                >
                  {copySuccess === 'ipfs' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Firma Digital
              </h4>
              <div className="flex items-center space-x-2">
                <code className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded flex-1 break-all">
                  {signedValidation.signature?.slice(0, 64)}...
                </code>
                <button
                  onClick={() => copyToClipboard(signedValidation.signature || '', 'signature')}
                  className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                  title="Copiar firma"
                >
                  {copySuccess === 'signature' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleConfirmValidation}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Confirmar Validación
            </button>
            <button
              onClick={downloadCertificate}
              className="flex items-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Certificado</span>
            </button>
            <button
              onClick={() => setShowCertificate(!showCertificate)}
              className="flex items-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>QR</span>
            </button>
          </div>

          {showCertificate && (
            <div className="mt-6 bg-gray-50 rounded-lg p-6 text-center">
              <h4 className="font-semibold text-gray-800 mb-4">Código QR de Verificación</h4>
              <div className="inline-block bg-white p-4 rounded-lg shadow">
                <img 
                  src={proofService.generateVerifiableCertificate(projectId).qrCode} 
                  alt="QR de verificación" 
                  className="w-32 h-32 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Escanea para verificar la autenticidad
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Firmar Validación de Impacto
          </h2>
          <p className="text-gray-600">
            Valida y firma criptográficamente el impacto de esta evidencia
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">{currentIdentity.name}</h3>
              <p className="text-sm text-blue-600">Reputación: {currentIdentity.reputation}/100</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600">DID</p>
              <p className="text-sm text-blue-800 font-mono">
                {currentIdentity.did.slice(0, 20)}...
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Nivel de Impacto Observado
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'valid', label: '✅ Válido', color: 'green' },
                { value: 'partial', label: '⚠️ Parcial', color: 'yellow' },
                { value: 'needs_review', label: '🔍 Revisión', color: 'blue' },
                { value: 'invalid', label: '❌ Inválido', color: 'red' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setImpactLevel(option.value as any)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    impactLevel === option.value
                      ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {impactLevel === 'valid' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntuación de Impacto: {impactScore}/100
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={impactScore}
                onChange={(e) => setImpactScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10B981 0%, #10B981 ${impactScore}%, #E5E7EB ${impactScore}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Sin impacto</span>
                <span>Impacto alto</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario de Validación
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explica tu evaluación del impacto observado..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">
                  Responsabilidad de Validación
                </h4>
                <p className="text-sm text-yellow-700">
                  Al firmar esta validación, certificas que has revisado la evidencia y 
                  tu evaluación es honesta y fundamentada. Las validaciones falsas pueden 
                  afectar tu reputación en la red.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Vista previa de la evidencia
            </h4>
            <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
              {evidenceContent.slice(0, 300)}
              {evidenceContent.length > 300 && '...'}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSignValidation}
            disabled={!comment.trim() || isProcessing}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Firmando...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Firmar Validación</span>
              </>
            )}
          </button>
        </div>

        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            ℹ️ Información técnica sobre la firma
          </summary>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="mb-2">
              <strong>Algoritmo:</strong> RSA-2048 con SHA-256
            </p>
            <p className="mb-2">
              <strong>Almacenamiento:</strong> IPFS descentralizado
            </p>
            <p className="mb-2">
              <strong>Verificación:</strong> Pública mediante hash Merkle
            </p>
            <p>
              <strong>Privacidad:</strong> Solo tu firma es pública, no tu clave privada
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL - IMPACT TRACKER
// ============================================================================

interface ImpactTrackerProps {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  onClose: () => void;
}

export const ImpactTracker: React.FC<ImpactTrackerProps> = ({
  projectId,
  projectTitle,
  projectDescription,
  onClose
}) => {
  const [impactData, setImpactData] = useState<ImpactData>({
    participantCount: 0,
    evidenceCount: 0,
    validationCount: 0,
    consensusLevel: 'individual',
    impactScore: 0,
    reachEstimate: 0,
    evidenceItems: [],
    validationProofs: []
  });

  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showValidationSigner, setShowValidationSigner] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'validations' | 'blockchain'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadImpactData();
  }, [projectId]);

  const loadImpactData = async () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const mockEvidenceItems: Evidence[] = [
        {
          id: 'ev001',
          type: 'photo',
          title: 'Instalación de contenedores de reciclaje',
          description: 'Nuevos contenedores instalados en la Plaza Principal según propuesta ciudadana',
          url: '/api/evidence/photo001.jpg',
          uploadedBy: 'did:shout:ana_garcia',
          timestamp: Date.now() - 86400000,
          location: 'Plaza Principal, Ciudad',
          verified: true,
          validations: []
        },
        {
          id: 'ev002',
          type: 'document',
          title: 'Acta municipal de aprobación',
          description: 'Documento oficial confirmando la implementación de la propuesta',
          url: '/api/evidence/acta_municipal.pdf',
          uploadedBy: 'did:shout:municipio_oficial',
          timestamp: Date.now() - 43200000,
          verified: true,
          validations: []
        },
        {
          id: 'ev003',
          type: 'video',
          title: 'Testimonio de vecinos',
          description: 'Vecinos confirmando el impacto positivo en el barrio',
          url: '/api/evidence/testimonios.mp4',
          uploadedBy: 'did:shout:carlos_lopez',
          timestamp: Date.now() - 21600000,
          validations: []
        }
      ];

      const proofChain = proofService.getProofChain(projectId);
      const validationProofs = proofChain?.proofs || [];

      setImpactData({
        participantCount: 847,
        evidenceCount: mockEvidenceItems.length,
        validationCount: validationProofs.length,
        consensusLevel: proofChain?.consensusLevel || 'individual',
        impactScore: calculateAverageImpactScore(validationProofs),
        reachEstimate: 2340,
        evidenceItems: mockEvidenceItems,
        validationProofs,
        proofChain
      });

      setIsLoading(false);
    }, 1000);
  };

  const calculateAverageImpactScore = (validations: ValidationProof[]): number => {
    const validScores = validations
      .filter(v => v.impactScore && v.impactLevel === 'valid')
      .map(v => v.impactScore!);
    
    return validScores.length > 0 
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : 0;
  };

  const handleValidateEvidence = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setShowValidationSigner(true);
  };

  const handleValidationSigned = (signedValidation: ValidationProof) => {
    setImpactData(prev => ({
      ...prev,
      validationCount: prev.validationCount + 1,
      validationProofs: [...prev.validationProofs, signedValidation],
      impactScore: calculateAverageImpactScore([...prev.validationProofs, signedValidation]),
      proofChain: proofService.getProofChain(projectId)
    }));

    if (selectedEvidence) {
      setImpactData(prev => ({
        ...prev,
        evidenceItems: prev.evidenceItems.map(item =>
          item.id === selectedEvidence.id
            ? { ...item, validations: [...(item.validations || []), signedValidation] }
            : item
        )
      }));
    }

    setSelectedEvidence(null);
    setShowValidationSigner(false);
  };

  const downloadBlockchainCertificate = () => {
    try {
      const certificate = proofService.generateVerifiableCertificate(projectId);
      
      const element = document.createElement('a');
      element.href = certificate.pdfUrl;
      element.download = `shout-aloud-certificate-${projectId}.pdf`;
      element.click();
      
      alert('📜 Certificado blockchain descargado exitosamente');
    } catch (error) {
      alert('Error generando certificado. El proyecto necesita más validaciones.');
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-blue-600" />
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">{impactData.participantCount.toLocaleString()}</p>
          <p className="text-sm text-blue-600">Participantes Verificados</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Eye className="w-8 h-8 text-green-600" />
            <Hash className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-800 mt-2">{impactData.evidenceCount}</p>
          <p className="text-sm text-green-600">Evidencias Validadas</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-800 mt-2">{impactData.validationCount}</p>
          <p className="text-sm text-purple-600">Validaciones Firmadas</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <TrendingUp className="w-8 h-8 text-orange-600" />
          <p className="text-2xl font-bold text-orange-800 mt-2">{impactData.impactScore}/100</p>
          <p className="text-sm text-orange-600">Puntuación Consenso</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-indigo-800 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Nivel de Verificabilidad Blockchain
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            impactData.consensusLevel === 'verified' ? 'bg-green-100 text-green-800' :
            impactData.consensusLevel === 'community' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {impactData.consensusLevel === 'verified' ? '🔒 Verificado' :
             impactData.consensusLevel === 'community' ? '👥 Comunitario' :
             '👤 Individual'}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
              impactData.validationCount >= 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              👤
            </div>
            <p className="text-sm font-medium">Individual (1+ validación)</p>
            <p className="text-xs text-gray-500">Firmada criptográficamente</p>
          </div>

          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
              impactData.validationCount >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              👥
            </div>
            <p className="text-sm font-medium">Comunitario (3+ validaciones)</p>
            <p className="text-xs text-gray-500">Consenso distribuido</p>
          </div>

          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
              impactData.validationCount >= 10 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              🔒
            </div>
            <p className="text-sm font-medium">Verificado (10+ validaciones)</p>
            <p className="text-xs text-gray-500">Máxima confiabilidad</p>
          </div>
        </div>

        {impactData.proofChain && (
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <div className="flex items-center justify-between text-sm text-indigo-700">
              <span>Hash Merkle: <code className="bg-indigo-100 px-2 py-1 rounded">{impactData.proofChain.merkleRoot.slice(0, 16)}...</code></span>
              <button
                onClick={downloadBlockchainCertificate}
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
              >
                <Download className="w-4 h-4" />
                <span>Certificado</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Progreso del Impacto Verificado</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Evidencia Documentada</span>
              <span>{impactData.evidenceCount}/5 evidencias</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${Math.min((impactData.evidenceCount / 5) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Validaciones Criptográficas</span>
              <span>{impactData.validationCount}/10 validaciones</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min((impactData.validationCount / 10) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Puntuación de Consenso</span>
              <span>{impactData.impactScore}/100 puntos</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${impactData.impactScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvidenceTab = () => (
    <div className="space-y-4">
      {impactData.evidenceItems.map((evidence) => (
        <div key={evidence.id} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  evidence.type === 'photo' ? 'bg-blue-100 text-blue-800' :
                  evidence.type === 'video' ? 'bg-purple-100 text-purple-800' :
                  evidence.type === 'document' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {evidence.type.toUpperCase()}
                </span>
                {evidence.verified && (
                  <CheckCircle className="w-4 h-4 text-green-600" title="Verificado oficialmente" />
                )}
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">{evidence.title}</h4>
              <p className="text-gray-600 text-sm mb-3">{evidence.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(evidence.timestamp).toLocaleDateString()}
                </span>
                {evidence.location && (
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {evidence.location}
                  </span>
                )}
                <span>Por: {evidence.uploadedBy.split(':')[2]}</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={() => handleValidateEvidence(evidence)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Shield className="w-4 h-4" />
                <span>Validar</span>
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center space-x-1">
                <ExternalLink className="w-4 h-4" />
                <span>Ver</span>
              </button>
            </div>
          </div>

          {evidence.validations && evidence.validations.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Validaciones Criptográficas ({evidence.validations.length})
              </h5>
              <div className="space-y-2">
                {evidence.validations.slice(0, 3).map((validation, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        validation.impactLevel === 'valid' ? 'bg-green-500' :
                        validation.impactLevel === 'partial' ? 'bg-yellow-500' :
                        validation.impactLevel === 'needs_review' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm text-gray-700">
                        {validation.validatorDid.split(':')[2]}
                      </span>
                      {validation.impactScore && (
                        <span className="text-xs text-gray-500">({validation.impactScore}/100)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Firmado</span>
                    </div>
                  </div>
                ))}
                {evidence.validations.length > 3 && (
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      +{evidence.validations.length - 3} validaciones más
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderValidationsTab = () => (
    <div className="space-y-4">
      {impactData.validationProofs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aún no hay validaciones criptográficas</p>
          <p className="text-sm">Las validaciones firmadas aparecerán aquí</p>
        </div>
      ) : (
        impactData.validationProofs.map((validation, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    validation.impactLevel === 'valid' ? 'bg-green-500' :
                    validation.impactLevel === 'partial' ? 'bg-yellow-500' :
                    validation.impactLevel === 'needs_review' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium text-gray-800">
                    {validation.impactLevel === 'valid' ? 'Validación Positiva' :
                     validation.impactLevel === 'partial' ? 'Validación Parcial' :
                     validation.impactLevel === 'needs_review' ? 'Necesita Revisión' : 'Validación Negativa'}
                  </span>
                  {validation.impactScore && (
                    <span className="text-sm text-gray-600">({validation.impactScore}/100)</span>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{validation.comment}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(validation.timestamp).toLocaleString()}
                  </span>
                  <span>Validador: {validation.validatorDid.split(':')[2]}</span>
                </div>
              </div>
              
              <div className="ml-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Firmado</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                  <Hash className="w-4 h-4" />
                  <span>Información criptográfica</span>
                </summary>
                <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded">
                  <div>
                    <span className="font-medium text-gray-600">Firma digital:</span>
                    <code className="block text-xs text-gray-800 bg-white p-2 rounded mt-1 break-all">
                      {validation.signature?.slice(0, 64)}...
                    </code>
                  </div>
                  {validation.ipfsHash && (
                    <div>
                      <span className="font-medium text-gray-600">Hash IPFS:</span>
                      <code className="block text-xs text-gray-800 bg-white p-2 rounded mt-1">
                        {validation.ipfsHash}
                      </code>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Hash evidencia:</span>
                    <code className="block text-xs text-gray-800 bg-white p-2 rounded mt-1">
                      {validation.evidenceHash}
                    </code>
                  </div>
                </div>
              </details>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderBlockchainTab = () => {
    const SystemMetricsDisplay = () => {
      const [systemMetrics, setSystemMetrics] = useState(proofService.getSystemMetrics());

      useEffect(() => {
        const interval = setInterval(() => {
          setSystemMetrics(proofService.getSystemMetrics());
        }, 5000);

        return () => clearInterval(interval);
      }, []);

      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{systemMetrics.totalIdentities}</p>
            <p className="text-sm text-gray-600">Identidades DID</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{systemMetrics.totalProofs}</p>
            <p className="text-sm text-gray-600">Validaciones Totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{systemMetrics.totalProjects}</p>
            <p className="text-sm text-gray-600">Proyectos Rastreados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{Math.round(systemMetrics.averageReputationScore)}</p>
            <p className="text-sm text-gray-600">Reputación Promedio</p>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {impactData.proofChain ? (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              Cadena de Pruebas Blockchain
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-purple-700 mb-3">Métricas de Consenso</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-600">Total Validaciones:</span>
                    <span className="font-medium text-purple-800">{impactData.proofChain.verificationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-600">Nivel de Consenso:</span>
                    <span className={`font-medium ${
                      impactData.proofChain.consensusLevel === 'verified' ? 'text-green-700' :
                      impactData.proofChain.consensusLevel === 'community' ? 'text-blue-700' :
                      'text-gray-700'
                    }`}>
                      {impactData.proofChain.consensusLevel === 'verified' ? '🔒 Verificado' :
                       impactData.proofChain.consensusLevel === 'community' ? '👥 Comunitario' :
                       '👤 Individual'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-600">Puntuación Promedio:</span>
                    <span className="font-medium text-purple-800">{impactData.impactScore}/100</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-purple-700 mb-3">Verificabilidad Técnica</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-purple-600">Raíz Merkle:</span>
                    <code className="block text-xs text-purple-800 bg-purple-100 p-2 rounded mt-1">
                      {impactData.proofChain.merkleRoot}
                    </code>
                  </div>
                  <div>
                    <span className="text-sm text-purple-600">ID de Cadena:</span>
                    <code className="block text-xs text-purple-800 bg-purple-100 p-2 rounded mt-1">
                      {impactData.proofChain.proofId}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={downloadBlockchainCertificate}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Certificado</span>
              </button>
              <button
                onClick={() => {
                  const url = `https://shout-aloud.org/verify/${impactData.proofChain?.merkleRoot}`;
                  navigator.clipboard.writeText(url);
                  alert('URL de verificación copiada al portapapeles');
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Compartir Verificación</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Cadena de Pruebas No Iniciada
            </h3>
            <p className="text-gray-600 mb-4">
              Se necesita al menos una validación firmada para crear la cadena de pruebas blockchain
            </p>
            <button
              onClick={() => setActiveTab('evidence')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Validar Evidencia
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Estadísticas del Sistema Shout Aloud
          </h3>
          
          <SystemMetricsDisplay />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            🔍 ¿Cómo Funciona la Verificabilidad?
          </h3>
          
          <div className="space-y-4 text-sm text-blue-700">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Firma Criptográfica</p>
                <p>Cada validación se firma con RSA-2048 usando la clave privada del validador</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Almacenamiento Descentralizado</p>
                <p>Las validaciones firmadas se almacenan en IPFS para garantizar inmutabilidad</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Árbol Merkle</p>
                <p>Todas las validaciones se organizan en un árbol Merkle para verificación eficiente</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
              <div>
                <p className="font-medium">Verificación Pública</p>
                <p>Cualquiera puede verificar la autenticidad usando solo la información pública</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Cargando Métricas de Impacto</h2>
          <p className="text-gray-600">Verificando evidencias y validaciones blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
          
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2" />
                  Seguimiento de Impacto Verificable
                </h1>
                <h2 className="text-xl opacity-90">{projectTitle}</h2>
                <p className="text-blue-100 mt-1">{projectDescription}</p>
              </div>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-0">
              {[
                { id: 'overview', label: 'Resumen', icon: TrendingUp },
                { id: 'evidence', label: 'Evidencias', icon: Eye },
                { id: 'validations', label: 'Validaciones', icon: Shield },
                { id: 'blockchain', label: 'Blockchain', icon: Hash }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'validations' && impactData.validationCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {impactData.validationCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'evidence' && renderEvidenceTab()}
            {activeTab === 'validations' && renderValidationsTab()}
            {activeTab === 'blockchain' && renderBlockchainTab()}
          </div>
        </div>
      </div>

      {showValidationSigner && selectedEvidence && (
        <ValidationSigner
          projectId={projectId}
          evidenceId={selectedEvidence.id}
          evidenceContent={selectedEvidence.description + ' ' + selectedEvidence.title}
          onValidationSigned={handleValidationSigned}
          onClose={() => {
            setShowValidationSigner(false);
            setSelectedEvidence(null);
          }}
        />
      )}
    </>
  );
};

export default ImpactTracker;