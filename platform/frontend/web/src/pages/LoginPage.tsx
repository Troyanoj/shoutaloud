import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
  Image,
  Flex,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import WorldIDButton from '../components/WorldIDButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({ title: '¡Bienvenido de vuelta!', status: 'success', duration: 3000 });
      navigate('/proposals');
    } catch (error) {
      toast({
        title: 'Error de inicio de sesión',
        description: 'Verifica tus credenciales e intenta de nuevo',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorldIDSuccess = () => {
    navigate('/proposals');
  };

  return (
    <Flex minH="calc(100vh - 80px)">
      {/* Left - Form */}
      <Flex flex={1} alignItems="center" justifyContent="center" bg={useColorModeValue('white', 'gray.900')} py={12} px={8}>
        <Stack spacing={8} mx="auto" maxW="md" w="full">
          <Stack align="center" spacing={2}>
            <Image src="/logo-shoutaloud.png" alt="ShoutAloud" h="44px" objectFit="contain" />
            <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.400')}>
              Inicia sesión para continuar
            </Text>
          </Stack>

          <Box rounded="2xl" bg={useColorModeValue('gray.50', 'gray.800')} p={8} border="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
            <Stack spacing={6}>
              <WorldIDButton onSuccess={handleWorldIDSuccess} mode="login" />

              <Flex align="center" gap={4}>
                <Divider flex={1} />
                <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">o con email</Text>
                <Divider flex={1} />
              </Flex>

              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  <FormControl id="email" isRequired>
                    <FormLabel fontSize="sm" fontWeight="medium">Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      bg={useColorModeValue('white', 'gray.700')}
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                    />
                  </FormControl>

                  <FormControl id="password" isRequired>
                    <FormLabel fontSize="sm" fontWeight="medium">Contraseña</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg={useColorModeValue('white', 'gray.700')}
                        borderColor={useColorModeValue('gray.200', 'gray.600')}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                      />
                      <InputRightElement>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label="Toggle password"
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    bgGradient="linear(to-r, blue.600, cyan.500)"
                    color="white"
                    isLoading={isLoading}
                    _hover={{ opacity: 0.9 }}
                    size="lg"
                  >
                    Iniciar sesión
                  </Button>

                  <Text align="center" fontSize="sm" color="gray.500">
                    ¿No tienes cuenta?{' '}
                    <RouterLink to="/register">
                      <Text as="span" color="blue.500" fontWeight="medium">Regístrate aquí</Text>
                    </RouterLink>
                  </Text>
                </Stack>
              </form>
            </Stack>
          </Box>
        </Stack>
      </Flex>

      {/* Right - Decorative */}
      <Flex
        flex={1}
        display={{ base: 'none', lg: 'flex' }}
        alignItems="center"
        justifyContent="center"
        bgGradient="linear(to-br, blue.600, cyan.500)"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" inset={0} bg="rgba(0,0,0,0.1)" />
        <Stack spacing={8} textAlign="center" position="relative" zIndex={1} px={12}>
          <Image src="/icono-shoutaloud.png" alt="ShoutAloud" w="200px" h="200px" objectFit="contain" />
          <Stack spacing={4}>
            <Heading size="xl" color="white">Tu voz importa</Heading>
            <Text fontSize="lg" color="rgba(255,255,255,0.8)" maxW="sm">
              Participa en la democracia digital de forma segura, privada y transparente.
            </Text>
          </Stack>
        </Stack>
      </Flex>
    </Flex>
  );
}
