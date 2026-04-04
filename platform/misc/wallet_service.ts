// platform/frontend-mobile/web/src/services/wallet.ts
import { ethers } from 'ethers';

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
  network: string | null;
  chainId: number | null;
}

export interface SignedMessage {
  message: string;
  signature: string;
  address: string;
  timestamp: number;
}

class WalletService {
  private currentState: WalletState = {
    connected: false,
    address: null,
    balance: null,
    network: null,
    chainId: null
  };

  private listeners: ((state: WalletState) => void)[] = [];
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.setupEventListeners();
    this.checkExistingConnection();
  }

  /**
   * Conectar con MetaMask
   */
  async connect(): Promise<boolean> {
    try {
      if (!this.isMetaMaskInstalled()) {
        throw new Error('MetaMask no está instalado. Por favor instálalo desde metamask.io');
      }

      console.log('🔐 Conectando con MetaMask...');

      // Solicitar acceso a cuentas
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No se seleccionó ninguna cuenta');
      }

      // Configurar provider y signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum!);
      this.signer = this.provider.getSigner();

      // Actualizar estado
      await this.updateWalletState();

      console.log('✅ Wallet conectada:', this.currentState.address);
      return true;

    } catch (error: any) {
      console.error('❌ Error conectando wallet:', error);
      this.currentState = {
        connected: false,
        address: null,
        balance: null,
        network: null,
        chainId: null
      };
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Desconectar wallet
   */
  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.currentState = {
      connected: false,
      address: null,
      balance: null,
      network: null,
      chainId: null
    };
    this.notifyListeners();
    console.log('🔓 Wallet desconectada');
  }

  /**
   * Firmar mensaje para autenticación DID
   */
  async signMessage(message: string): Promise<SignedMessage> {
    try {
      if (!this.signer) {
        throw new Error('Wallet no conectada');
      }

      console.log('✍️ Firmando mensaje:', message);

      const signature = await this.signer.signMessage(message);
      const address = await this.signer.getAddress();

      const signedMessage: SignedMessage = {
        message,
        signature,
        address,
        timestamp: Date.now()
      };

      console.log('✅ Mensaje firmado correctamente');
      return signedMessage;

    } catch (error: any) {
      console.error('❌ Error firmando mensaje:', error);
      throw new Error(`Error firmando mensaje: ${error.message}`);
    }
  }

  /**
   * Firmar datos estructurados (EIP-712) para votos
   */
  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet no conectada');
      }

      console.log('✍️ Firmando datos estructurados...');

      // Usar _signTypedData para EIP-712
      const signature = await this.signer._signTypedData(domain, types, value);

      console.log('✅ Datos estructurados firmados correctamente');
      return signature;

    } catch (error: any) {
      console.error('❌ Error firmando datos estructurados:', error);
      throw new Error(`Error firmando datos: ${error.message}`);
    }
  }

  /**
   * Generar DID a partir de dirección de wallet
   */
  generateDID(address?: string): string {
    const walletAddress = address || this.currentState.address;
    if (!walletAddress) {
      throw new Error('No hay dirección de wallet disponible');
    }

    // Formato DID simple basado en Ethereum
    return `did:eth:${walletAddress.toLowerCase()}`;
  }

  /**
   * Verificar firma de mensaje
   */
  async verifySignature(message: string, signature: string, expectedAddress: string): Promise<boolean> {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('Error verificando firma:', error);
      return false;
    }
  }

  /**
   * Cambiar a red específica
   */
  async switchNetwork(chainId: number, networkConfig?: {
    chainName: string;
    rpcUrls: string[];
    nativeCurrency?: {
      name: string;
      symbol: string;
      decimals: number;
    };
  }): Promise<boolean> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask no disponible');
      }

      const hexChainId = `0x${chainId.toString(16)}`;

      try {
        // Intentar cambiar a la red
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });

        console.log(`✅ Cambiado a red ${chainId}`);
        return true;

      } catch (switchError: any) {
        // Si la red no existe (error 4902), agregarla
        if (switchError.code === 4902 && networkConfig) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName: networkConfig.chainName,
              rpcUrls: networkConfig.rpcUrls,
              nativeCurrency: networkConfig.nativeCurrency || {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
              }
            }],
          });

          console.log(`✅ Red ${networkConfig.chainName} agregada y activada`);
          return true;
        }

        throw switchError;
      }

    } catch (error: any) {
      console.error('❌ Error cambiando red:', error);
      throw new Error(`Error cambiando red: ${error.message}`);
    }
  }

  /**
   * Obtener balance actual
   */
  async getBalance(): Promise<string> {
    try {
      if (!this.provider || !this.currentState.address) {
        return '0';
      }

      const balance = await this.provider.getBalance(this.currentState.address);
      return ethers.utils.formatEther(balance);

    } catch (error) {
      console.error('Error obteniendo balance:', error);
      return '0';
    }
  }

  /**
   * Estado actual de la wallet
   */
  getState(): WalletState {
    return { ...this.currentState };
  }

  /**
   * Suscribirse a cambios de estado
   */
  onStateChange(callback: (state: WalletState) => void): () => void {
    this.listeners.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  