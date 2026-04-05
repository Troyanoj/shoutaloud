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
  FormErrorMessage,
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

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name) newErrors.name = 'El nombre es obligatorio';
    if (!formData.email) newErrors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      toast({ title: '¡Cuenta creada!', status: 'success', duration: 3000 });
      navigate('/proposals');
    } catch (error) {
      toast({ title: 'Error al registrarse', description: 'Intenta de nuevo', status: 'error', duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
              Crea tu cuenta y empieza a participar
            </Text>
          </Stack>

          <Box rounded="2xl" bg={useColorModeValue('gray.50', 'gray.800')} p={8} border="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
            <Stack spacing={6}>
              <WorldIDButton onSuccess={handleWorldIDSuccess} mode="register" />

              <Flex align="center" gap={4}>
                <Divider flex={1} />
                <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">o con email</Text>
                <Divider flex={1} />
              </Flex>

              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  <FormControl isRequired isInvalid={!!errors.name}>
                    <FormLabel fontSize="sm" fontWeight="medium">Nombre</FormLabel>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      bg={useColorModeValue('white', 'gray.700')}
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                    />
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.email}>
                    <FormLabel fontSize="sm" fontWeight="medium">Email</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      bg={useColorModeValue('white', 'gray.700')}
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.password}>
                    <FormLabel fontSize="sm" fontWeight="medium">Contraseña</FormLabel>
                    <InputGroup>
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                    <FormLabel fontSize="sm" fontWeight="medium">Confirmar contraseña</FormLabel>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      bg={useColorModeValue('white', 'gray.700')}
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                    />
                    <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    bgGradient="linear(to-r, blue.600, cyan.500)"
                    color="white"
                    isLoading={isLoading}
                    _hover={{ opacity: 0.9 }}
                    size="lg"
                  >
                    Crear cuenta
                  </Button>

                  <Text align="center" fontSize="sm" color="gray.500">
                    ¿Ya tienes cuenta?{' '}
                    <RouterLink to="/login">
                      <Text as="span" color="blue.500" fontWeight="medium">Inicia sesión</Text>
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
        bgGradient="linear(to-br, cyan.500, blue.600)"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" inset={0} bg="rgba(0,0,0,0.1)" />
        <Stack spacing={8} textAlign="center" position="relative" zIndex={1} px={12}>
          <Image src="/icono-shoutaloud.png" alt="ShoutAloud" w="200px" h="200px" objectFit="contain" />
          <Stack spacing={4}>
            <Heading size="xl" color="white">Únete a la comunidad</Heading>
            <Text fontSize="lg" color="rgba(255,255,255,0.8)" maxW="sm">
              Regístrate con World ID para una verificación instantánea y sin KYC.
            </Text>
          </Stack>
        </Stack>
      </Flex>
    </Flex>
  );
}
