import { Box, Container, Stack, Text, Link, useColorModeValue } from '@chakra-ui/react';

export default function Footer() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Box bg={bgColor} color={textColor}>
      <Container
        as={Stack}
        maxW="container.xl"
        py={4}
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify={{ base: 'center', md: 'space-between' }}
        align={{ base: 'center', md: 'center' }}
      >
        <Text>© 2024 ShoutAloud. All rights reserved</Text>
        <Stack direction="row" spacing={6}>
          <Link href="#" color="blue.500">Privacy Policy</Link>
          <Link href="#" color="blue.500">Terms of Service</Link>
          <Link href="#" color="blue.500">Contact</Link>
        </Stack>
      </Container>
    </Box>
  );
}