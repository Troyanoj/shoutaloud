import { Box, Button, Text, VStack, useToast, Badge } from '@chakra-ui/react';
import { IDKitWidget, ISuccessResult, VerificationLevel } from '@worldcoin/idkit';
import { useState } from 'react';
import api from '../services/api';

const WORLD_APP_ID = import.meta.env.VITE_WORLD_APP_ID || '';

interface WorldIDButtonProps {
  onSuccess: (data: { nullifier_hash: string }) => void;
  mode: 'login' | 'register';
}

export default function WorldIDButton({ onSuccess, mode }: WorldIDButtonProps) {
  const toast = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  const actionName = mode === 'register' ? 'shoutaloud-register' : 'shoutaloud-login';
  const signalValue = mode === 'register' ? 'new-user-registration' : 'user-login';

  const handleSuccess = async (proof: ISuccessResult) => {
    setIsVerifying(true);
    try {
      console.log('🌐 World ID proof received:', {
        nullifier_hash: proof.nullifier_hash,
        action: actionName,
      });
      console.log('🌐 Sending to:', `${api.defaults.baseURL}/api/auth/world-id`);

      const response = await api.post('/api/auth/world-id', {
        nullifier_hash: proof.nullifier_hash,
        merkle_root: proof.merkle_root,
        proof: proof.proof,
        verification_level: proof.verification_level,
        action: actionName,
      });

      console.log('🌐 Backend response:', response.data);

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onSuccess({ nullifier_hash: proof.nullifier_hash });
        toast({
          title: mode === 'register' ? '¡Cuenta creada!' : '¡Bienvenido de vuelta!',
          description: 'Verificado con World ID',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('🌐 World ID error:', error);
      console.error('🌐 Error response:', error.response?.data);
      console.error('🌐 Error status:', error.response?.status);
      const detail = error.response?.data?.detail || error.message || 'No se pudo verificar tu identidad';
      toast({
        title: 'Error de verificación',
        description: detail,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!WORLD_APP_ID) {
    return (
      <VStack spacing={2}>
        <Button
          colorScheme="gray"
          size="lg"
          width="full"
          isDisabled
        >
          🌐 World ID (no configurado)
        </Button>
        <Text fontSize="xs" color="gray.500" textAlign="center">
          Configura VITE_WORLD_APP_ID en las variables de entorno
        </Text>
      </VStack>
    );
  }

  return (
    <IDKitWidget
      app_id={WORLD_APP_ID}
      action={actionName}
      signal={signalValue}
      verification_level={VerificationLevel.Device}
      onSuccess={handleSuccess}
      handleVerify={() => setIsVerifying(true)}
    >
      {({ open }) => (
        <Button
          onClick={open}
          isLoading={isVerifying}
          loadingText="Verificando..."
          colorScheme="purple"
          size="lg"
          width="full"
          leftIcon={
            <Box as="span" fontSize="xl">
              🌐
            </Box>
          }
        >
          {mode === 'register' ? 'Registrarse con World ID' : 'Iniciar sesión con World ID'}
        </Button>
      )}
    </IDKitWidget>
  );
}
