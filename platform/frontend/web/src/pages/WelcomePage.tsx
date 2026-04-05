import { Box, Button, Container, Heading, Stack, Text, useColorModeValue, Image, SimpleGrid, Icon, Flex, Badge, Divider } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowForwardIcon, CheckCircleIcon, StarIcon } from '@chakra-ui/icons';

export default function WelcomePage() {
  const { isAuthenticated } = useAuth();
  const bgPrimary = useColorModeValue('#0f172a', '#0f172a');
  const bgSecondary = useColorModeValue('#f8fafc', '#1e293b');

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg={bgPrimary}
        minH="90vh"
        position="relative"
        overflow="hidden"
        display="flex"
        alignItems="center"
      >
        {/* Background decoration */}
        <Box
          position="absolute"
          top="-20%"
          right="-10%"
          w="600px"
          h="600px"
          bgGradient="radial(circle, rgba(59,130,246,0.15) 0%, transparent 70%)"
          rounded="full"
        />
        <Box
          position="absolute"
          bottom="-20%"
          left="-10%"
          w="500px"
          h="500px"
          bgGradient="radial(circle, rgba(6,182,212,0.1) 0%, transparent 70%)"
          rounded="full"
        />

        <Container maxW="container.xl" position="relative" zIndex={1}>
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            spacing={12}
            alignItems="center"
            py={20}
          >
            {/* Left Content */}
            <Stack spacing={8} flex={1}>
              <Badge
                colorScheme="cyan"
                fontSize="sm"
                px={3}
                py={1}
                rounded="full"
                alignSelf="flex-start"
                bg="rgba(6,182,212,0.1)"
                color="cyan.400"
                border="1px solid"
                borderColor="rgba(6,182,212,0.2)"
              >
                🌐 Plataforma Descentralizada
              </Badge>

              <Heading
                as="h1"
                size="2xl"
                color="white"
                lineHeight="1.1"
                fontWeight="800"
              >
                Tu voz tiene{' '}
                <Text
                  as="span"
                  bgGradient="linear(to-r, cyan.400, blue.500)"
                  bgClip="text"
                >
                  poder real
                </Text>
              </Heading>

              <Text fontSize="xl" color="gray.400" maxW="lg" lineHeight="1.7">
                ShoutAloud conecta ciudadanos con el poder de decidir. Crea propuestas, vota de forma segura y transparente, y transforma tu comunidad.
              </Text>

              <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
                {!isAuthenticated ? (
                  <>
                    <RouterLink to="/register">
                      <Button
                        size="lg"
                        bgGradient="linear(to-r, blue.600, cyan.500)"
                        color="white"
                        px={8}
                        rightIcon={<ArrowForwardIcon />}
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        shadow="md"
                      >
                        Comenzar ahora
                      </Button>
                    </RouterLink>
                    <RouterLink to="/login">
                      <Button
                        size="lg"
                        variant="outline"
                        borderColor="gray.600"
                        color="gray.300"
                        px={8}
                        _hover={{ bg: 'gray.800', borderColor: 'gray.500' }}
                      >
                        Iniciar sesión
                      </Button>
                    </RouterLink>
                  </>
                ) : (
                  <RouterLink to="/proposals">
                    <Button
                      size="lg"
                      bgGradient="linear(to-r, blue.600, cyan.500)"
                      color="white"
                      px={8}
                      rightIcon={<ArrowForwardIcon />}
                      _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                    >
                      Ver propuestas
                    </Button>
                  </RouterLink>
                )}
              </Stack>

              {/* Stats */}
              <Stack direction="row" spacing={8} pt={4}>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="white">100%</Text>
                  <Text fontSize="sm" color="gray.500">Transparente</Text>
                </Box>
                <Divider orientation="vertical" borderColor="gray.700" />
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="white">24/7</Text>
                  <Text fontSize="sm" color="gray.500">Disponible</Text>
                </Box>
                <Divider orientation="vertical" borderColor="gray.700" />
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="white">ZK</Text>
                  <Text fontSize="sm" color="gray.500">Privacidad</Text>
                </Box>
              </Stack>
            </Stack>

            {/* Right - Logo */}
            <Flex flex={1} justifyContent="center" alignItems="center">
              <Box position="relative">
                <Box
                  position="absolute"
                  inset="-40px"
                  bgGradient="radial(circle, rgba(59,130,246,0.2) 0%, transparent 70%)"
                  rounded="full"
                  filter="blur(40px)"
                />
                <Image
                  src="/icono-shoutaloud.png"
                  alt="ShoutAloud"
                  w={{ base: '280px', md: '380px' }}
                  h={{ base: '280px', md: '380px' }}
                  objectFit="contain"
                  position="relative"
                  zIndex={1}
                  fallback={
                    <Box
                      w={{ base: '280px', md: '380px' }}
                      h={{ base: '280px', md: '380px' }}
                      bgGradient="linear(to-br, blue.600, cyan.500)"
                      rounded="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Heading size="4xl" color="white">📢</Heading>
                    </Box>
                  }
                />
              </Box>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box bg={bgSecondary} py={24}>
        <Container maxW="container.xl">
          <Stack spacing={16}>
            <Stack spacing={4} textAlign="center" alignItems="center">
              <Heading size="lg" color={useColorModeValue('gray.900', 'white')}>
                ¿Por qué ShoutAloud?
              </Heading>
              <Text fontSize="lg" color="gray.500" maxW="2xl">
                Una plataforma diseñada para devolver el poder a los ciudadanos
              </Text>
            </Stack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <FeatureCard
                icon="🗳️"
                title="Votación Segura"
                description="Sistema de votación anónima con verificación criptográfica. Tu voto es secreto pero verificable."
                gradient="linear(to-br, blue.500, blue.700)"
              />
              <FeatureCard
                icon="📋"
                title="Propuestas Ciudadanas"
                description="Crea, debate y apoya propuestas que importan a tu comunidad. La democracia empieza con tu voz."
                gradient="linear(to-br, cyan.500, teal.600)"
              />
              <FeatureCard
                icon="🔒"
                title="Identidad Privada"
                description="Verificación con World ID: demuestra que eres humano sin revelar tu identidad personal."
                gradient="linear(to-br, purple.500, pink.600)"
              />
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bg={bgPrimary} py={20}>
        <Container maxW="container.md" textAlign="center">
          <Stack spacing={6} alignItems="center">
            <Image
              src="/logo-shoutaloud.png"
              alt="ShoutAloud"
              h="50px"
              objectFit="contain"
              fallback={<Heading size="lg" color="white">ShoutAloud</Heading>}
            />
            <Text fontSize="lg" color="gray.400">
              Únete a la revolución de la democracia digital
            </Text>
            {!isAuthenticated && (
              <RouterLink to="/register">
                <Button
                  size="lg"
                  bgGradient="linear(to-r, blue.600, cyan.500)"
                  color="white"
                  px={10}
                  rightIcon={<ArrowForwardIcon />}
                  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                >
                  Crear cuenta gratis
                </Button>
              </RouterLink>
            )}
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

function FeatureCard({ icon, title, description, gradient }: { icon: string; title: string; description: string; gradient: string }) {
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box
      bg={bgCard}
      p={8}
      rounded="2xl"
      shadow="sm"
      border="1px"
      borderColor={borderColor}
      _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
      transition="all 0.3s"
    >
      <Stack spacing={4}>
        <Box
          w="56px"
          h="56px"
          bgGradient={gradient}
          rounded="xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="2xl"
        >
          {icon}
        </Box>
        <Heading size="md" color={useColorModeValue('gray.900', 'white')}>
          {title}
        </Heading>
        <Text color="gray.500" lineHeight="1.7">
          {description}
        </Text>
      </Stack>
    </Box>
  );
}
