import { Box, Container, Stack, Text, Link, useColorModeValue, Image, SimpleGrid, Heading } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  const bgColor = useColorModeValue('gray.900', 'gray.950');
  const textColor = useColorModeValue('gray.400', 'gray.500');
  const headingColor = useColorModeValue('gray.200', 'gray.300');

  return (
    <Box bg={bgColor} color={textColor} pt={16} pb={8}>
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={12} mb={12}>
          {/* Brand */}
          <Stack spacing={4}>
            <Image src="/logo-shoutaloud.png" alt="ShoutAloud" h="36px" objectFit="contain" fallback={<Heading size="md" color="white">ShoutAloud</Heading>} />
            <Text fontSize="sm" lineHeight="1.7">
              Plataforma descentralizada de participación ciudadana. Tu voz, tu poder.
            </Text>
          </Stack>

          {/* Platform */}
          <Stack spacing={4}>
            <Heading size="sm" color={headingColor}>Plataforma</Heading>
            <Stack spacing={2}>
              <Link as={RouterLink} to="/proposals" _hover={{ color: 'cyan.400' }} fontSize="sm">Propuestas</Link>
              <Link as={RouterLink} to="/results" _hover={{ color: 'cyan.400' }} fontSize="sm">Resultados</Link>
              <Link as={RouterLink} to="/analytics" _hover={{ color: 'cyan.400' }} fontSize="sm">Analíticas</Link>
            </Stack>
          </Stack>

          {/* Resources */}
          <Stack spacing={4}>
            <Heading size="sm" color={headingColor}>Recursos</Heading>
            <Stack spacing={2}>
              <Link href="#" _hover={{ color: 'cyan.400' }} fontSize="sm">Documentación</Link>
              <Link href="#" _hover={{ color: 'cyan.400' }} fontSize="sm">API</Link>
              <Link href="#" _hover={{ color: 'cyan.400' }} fontSize="sm">GitHub</Link>
            </Stack>
          </Stack>

          {/* Legal */}
          <Stack spacing={4}>
            <Heading size="sm" color={headingColor}>Legal</Heading>
            <Stack spacing={2}>
              <Link href="#" _hover={{ color: 'cyan.400' }} fontSize="sm">Privacidad</Link>
              <Link href="#" _hover={{ color: 'cyan.400' }} fontSize="sm">Términos</Link>
              <Link href="#" _hover={{ color: 'cyan.400' }} fontSize="sm">Contacto</Link>
            </Stack>
          </Stack>
        </SimpleGrid>

        <Box borderTop="1px" borderColor="gray.800" pt={8}>
          <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" spacing={4}>
            <Text fontSize="sm">© 2026 ShoutAloud. Democracia descentralizada.</Text>
            <Text fontSize="xs" color="gray.600">
              Construido con ❤️ para la ciudadanía
            </Text>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
