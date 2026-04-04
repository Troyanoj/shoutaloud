import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Stack,
  Heading,
  Text,
  Badge,
  HStack,
  Button,
  Progress,
  Divider,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import api from '../services/api';

interface Proposal {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  scope: string;
  status: string;
  author: string | null;
  vote_count: number;
  support_count: number;
  rejection_count: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  days_remaining: number;
  ai_analysis: Record<string, unknown> | null;
}

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: proposal, isLoading, isError } = useQuery<Proposal>({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const response = await api.get(`/api/proposals/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const voteMutation = useMutation({
    mutationFn: async (vote: number) => {
      const response = await api.post(`/api/voting/${id}`, {
        vote,
        nullifier_hash: `temp_${Date.now()}`,
        vote_commitment: `temp_${Date.now()}`,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      toast({ title: 'Vote submitted', status: 'success', duration: 3000 });
    },
    onError: () => {
      toast({ title: 'Error submitting vote', status: 'error', duration: 3000 });
    },
  });

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isError || !proposal) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="error">
          <AlertIcon />
          Proposal not found
        </Alert>
        <Button mt={4} onClick={() => navigate('/proposals')}>
          Back to Proposals
        </Button>
      </Container>
    );
  }

  const total = proposal.support_count + proposal.rejection_count;
  const forPercentage = total > 0 ? (proposal.support_count / total) * 100 : 0;

  return (
    <Container maxW="container.md" py={8}>
      <Stack spacing={6}>
        <Button variant="ghost" leftIcon={<ArrowBackIcon />} onClick={() => navigate('/proposals')} alignSelf="flex-start">
          Back
        </Button>

        <HStack justify="space-between" wrap="wrap" gap={2}>
          <Heading size="xl">{proposal.title}</Heading>
          <Badge colorScheme={proposal.status === 'active' ? 'green' : 'gray'} fontSize="md" px={3} py={1}>
            {proposal.status.toUpperCase()}
          </Badge>
        </HStack>

        <HStack gap={2}>
          <Badge variant="outline">{proposal.scope}</Badge>
          <Badge variant="outline">{proposal.category}</Badge>
        </HStack>

        <Text color="gray.600" whiteSpace="pre-wrap">
          {proposal.content}
        </Text>

        <Divider />

        <Box bg="gray.50" rounded="lg" p={6} dark:bg="gray.700">
          <Heading size="md" mb={4}>
            Voting Results
          </Heading>
          <HStack justify="space-between" mb={2}>
            <Text color="green.500" fontWeight="bold">
              {proposal.support_count} For ({forPercentage.toFixed(1)}%)
            </Text>
            <Text color="red.500" fontWeight="bold">
              {proposal.rejection_count} Against ({(100 - forPercentage).toFixed(1)}%)
            </Text>
          </HStack>
          <Progress value={forPercentage} colorScheme="blue" size="lg" rounded="full" mb={4} />

          {proposal.is_active && (
            <HStack spacing={4}>
              <Button colorScheme="blue" flex={1} onClick={() => voteMutation.mutate(1)} isLoading={voteMutation.isPending}>
                Vote For
              </Button>
              <Button colorScheme="red" flex={1} onClick={() => voteMutation.mutate(2)} isLoading={voteMutation.isPending}>
                Vote Against
              </Button>
            </HStack>
          )}

          {proposal.deadline && (
            <Text fontSize="sm" color="gray.500" mt={2}>
              {proposal.days_remaining > 0 ? `${proposal.days_remaining} days remaining` : 'Voting closed'}
            </Text>
          )}
        </Box>

        {proposal.ai_analysis && (
          <Box bg="blue.50" rounded="lg" p={6} dark:bg="blue.900">
            <Heading size="md" mb={4}>
              AI Analysis
            </Heading>
            <Text>{JSON.stringify(proposal.ai_analysis, null, 2)}</Text>
          </Box>
        )}

        <Tabs>
          <TabList>
            <Tab>Comments</Tab>
            <Tab>Activity</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <CommentsSection proposalId={proposal.id} />
            </TabPanel>
            <TabPanel>
              <Text color="gray.500">Activity history coming soon.</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Container>
  );
}

function CommentsSection({ proposalId }: { proposalId: number }) {
  const [comment, setComment] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', proposalId],
    queryFn: async () => {
      const response = await api.get(`/api/proposals/${proposalId}/comments`);
      return response.data.comments || [];
    },
  });

  const submitComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/api/proposals/${proposalId}/comments`, null, { params: { content: comment } });
      queryClient.invalidateQueries({ queryKey: ['comments', proposalId] });
      setComment('');
      toast({ title: 'Comment added', status: 'success', duration: 2000 });
    } catch {
      toast({ title: 'Error adding comment', status: 'error', duration: 2000 });
    }
  };

  return (
    <Stack spacing={4}>
      <HStack>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment..." />
        <Button colorScheme="blue" onClick={submitComment}>
          Post
        </Button>
      </HStack>

      {isLoading ? (
        <Text color="gray.500">Loading comments...</Text>
      ) : comments?.length === 0 ? (
        <Text color="gray.500">No comments yet.</Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {comments?.map((c: { id: number; content: string; author_id: number; created_at: string; upvotes: number }) => (
            <Box key={c.id} bg="gray.50" rounded="md" p={4} dark:bg="gray.700">
              <Text>{c.content}</Text>
              <HStack mt={2} fontSize="xs" color="gray.500">
                <Text>User #{c.author_id}</Text>
                <Text>•</Text>
                <Text>{new Date(c.created_at).toLocaleDateString()}</Text>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Stack>
  );
}
