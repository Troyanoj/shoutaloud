import { Box, Button, Flex, HStack, Text, useColorModeValue, Image, Container, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, VStack } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { account, connect } = useWeb3();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.900');
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      <RouterLink to="/proposals">
        <Button variant="ghost" size="sm" _hover={{ bg: 'blue.50', color: 'blue.600' }}>Propuestas</Button>
      </RouterLink>
      <RouterLink to="/results">
        <Button variant="ghost" size="sm" _hover={{ bg: 'blue.50', color: 'blue.600' }}>Resultados</Button>
      </RouterLink>
      <RouterLink to="/analytics">
        <Button variant="ghost" size="sm" _hover={{ bg: 'blue.50', color: 'blue.600' }}>Analíticas</Button>
      </RouterLink>
      {isAuthenticated && (
        <RouterLink to="/moderation">
          <Button variant="ghost" size="sm" _hover={{ bg: 'blue.50', color: 'blue.600' }}>Moderación</Button>
        </RouterLink>
      )}
    </>
  );

  return (
    <Box bg={bgColor} px={4} shadow="md" borderBottom="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
      <Container maxW="container.xl">
        <Flex h={20} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <RouterLink to="/">
            <HStack spacing={3}>
              <Image
                src="/logo-shoutaloud.png"
                alt="ShoutAloud"
                h="60px"
                w="auto"
                objectFit="contain"
                fallback={<Text fontSize="xl" fontWeight="bold" bgGradient="linear(to-r, blue.600, cyan.500)" bgClip="text">ShoutAloud</Text>}
              />
            </HStack>
          </RouterLink>

          {/* Desktop Nav */}
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            {isAuthenticated && <NavLinks />}
          </HStack>

          {/* Desktop Actions */}
          <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
            {!account && (
              <Button
                colorScheme="purple"
                size="sm"
                variant="outline"
                onClick={() => connect()}
                leftIcon={<span>🔗</span>}
              >
                Wallet
              </Button>
            )}
            {account && (
              <Box px={3} py={1} bg={useColorModeValue('purple.50', 'purple.900')} rounded="full" border="1px" borderColor="purple.200">
                <Text fontSize="xs" color="purple.600" fontFamily="mono">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </Text>
              </Box>
            )}

            {!isAuthenticated ? (
              <RouterLink to="/login">
                <Button size="sm" bgGradient="linear(to-r, blue.600, cyan.500)" color="white" _hover={{ opacity: 0.9 }}>
                  Iniciar Sesión
                </Button>
              </RouterLink>
            ) : (
              <>
                <RouterLink to="/profile">
                  <Button variant="outline" size="sm" borderColor="blue.200" color="blue.600">Perfil</Button>
                </RouterLink>
                <Button size="sm" variant="ghost" color="gray.500" onClick={handleLogout}>Salir</Button>
              </>
            )}
          </HStack>

          {/* Mobile Menu Button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
          />
        </Flex>

        {/* Mobile Menu */}
        {isOpen && (
          <Box pb={4} display={{ base: 'block', md: 'none' }}>
            <VStack spacing={3} align="stretch">
              {isAuthenticated && (
                <>
                  <RouterLink to="/proposals" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" w="full" justifyContent="flex-start">Propuestas</Button>
                  </RouterLink>
                  <RouterLink to="/results" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" w="full" justifyContent="flex-start">Resultados</Button>
                  </RouterLink>
                  <RouterLink to="/analytics" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" w="full" justifyContent="flex-start">Analíticas</Button>
                  </RouterLink>
                </>
              )}
              {!isAuthenticated ? (
                <RouterLink to="/login" onClick={() => setIsOpen(false)}>
                  <Button w="full" bgGradient="linear(to-r, blue.600, cyan.500)" color="white">Iniciar Sesión</Button>
                </RouterLink>
              ) : (
                <>
                  <RouterLink to="/profile" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" w="full">Perfil</Button>
                  </RouterLink>
                  <Button variant="ghost" w="full" onClick={() => { handleLogout(); setIsOpen(false); }}>Salir</Button>
                </>
              )}
            </VStack>
          </Box>
        )}
      </Container>
    </Box>
  );
}
