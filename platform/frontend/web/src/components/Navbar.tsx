import { Box, Button, Flex, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { account, connect } = useWeb3();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box bg={bgColor} px={4} shadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <RouterLink to="/">
          <Text fontSize="xl" fontWeight="bold">ShoutAloud</Text>
        </RouterLink>

        <HStack spacing={4}>
          {isAuthenticated && (
            <>
              <RouterLink to="/proposals">
                <Button variant="ghost" size="sm">Proposals</Button>
              </RouterLink>
              <RouterLink to="/results">
                <Button variant="ghost" size="sm">Results</Button>
              </RouterLink>
              <RouterLink to="/analytics">
                <Button variant="ghost" size="sm">Analytics</Button>
              </RouterLink>
              <RouterLink to="/moderation">
                <Button variant="ghost" size="sm">Moderation</Button>
              </RouterLink>
            </>
          )}
          
          {!account && (
            <Button colorScheme="blue" size="sm" onClick={() => connect()}>
              Connect Wallet
            </Button>
          )}
          {account && (
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              {account.slice(0, 6)}...{account.slice(-4)}
            </Text>
          )}

          {!isAuthenticated ? (
            <RouterLink to="/login">
              <Button size="sm">Login</Button>
            </RouterLink>
          ) : (
            <>
              <RouterLink to="/profile">
                <Button variant="outline" size="sm">Profile</Button>
              </RouterLink>
              <Button size="sm" onClick={handleLogout}>Logout</Button>
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}