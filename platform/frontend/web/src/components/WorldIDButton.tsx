import { Box, Button, Text, VStack, useToast, Badge } from '@chakra-ui/react';
import { IDKitWidget, ISuccessResult, VerificationLevel } from '@worldcoin/idkit';
import { useState } from 'react';
import api from '../services/api';

const WORLD_APP_ID = import.meta.env.VITE_WORLD_APP_ID || 'app_0xe446214402fd8f70e43adaaf0cde8244782933d8fc4a67b434e16bbcde665180';

interface WorldIDButtonProps {
  onSuccess: (data: { nullifier_hash: string }) => void;
  mode: 'login' | 'register';
}

export default function WorldIDButton({ onSuccess, mode }: WorldIDButtonProps) {
  const toast = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSuccess = async (proof: ISuccessResult) => {
    setIsVerifying(true);
    try {
      const response = await api.post('/api/auth/world-id', {
        nullifier_hash: proof.nullifier_hash,
        merkle_root: proof.merkle_root,
        proof: proof.proof,
        verification_level: proof.verification_level,
        action: mode === 'register' ? 'shoutaloud-register' : 'shoutaloud-login',
      });

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
      toast({
        title: 'Error de verificación',
        description: error.response?.data?.detail || 'No se pudo verificar tu identidad',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <IDKitWidget
      app_id={WORLD_APP_ID}
      action={mode === 'register' ? 'shoutaloud-register' : 'shoutaloud-login'}
      signal={mode === 'register' ? 'new-user' : 'returning-user'}
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
