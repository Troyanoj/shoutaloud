/**
 * Browser-compatible DID Manager for ShoutAloud
 * Uses WebCrypto API for Ed25519 keypair generation
 * All operations happen client-side - no server storage of keys
 */

export interface DIDDocument {
  id: string;
  verificationMethod: {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
  }[];
  authentication: string[];
  created: string;
  updated: string;
}

export interface Keypair {
  publicKey: string;
  privateKey: CryptoKey;
  publicKeyMultibase: string;
}

export class DIDManager {
  private readonly DID_PREFIX = 'did:shoutaloud';
  private keypair: Keypair | null = null;

  /**
   * Generate Ed25519 keypair using WebCrypto
   */
  async generateKeypair(): Promise<Keypair> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519',
      },
      true,
      ['sign', 'verify']
    );

    const publicKey = await window.crypto.subtle.exportKey(
      'raw',
      keyPair.publicKey
    );

    const publicKeyMultibase = this.toMultibaseBase58(
      new Uint8Array(publicKey)
    );

    this.keypair = {
      publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
      privateKey: keyPair.privateKey,
      publicKeyMultibase,
    };

    return this.keypair;
  }

  /**
   * Create W3C-compliant DID Document
   */
  async createDIDDocument(): Promise<DIDDocument> {
    if (!this.keypair) {
      await this.generateKeypair();
    }

    const did = `${this.DID_PREFIX}:${this.keypair!.publicKeyMultibase.slice(0, 32)}`;
    const now = new Date().toISOString();

    return {
      id: did,
      verificationMethod: [
        {
          id: `${did}#keys-1`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: this.keypair!.publicKeyMultibase,
        },
      ],
      authentication: [`${did}#keys-1`],
      created: now,
      updated: now,
    };
  }

  /**
   * Sign data with private key
   */
  async signData(data: string): Promise<string> {
    if (!this.keypair) {
      throw new Error('Keypair not generated');
    }

    const encoder = new TextEncoder();
    const signature = await window.crypto.subtle.sign(
      'Ed25519',
      this.keypair.privateKey,
      encoder.encode(data)
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  /**
   * Verify signature against public key
   */
  async verifySignature(
    data: string,
    signature: string,
    publicKeyMultibase: string
  ): Promise<boolean> {
    try {
      const publicKeyBytes = this.fromMultibaseBase58(publicKeyMultibase);

      const publicKey = await window.crypto.subtle.importKey(
        'raw',
        publicKeyBytes,
        { name: 'Ed25519', namedCurve: 'Ed25519' },
        true,
        ['verify']
      );

      const encoder = new TextEncoder();
      const signatureBytes = Uint8Array.from(atob(signature), (c) =>
        c.charCodeAt(0)
      );

      return await window.crypto.subtle.verify(
        'Ed25519',
        publicKey,
        signatureBytes,
        encoder.encode(data)
      );
    } catch {
      return false;
    }
  }

  /**
   * Store DID in localStorage (encrypted)
   */
  async storeDID(didDoc: DIDDocument, password: string): Promise<void> {
    const encrypted = await this.encryptData(JSON.stringify(didDoc), password);
    localStorage.setItem('shoutaloud_did', encrypted);
  }

  /**
   * Retrieve DID from localStorage
   */
  async retrieveDID(password: string): Promise<DIDDocument | null> {
    const encrypted = localStorage.getItem('shoutaloud_did');
    if (!encrypted) return null;

    try {
      const decrypted = await this.decryptData(encrypted, password);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  /**
   * Encrypt data with password-derived key
   */
  private async encryptData(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...result));
  }

  /**
   * Decrypt data with password-derived key
   */
  private async decryptData(
    encryptedBase64: string,
    password: string
  ): Promise<string> {
    const data = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const ciphertext = data.slice(28);

    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Convert bytes to multibase base58btc string
   */
  private toMultibaseBase58(bytes: Uint8Array): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + Buffer.from(bytes).toString('hex'));
    let result = '';

    while (num > 0n) {
      const remainder = num % 58n;
      num = num / 58n;
      result = alphabet[Number(remainder)] + result;
    }

    // Add leading '1's for leading zero bytes
    for (const byte of bytes) {
      if (byte === 0) result = '1' + result;
      else break;
    }

    return 'z' + result; // 'z' prefix for base58btc
  }

  /**
   * Decode multibase base58btc string to bytes
   */
  private fromMultibaseBase58(str: string): Uint8Array {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const data = str.startsWith('z') ? str.slice(1) : str;

    let num = 0n;
    for (const char of data) {
      const index = alphabet.indexOf(char);
      if (index === -1) throw new Error('Invalid base58 character');
      num = num * 58n + BigInt(index);
    }

    let hex = num.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;

    // Add leading zeros for leading '1's
    const leadingOnes = data.match(/^1*/)?.[0].length || 0;
    const result = new Uint8Array(leadingOnes + hex.length / 2);
    let i = leadingOnes;
    for (let j = 0; j < hex.length; j += 2) {
      result[i++] = parseInt(hex.slice(j, j + 2), 16);
    }

    return result;
  }
}
