import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Container,
  Grid,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  Badge,
  HStack,
  Progress,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Skeleton,
  SkeletonText,
  Alert,
  AlertIcon,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useWeb3 } from '../contexts/Web3Context';
import api, { apiService } from '../services/api';

interface Proposal {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  scope: 'municipal' | 'state' | 'federal';
  status: 'active' | 'closed' | 'draft';
  author: string | null;
  vote_count: number;
  support_count: number;
  rejection_count: number;
  deadline: string | null;
  created_at: string;
  is_active: boolean;
  days_remaining: number;
}

interface ProposalListResponse {
  results: Proposal[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function ProposalsPage() {
  const { account } = useWeb3();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ scope: '', category: '', status: '' });

  const { data, isLoading, isError, error } = useQuery<ProposalListResponse>({
    queryKey: ['proposals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.scope) params.set('scope', filters.scope);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      const response = await api.get(`/api/proposals?${params.toString()}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: {
      title: string;
      summary: string;
      content: string;
      category: string;
      scope: string;
    }) => {
      const response = await api.post('/api/proposals', formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({ title: 'Proposal created successfully', status: 'success', duration: 3000 });
      onClose();
    },
    onError: () => {
      toast({ title: 'Error creating proposal', status: 'error', duration: 3000 });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: number; vote: number }) => {
      const response = await api.post(`/api/voting/${proposalId}`, {
        vote,
        nullifier_hash: `temp_${Date.now()}`,
        vote_commitment: `temp_${Date.now()}`,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({ title: 'Vote submitted', status: 'success', duration: 3000 });
    },
    onError: () => {
      toast({ title: 'Error submitting vote', status: 'error', duration: 3000 });
    },
  });

  const handleCreateProposal = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      createMutation.mutate({
        title: formData.get('title') as string,
        summary: formData.get('summary') as string,
        content: formData.get('content') as string,
        category: formData.get('category') as string,
        scope: formData.get('scope') as string,
      });
    },
    [createMutation]
  );

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Stack spacing={6}>
          <Skeleton height="40px" width="300px" />
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
            {[1, 2, 3].map((i) => (
              <Box key={i} bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" p={6}>
                <SkeletonText noOfLines={4} spacing={4} />
              </Box>
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          Error loading proposals: {(error as Error).message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading size="xl">Community Proposals</Heading>
          <Button colorScheme="blue" onClick={onOpen}>
            Create Proposal
          </Button>
        </HStack>

        <HStack wrap="wrap" gap={4}>
          <Select
            placeholder="All scopes"
            value={filters.scope}
            onChange={(e) => setFilters((f) => ({ ...f, scope: e.target.value }))}
            maxW="200px"
          >
            <option value="municipal">Municipal</option>
            <option value="state">State</option>
            <option value="federal">Federal</option>
          </Select>
          <Select
            placeholder="All categories"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            maxW="200px"
          >
            <option value="infraestructura">Infraestructura</option>
            <option value="educacion">Educación</option>
            <option value="salud">Salud</option>
            <option value="seguridad">Seguridad</option>
          </Select>
          <Select
            placeholder="All statuses"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            maxW="200px"
          >
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </Select>
        </HStack>

        {data?.results.length === 0 ? (
          <Center py={12}>
            <Text color="gray.500">No proposals found matching your filters.</Text>
          </Center>
        ) : (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
            {data?.results.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onVote={(vote) => voteMutation.mutate({ proposalId: proposal.id, vote })}
                isLoading={voteMutation.isPending}
              />
            ))}
          </Grid>
        )}

        {data && data.total_pages > 1 && (
          <HStack justify="center">
            <Text fontSize="sm" color="gray.500">
              Page {data.page} of {data.total_pages} ({data.total} total)
            </Text>
          </HStack>
        )}
      </Stack>

      <CreateProposalModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleCreateProposal}
        isLoading={createMutation.isPending}
      />
    </Container>
  );
}

function ProposalCard({
  proposal,
  onVote,
  isLoading,
}: {
  proposal: Proposal;
  onVote: (vote: number) => void;
  isLoading: boolean;
}) {
  const totalVotes = proposal.support_count + proposal.rejection_count;
  const forPercentage = totalVotes > 0 ? (proposal.support_count / totalVotes) * 100 : 0;

  return (
    <Box bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" p={6}>
      <Stack spacing={4}>
        <HStack justify="space-between">
          <Heading size="md" noOfLines={2}>
            {proposal.title}
          </Heading>
          <Badge colorScheme={proposal.status === 'active' ? 'green' : proposal.status === 'closed' ? 'gray' : 'yellow'}>
            {proposal.status}
          </Badge>
        </HStack>

        <Text noOfLines={3} fontSize="sm" color="gray.600">
          {proposal.summary}
        </Text>

        <HStack gap={2}>
          <Badge variant="outline" fontSize="xs">
            {proposal.scope}
          </Badge>
          <Badge variant="outline" fontSize="xs">
            {proposal.category}
          </Badge>
        </HStack>

        <Box>
          <Text mb={2} fontSize="sm">
            Votes ({totalVotes})
          </Text>
          <Progress value={forPercentage} colorScheme="blue" rounded="full" size="sm" />
          <HStack justify="space-between" mt={1}>
            <Text fontSize="xs">{proposal.support_count} For</Text>
            <Text fontSize="xs">{proposal.rejection_count} Against</Text>
          </HStack>
        </Box>

        {proposal.is_active && (
          <HStack spacing={4}>
            <Button
              colorScheme="blue"
              variant="outline"
              size="sm"
              flex={1}
              onClick={() => onVote(1)}
              isLoading={isLoading}
            >
              Vote For
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              size="sm"
              flex={1}
              onClick={() => onVote(2)}
              isLoading={isLoading}
            >
              Vote Against
            </Button>
          </HStack>
        )}

        {proposal.deadline && (
          <Text fontSize="xs" color="gray.500">
            {proposal.days_remaining} days remaining
          </Text>
        )}
      </Stack>
    </Box>
  );
}

function CreateProposalModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Proposal</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={onSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input name="title" placeholder="Enter proposal title" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Summary</FormLabel>
                <Textarea name="summary" placeholder="Brief summary" rows={2} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Content</FormLabel>
                <Textarea name="content" placeholder="Full proposal content" rows={4} />
              </FormControl>

              <HStack>
                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select name="category" placeholder="Select category">
                    <option value="infraestructura">Infraestructura</option>
                    <option value="educacion">Educación</option>
                    <option value="salud">Salud</option>
                    <option value="seguridad">Seguridad</option>
                    <option value="medio_ambiente">Medio Ambiente</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Scope</FormLabel>
                  <Select name="scope" placeholder="Select scope">
                    <option value="municipal">Municipal</option>
                    <option value="state">State</option>
                    <option value="federal">Federal</option>
                  </Select>
                </FormControl>
              </HStack>

              <Button type="submit" colorScheme="blue" isLoading={isLoading}>
                Create Proposal
              </Button>
            </Stack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
