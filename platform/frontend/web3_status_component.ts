// platform/frontend-mobile/web/src/components/ui/Web3Status.tsx
import React, { useState, useEffect } from 'react';
import { Wallet, Wifi, WifiOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { walletService, WalletState } from '../../services/wallet';
import { blockchainService } from '../../services/blockchain';

interface Web3StatusProps {
  className?: string;
  showDetails?: boolean;
  onConnect?: () => void;
}

export const Web3Status: React.FC<Web3StatusProps> = ({ 
  className = '',
  showDetails = false,
  onConnect
}) => {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState());
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    // Suscribirse a cambios de wallet
    const unsubscribe = walletService.onStateChange(setWalletState);

    // Verificar estado de blockchain
    updateBlockchainStatus();

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (walletState.connected) {
      updateNetworkInfo();
    }
  }, [walletState.connected]);

  const updateBlockchainStatus = async () => {
    const status = await blockchainService.getBlockchainStatus();
    setBlockchainStatus(status);
  };

  const updateNetworkInfo = async () => {
    const info = await walletService.getNetworkInfo();
    setNetworkInfo(info);
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await walletService.connect();
      await blockchainService.connectWallet();
      onConnect?.();
    } catch (error: any) {
      console.error('Error conectando:', error);
      alert(`Error conectando wallet: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await walletService.disconnect();
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = () => {
    if (!walletState.connected) return 'text-red-500';
    if (walletState.chainId === 31337) return 'text-green-500'; // Hardhat local
    return 'text-yellow-500'; // Otra red
  };

  const getStatusIcon = () => {
    if (!walletState.connected) return <WifiOff className="w-4 h-4" />;
    if (blockchainStatus?.connected) return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  if (!showDetails) {
    // Vista compacta
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {walletState.connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        {!walletState.connected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isConnecting ? 'Conectando...' : 'Conectar'}
          </button>
        ) : (
          <span className="text-xs text-gray-600">
            {formatAddress(walletState.address || '')}
          </span>
        )}
      </div>
    );
  }

  // Vista detallada
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Estado Web3</span>
        </h3>
        
        <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {walletState.connected ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Estado de Wallet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Wallet:</span>
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4" />
            {walletState.connected ? (
              <div className="text-right">
                <div className="text-sm font-mono">
                  {formatAddress(walletState.address || '')}
                </div>
                <div className="text-xs text-gray-500">
                  {walletState.balance} ETH
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500">No conectada</span>
            )}
          </div>
        </div>

        {/* Estado de Red */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Red:</span>
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4" />
            <div className="text-right">
              <div className="text-sm">
                {walletState.network || 'No conectada'}
              </div>
              {walletState.chainId && (
                <div className="text-xs text-gray-500">
                  Chain ID: {walletState.chainId}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estado de Blockchain */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Blockchain:</span>
          <div className="text-right">
            {blockchainStatus?.connected ? (
              <div>
                <div className="text-sm text-green-600">Conectado</div>
                <div className="text-xs text-gray-500">
                  Bloque: {blockchainStatus.blockNumber}
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-600">Desconectado</div>
            )}
          </div>
        </div>

        {/* Gas Price (si está disponible) */}
        {networkInfo?.gasPrice && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Gas:</span>
            <div className="text-sm text-gray-700">
              {parseFloat(networkInfo.gasPrice).toFixed(1)} gwei
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="mt-4 flex space-x-2">
        {!walletState.connected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Wallet className="w-4 h-4" />
            <span>{isConnecting ? 'Conectando...' : 'Conectar Wallet'}</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => updateNetworkInfo()}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Actualizar
            </button>
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
            >
              Desconectar
            </button>
          </>
        )}
      </div>

      {/* Información adicional para desarrollo */}
      {process.env.NODE_ENV === 'development' && walletState.connected && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">🔧 Info de desarrollo:</div>
          <div className="space-y-1 text-xs font-mono text-gray-700">
            <div>DID: {walletService.generateDID(walletState.address || '')}</div>
            {blockchainStatus?.contractAddress && (
              <div>Contrato: {formatAddress(blockchainStatus.contractAddress)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};