import { Box, Button, Container, Heading, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomePage() {
  const { isAuthenticated } = useAuth();
  const bgGradient = useColorModeValue(
    'linear(to-r, blue.100, purple.100)',
    'linear(to-r, blue.900, purple.900)'
  );

  return (
    <Box
      bgGradient={bgGradient}
      minH="calc(100vh - 80px)"
      py={20}
      px={4}
    >
      <Container maxW="container.lg">
        <Stack spacing={8} alignItems="center" textAlign="center">
          <Heading
            as="h1"
            size="2xl"
            bgGradient="linear(to-r, blue.400, purple.500)"
            bgClip="text"
          >
            Welcome to ShoutAloud
          </Heading>
          
          <Text fontSize="xl" maxW="2xl">
            A decentralized platform for democratic participation and transparent governance.
            Make your voice heard and contribute to meaningful change in your community.
          </Text>

          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={4}
            pt={8}
          >
            {!isAuthenticated ? (
              <>
                <RouterLink to="/register">
                  <Button
                    size="lg"
                    colorScheme="blue"
                    px={8}
                  >
                    Get Started
                  </Button>
                </RouterLink>
                <RouterLink to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    px={8}
                  >
                    Sign In
                  </Button>
                </RouterLink>
              </>
            ) : (
              <RouterLink to="/proposals">
                <Button
                  size="lg"
                  colorScheme="blue"
                  px={8}
                >
                  View Proposals
                </Button>
              </RouterLink>
            )}
          </Stack>

          <Stack spacing={4} pt={8}>
            <Heading size="md">Key Features</Heading>
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={8}
              pt={4}
            >
              <Feature
                title="Decentralized Voting"
                text="Secure and transparent voting system powered by blockchain technology"
              />
              <Feature
                title="Community Proposals"
                text="Create and participate in community-driven initiatives and proposals"
              />
              <Feature
                title="Real-time Results"
                text="Track voting results and community engagement in real-time"
              />
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      p={6}
      rounded="lg"
      shadow="md"
      flex="1"
    >
      <Heading size="sm" mb={2}>
        {title}
      </Heading>
      <Text color={useColorModeValue('gray.600', 'gray.300')}>{text}</Text>
    </Box>
  );
}