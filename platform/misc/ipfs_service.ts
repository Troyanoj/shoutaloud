// platform/frontend-mobile/web/src/services/ipfs.ts

export interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
  size?: number;
}

export interface IPFSMetadata {
  name: string;
  description: string;
  type: 'proposal' | 'document' | 'result' | 'evidence';
  municipalityId: number;
  uploadedAt: number;
  hash: string;
}

class IPFSService {
  private readonly PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY || '';
  private readonly PINATA_SECRET = process.env.REACT_APP_PINATA_SECRET || '';
  private readonly IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
  private readonly FALLBACK_GATEWAY = 'https://ipfs.io/ipfs/';

  constructor() {
    if (!this.PINATA_API_KEY || !this.PINATA_SECRET) {
      console.warn('⚠️ IPFS: Variables de entorno de Pinata no configuradas');
      console.log('💡 Usando modo simulación local');
    }
  }

  /**
   * Sube un archivo a IPFS usando Pinata
   */
  async uploadFile(file: File, metadata?: Partial<IPFSMetadata>): Promise<IPFSUploadResult> {
    try {
      // Si no hay claves de API, simular subida
      if (!this.PINATA_API_KEY || !this.PINATA_SECRET) {
        return this.simulateUpload(file, metadata);
      }

      const formData = new FormData();
      formData.append('file', file);

      // Metadatos para Pinata
      const pinataMetadata = {
        name: metadata?.name || file.name,
        keyvalues: {
          type: metadata?.type || 'document',
          municipalityId: metadata?.municipalityId?.toString() || '0',
          uploadedAt: Date.now().toString(),
          originalName: file.name,
          size: file.size.toString()
        }
      };

      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.PINATA_API_KEY,
          'pinata_secret_api_key': this.PINATA_SECRET,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error de Pinata: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('📎 Archivo subido a IPFS:', {
        hash: result.IpfsHash,
        size: result.PinSize,
        timestamp: result.Timestamp
      });

      return {
        success: true,
        hash: result.IpfsHash,
        url: `${this.IPFS_GATEWAY}${result.IpfsHash}`,
        size: result.PinSize
      };

    } catch (error: any) {
      console.error('❌ Error subiendo a IPFS:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido subiendo a IPFS'
      };
    }
  }

  /**
   * Sube JSON/texto a IPFS
   */
  async uploadJSON(data: any, filename: string, metadata?: Partial<IPFSMetadata>): Promise<IPFSUploadResult> {
    try {
      if (!this.PINATA_API_KEY || !this.PINATA_SECRET) {
        return this.simulateJSONUpload(data, filename, metadata);
      }

      const pinataMetadata = {
        name: filename,
        keyvalues: {
          type: metadata?.type || 'data',
          municipalityId: metadata?.municipalityId?.toString() || '0',
          uploadedAt: Date.now().toString(),
          dataType: 'json'
        }
      };

      const body = {
        pinataContent: data,
        pinataMetadata
      };

      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.PINATA_API_KEY,
          'pinata_secret_api_key': this.PINATA_SECRET,
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Error de Pinata JSON: ${response.status}`);
      }

      const result = await response.json();

      console.log('📋 JSON subido a IPFS:', {
        hash: result.IpfsHash,
        size: result.PinSize
      });

      return {
        success: true,
        hash: result.IpfsHash,
        url: `${this.IPFS_GATEWAY}${result.IpfsHash}`,
        size: result.PinSize
      };

    } catch (error: any) {
      console.error('❌ Error subiendo JSON a IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Recupera contenido de IPFS
   */
  async fetchFromIPFS(hash: string, useGateway: 'pinata' | 'ipfs' | 'auto' = 'auto'): Promise<any> {
    const gateways = {
      pinata: this.IPFS_GATEWAY,
      ipfs: this.FALLBACK_GATEWAY,
      auto: [this.IPFS_GATEWAY, this.FALLBACK_GATEWAY]
    };

    const urlsToTry = useGateway === 'auto' 
      ? (gateways.auto as string[]).map(gateway => `${gateway}${hash}`)
      : [`${gateways[useGateway]}${hash}`];

    for (const url of urlsToTry) {
      try {
        console.log(`🔍 Intentando recuperar de: ${url}`);
        
        const response = await fetch(url, {
          timeout: 10000 // 10 segundos
        } as RequestInit);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            console.log('✅ JSON recuperado de IPFS');
            return data;
          } else {
            const text = await response.text();
            console.log('✅ Contenido recuperado de IPFS');
            return text;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Fallo en gateway ${url}:`, error);
        continue;
      }
    }

    throw new Error(`No se pudo recuperar contenido de IPFS con hash: ${hash}`);
  }

  /**
   * Genera URL pública para un hash
   */
  getPublicUrl(hash: string, gateway: 'pinata' | 'ipfs' = 'pinata'): string {
    const baseUrl = gateway === 'pinata' ? this.IPFS_GATEWAY : this.FALLBACK_GATEWAY;
    return `${baseUrl}${hash}`;
  }

  /**
   * Verifica si un hash es válido
   */
  isValidHash(hash: string): boolean {
    // IPFS hash típicamente empieza con Qm y tiene 46 caracteres
    // o empieza con bafy (CIDv1) y tiene 59 caracteres
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || 
           /^bafy[a-z2-7]{52}$/.test(hash);
  }

  /**
   * Simulación local para desarrollo sin Pinata
   */
  private async simulateUpload(file: File, metadata?: Partial<IPFSMetadata>): Promise<IPFSUploadResult> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generar hash simulado basado en contenido del archivo
    const simulatedHash = await this.generateSimulatedHash(file);

    console.log('🔨 Simulando subida IPFS:', {
      file: file.name,
      size: file.size,
      hash: simulatedHash
    });

    return {
      success: true,
      hash: simulatedHash,
      url: `${this.FALLBACK_GATEWAY}${simulatedHash}`,
      size: file.size
    };
  }

  private async simulateJSONUpload(data: any, filename: string, metadata?: Partial<IPFSMetadata>): Promise<IPFSUploadResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const jsonString = JSON.stringify(data);
    const simulatedHash = `Qm${btoa(jsonString + Date.now()).slice(0, 44)}`;

    console.log('🔨 Simulando subida JSON a IPFS:', {
      filename,
      hash: simulatedHash,
      size: jsonString.length
    });

    return {
      success: true,
      hash: simulatedHash,
      url: `${this.FALLBACK_GATEWAY}${simulatedHash}`,
      size: jsonString.length
    };
  }

  private async generateSimulatedHash(file: File): Promise<string> {
    // Generar hash basado en nombre + tamaño + timestamp
    const content = `${file.name}-${file.size}-${Date.now()}`;
    const encoded = btoa(content).replace(/[^A-Za-z0-9]/g, '').slice(0, 44);
    return `Qm${encoded.padEnd(44, 'A')}`;
  }

  /**
   * Lista archivos subidos (solo con Pinata)
   */
  async listUploads(limit: number = 10): Promise<any[]> {
    try {
      if (!this.PINATA_API_KEY || !this.PINATA_SECRET) {
        console.log('📋 Listado simulado - modo desarrollo');
        return [];
      }

      const response = await fetch(`https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=${limit}`, {
        headers: {
          'pinata_api_key': this.PINATA_API_KEY,
          'pinata_secret_api_key': this.PINATA_SECRET,
        }
      });

      if (!response.ok) {
        throw new Error('Error listando archivos de Pinata');
      }

      const result = await response.json();
      return result.rows || [];

    } catch (error) {
      console.error('Error listando uploads de IPFS:', error);
      return [];
    }
  }

  getConnectionStatus() {
    return {
      configured: !!(this.PINATA_API_KEY && this.PINATA_SECRET),
      apiKey: this.PINATA_API_KEY ? `${this.PINATA_API_KEY.slice(0, 8)}...` : 'No configurada',
      gateway: this.IPFS_GATEWAY,
      fallbackGateway: this.FALLBACK_GATEWAY
    };
  }
}

// Singleton instance
export const ipfsService = new IPFSService();