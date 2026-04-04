// platform/frontend-mobile/web/src/services/crypto.ts
import { ethers } from 'ethers';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag?: string;
  algorithm: string;
}

export interface VoteEncryption {
  encryptedVote: EncryptedData;
  voteHash: string;
  publicKey: string;
  timestamp: number;
}

export interface DigitalSignature {
  data: string;
  signature: string;
  publicKey: string;
  algorithm: string;
  timestamp: number;
}

class CryptoService {
  private readonly AES_ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12;
  private readonly SALT_LENGTH = 16;

  constructor() {
    this.checkBrowserSupport();
  }

  private checkBrowserSupport(): void {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('WebCrypto API no está disponible en este navegador');
    }
  }

  /**
   * Generar hash SHA-256 de datos
   */
  async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generar salt aleatorio
   */
  private generateSalt(length: number = this.SALT_LENGTH): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Generar IV aleatorio
   */
  private generateIV(length: number = this.IV_LENGTH): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Derivar clave de una contraseña usando PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Importar contraseña como material de clave
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derivar clave AES
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.AES_ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encriptar datos usando AES-GCM
   */
  async encryptData(plaintext: string, password?: string): Promise<EncryptedData> {
    try {
      const encoder = new TextEncoder();
      const plaintextBuffer = encoder.encode(plaintext);

      // Generar salt y IV
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // Usar contraseña proporcionada o generar una temporal
      const encryptionPassword = password || this.generateRandomPassword();
      
      // Derivar clave de encriptación
      const key = await this.deriveKey(encryptionPassword, salt);

      // Encriptar datos
      const cipherBuffer = await window.crypto.subtle.encrypt(
        {
          name: this.AES_ALGORITHM,
          iv: iv
        },
        key,
        plaintextBuffer
      );

      // Convertir a base64 para almacenamiento
      const ciphertext = this.arrayBufferToBase64(cipherBuffer);
      const ivBase64 = this.arrayBufferToBase64(iv);
      const saltBase64 = this.arrayBufferToBase64(salt);

      console.log('🔐 Datos encriptados exitosamente');

      return {
        ciphertext,
        iv: ivBase64,
        salt: saltBase64,
        algorithm: this.AES_ALGORITHM
      };

    } catch (error) {
      console.error('❌ Error encriptando datos:', error);
      throw new Error(`Error de encriptación: ${error}`);
    }
  }

  /**
   * Desencriptar datos usando AES-GCM
   */
  async decryptData(encryptedData: EncryptedData, password: string): Promise<string> {
    try {
      // Convertir de base64 a ArrayBuffer
      const cipherBuffer = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const salt = this.base64ToArrayBuffer(encryptedData.salt);

      // Derivar clave de desencriptación
      const key = await this.deriveKey(password, new Uint8Array(salt));

      // Desencriptar datos
      const plaintextBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.AES_ALGORITHM,
          iv: iv
        },
        key,
        cipherBuffer
      );

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(plaintextBuffer);

      console.log('🔓 Datos desencriptados exitosamente');
      return plaintext;

    } catch (error) {
      console.error('❌ Error desencriptando datos:', error);
      throw new Error('Error de desencriptación - contraseña incorrecta o datos corruptos');
    }
  }

  /**
   * Encriptar voto para anonimato
   */
  async encryptVote(voteData: {
    municipalityId: number;
    officialId: number;
    rating: number;
    voterDID: string;
  }): Promise<VoteEncryption> {
    try {
      // Crear representación JSON del voto
      const voteJson = JSON.stringify({
        ...voteData,
        timestamp: Date.now(),
        nonce: this.generateRandomPassword(16)
      });

      // Generar hash del voto para verificación
      const voteHash = await this.generateHash(voteJson);

      // Encriptar voto
      const encryptedVote = await this.encryptData(voteJson);

      // Simular clave pública (en implementación real vendría del wallet)
      const publicKey = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      console.log('🗳️ Voto encriptado para anonimato');

      return {
        encryptedVote,
        voteHash,
        publicKey,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error encriptando voto:', error);
      throw new Error(`Error encriptando voto: ${error}`);
    }
  }

  /**
   * Firmar datos usando ethers.js (compatible con MetaMask)
   */
  async signData(data: string, signer?: ethers.Signer): Promise<DigitalSignature> {
    try {
      if (!signer) {
        throw new Error('Signer requerido para firmar datos');
      }

      // Crear mensaje estructurado
      const message = `Shout Aloud - Firma Digital
Datos: ${data}
Timestamp: ${Date.now()}
Dominio: democracy.shout-aloud.org`;

      // Firmar mensaje
      const signature = await signer.signMessage(message);
      const address = await signer.getAddress();

      console.log('✍️ Datos firmados digitalmente');

      return {
        data: message,
        signature,
        publicKey: address,
        algorithm: 'ECDSA_secp256k1',
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error firmando datos:', error);
      throw new Error(`Error de firma digital: ${error}`);
    }
  }

  /**
   * Verificar firma digital
   */
  async verifySignature(signedData: DigitalSignature): Promise<boolean> {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(signedData.data, signedData.signature);
      const isValid = recoveredAddress.toLowerCase() === signedData.publicKey.toLowerCase();

      console.log(`🔍 Firma ${isValid ? 'válida' : 'inválida'}`);
      return isValid;

    } catch (error) {
      console.error('❌ Error verificando firma:', error);
      return false;
    }
  }

  /**
   * Crear prueba de integridad para datos críticos
   */
  async createIntegrityProof(data: any): Promise<{
    dataHash: string;
    merkleRoot: string;
    timestamp: number;
    proof: string[];
  }> {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const dataHash = await this.generateHash(dataString);

      // Simular árbol de Merkle simple (en implementación real sería más completo)
      const timestampHash = await this.generateHash(Date.now().toString());
      const merkleRoot = await this.generateHash(dataHash + timestampHash);

      // Prueba de Merkle simplificada
      const proof = [dataHash, timestampHash];

      console.log('🛡️ Prueba de integridad creada');

      return {
        dataHash,
        merkleRoot,
        timestamp: Date.now(),
        proof
      };

    } catch (error) {
      console.error('❌ Error creando prueba de integridad:', error);
      throw new Error(`Error de integridad: ${error}`);
    }
  }

  /**
   * Verificar prueba de integridad
   */
  async verifyIntegrityProof(data: any, proof: {
    dataHash: string;
    merkleRoot: string;
    timestamp: number;
    proof: string[];
  }): Promise<boolean> {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const calculatedHash = await this.generateHash(dataString);

      // Verificar hash de datos
      if (calculatedHash !== proof.dataHash) {
        console.log('❌ Hash de datos no coincide');
        return false;
      }

      // Verificar merkle root
      const timestampHash = await this.generateHash(proof.timestamp.toString());
      const calculatedMerkleRoot = await this.generateHash(proof.dataHash + timestampHash);

      const isValid = calculatedMerkleRoot === proof.merkleRoot;
      console.log(`🔍 Integridad ${isValid ? 'verificada' : 'comprometida'}`);

      return isValid;

    } catch (error) {
      console.error('❌ Error verificando integridad:', error);
      return false;
    }
  }

  /**
   * Generar contraseña aleatoria
   */
  private generateRandomPassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomValues = window.crypto.getRandomValues(new Uint8Array(length));
    
    return Array.from(randomValues)
      .map(value => charset[value % charset.length])
      .join('');
  }

  /**
   * Convertir ArrayBuffer a Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * Convertir Base64 a ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  /**
   * Obtener información de capacidades criptográficas del navegador
   */
  getBrowserCryptoCapabilities(): {
    webCrypto: boolean;
    algorithms: string[];
    keyFormats: string[];
    features: string[];
  } {
    const capabilities = {
      webCrypto: !!window.crypto?.subtle,
      algorithms: [] as string[],
      keyFormats: [] as string[],
      features: [] as string[]
    };

    if (capabilities.webCrypto) {
      capabilities.algorithms = [
        'AES-GCM', 'AES-CBC', 'RSA-OAEP', 'RSA-PSS', 
        'ECDSA', 'ECDH', 'PBKDF2', 'SHA-256', 'SHA-512'
      ];
      
      capabilities.keyFormats = ['raw', 'pkcs8', 'spki', 'jwk'];
      
      capabilities.features = [
        'encrypt/decrypt', 'sign/verify', 'key derivation',
        'secure random', 'hash functions'
      ];
    }

    return capabilities;
  }

  /**
   * Limpiar datos sensibles de memoria (best effort)
   */
  secureCleanup(sensitiveData: any): void {
    try {
      if (typeof sensitiveData === 'string') {
        // Sobrescribir string (limitado en JS)
        sensitiveData = '0'.repeat(sensitiveData.length);
      } else if (sensitiveData instanceof ArrayBuffer) {
        // Sobrescribir buffer
        const view = new Uint8Array(sensitiveData);
        window.crypto.getRandomValues(view);
      }
      
      // Forzar garbage collection si está disponible
      if (window.gc) {
        window.gc();
      }
      
    } catch (error) {
      console.warn('⚠️ No se pudo limpiar datos sensibles completamente');
    }
  }
}

// Singleton instance
export const cryptoService = new CryptoService();

// Funciones de utilidad
export const hashData = (data: string) => cryptoService.generateHash(data);
export const encryptVote = (voteData: any) => cryptoService.encryptVote(voteData);
export const createDigitalSignature = (data: string, signer?: ethers.Signer) => 
  cryptoService.signData(data, signer);

// Tipos globales
declare global {
  interface Window {
    gc?: () => void;
  }
}