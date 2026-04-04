import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Stack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  Center,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Progress,
} from '@chakra-ui/react';
import api from '../services/api';

interface PlatformStats {
  total_users: number;
  total_proposals: number;
  active_proposals: number;
  total_votes: number;
  total_officials: number;
  total_ratings: number;
  recent_votes_30d: number;
  recent_users_30d: number;
  participation_rate: number;
}

interface ProposalAnalytics {
  total_proposals: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_scope: Record<string, number>;
  avg_support_per_proposal: number;
}

interface VotingAnalytics {
  total_votes: number;
  by_value: Record<string, number>;
  avg_weight: number;
}

export default function AnalyticsDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/overview');
      return response.data;
    },
  });

  const { data: proposalAnalytics, isLoading: propLoading } = useQuery<ProposalAnalytics>({
    queryKey: ['analytics-proposals'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/proposals');
      return response.data;
    },
  });

  const { data: votingAnalytics, isLoading: voteLoading } = useQuery<VotingAnalytics>({
    queryKey: ['analytics-voting'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/voting');
      return response.data;
    },
  });

  const isLoading = statsLoading || propLoading || voteLoading;

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Stack spacing={6}>
          <Skeleton height="40px" width="250px" />
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" p={6}>
                <SkeletonText noOfLines={2} spacing={4} />
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          Unable to load analytics
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Heading size="xl">Analytics Dashboard</Heading>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
          <StatCard label="Total Users" value={stats.total_users.toString()} color="blue" />
          <StatCard label="Active Proposals" value={stats.active_proposals.toString()} color="green" />
          <StatCard label="Total Votes" value={stats.total_votes.toString()} color="purple" />
          <StatCard label="Participation" value={`${stats.participation_rate.toFixed(1)}%`} color="orange" />
        </SimpleGrid>

        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={6}>
          <StatCard label="Total Officials" value={stats.total_officials.toString()} color="teal" />
          <StatCard label="Total Ratings" value={stats.total_ratings.toString()} color="pink" />
          <StatCard label="New Users (30d)" value={stats.recent_users_30d.toString()} color="cyan" />
        </SimpleGrid>

        {proposalAnalytics && (
          <Box bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" p={6}>
            <Heading size="md" mb={4}>
              Proposal Analytics
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <BreakdownCard title="By Status" data={proposalAnalytics.by_status} />
              <BreakdownCard title="By Category" data={proposalAnalytics.by_category} />
              <BreakdownCard title="By Scope" data={proposalAnalytics.by_scope} />
            </SimpleGrid>
            <Text mt={4} fontSize="sm" color="gray.500">
              Avg support per proposal: {proposalAnalytics.avg_support_per_proposal.toFixed(1)}
            </Text>
          </Box>
        )}

        {votingAnalytics && (
          <Box bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" p={6}>
            <Heading size="md" mb={4}>
              Voting Analytics
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Vote Distribution
                </Text>
                {Object.entries(votingAnalytics.by_value).map(([value, count]) => {
                  const label = value === '1' ? 'YES' : value === '2' ? 'NO' : 'ABSTAIN';
                  const percentage = votingAnalytics.total_votes > 0 ? (count / votingAnalytics.total_votes) * 100 : 0;
                  return (
                    <Box key={value} mb={3}>
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm">{label}</Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {count} ({percentage.toFixed(1)}%)
                        </Text>
                      </HStack>
                      <Progress
                        value={percentage}
                        colorScheme={value === '1' ? 'green' : value === '2' ? 'red' : 'gray'}
                        size="sm"
                        rounded="full"
                      />
                    </Box>
                  );
                })}
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Summary
                </Text>
                <Text fontSize="sm">Total votes: {votingAnalytics.total_votes}</Text>
                <Text fontSize="sm">Average weight: {votingAnalytics.avg_weight.toFixed(2)}</Text>
                <Text fontSize="sm">Recent votes (30d): {stats.recent_votes_30d}</Text>
              </Box>
            </SimpleGrid>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" p={6}>
      <Text fontSize="sm" color="gray.500" textTransform="uppercase">
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="bold" color={`${color}.500`}>
        {value}
      </Text>
    </Box>
  );
}

function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        {title}
      </Text>
      {Object.entries(data).map(([key, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <Box key={key} mb={2}>
            <HStack justify="space-between">
              <Text fontSize="sm" textTransform="capitalize">
                {key}
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                {count}
              </Text>
            </HStack>
            <Progress value={percentage} size="xs" rounded="full" colorScheme="blue" />
          </Box>
        );
      })}
    </Box>
  );
}
