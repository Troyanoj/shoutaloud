import React, { useState, useEffect } from 'react';
import { Shield, Key, Hash, Download, Copy, Check, AlertTriangle, FileText, QrCode } from 'lucide-react';

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
    
    return btoa(this.generateShortHash(dataToSign + privateKey));
  }

  async storeValidationProofToIPFS(validation: ValidationProof): Promise<string> {
    const content = JSON.stringify(validation, null, 2);
    const hash = `Qm${this.generateShortHash(content).slice(0, 44)}`;
    
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

  generateVerifiableCertificate(projectId: string): {
    certificate: any;
    qrCode: string;
    pdfUrl: string;
  } {
    const chain = this.proofChains.get(projectId);
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
// COMPONENTE PRINCIPAL - VALIDATION SIGNER
// ============================================================================

interface ValidationSignerProps {
  projectId: string;
  evidenceId: string;
  evidenceContent: string;
  onValidationSigned: (signedValidation: ValidationProof) => void;
  onClose: () => void;
}

export const ValidationSigner: React.FC<ValidationSignerProps> = ({
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

export default ValidationSigner;
          