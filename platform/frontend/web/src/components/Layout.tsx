import { Box, Container, Flex, useColorModeValue } from '@chakra-ui/react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Flex direction="column" minH="100vh" bg={bgColor}>
      <Navbar />
      <Container maxW="container.xl" flex="1" py={8}>
        <Box as="main">{children}</Box>
      </Container>
      <Footer />
    </Flex>
  );
}