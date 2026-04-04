import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Grid,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  Badge,
  HStack,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Skeleton,
  SkeletonText,
  Alert,
  AlertIcon,
  Center,
  Spinner,
} from '@chakra-ui/react';
import api from '../services/api';

interface VoteResult {
  proposal_id: number;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  total_votes: number;
  yes_percentage: number;
  no_percentage: number;
  abstain_percentage: number;
}

interface Proposal {
  id: number;
  title: string;
  summary: string;
  category: string;
  scope: string;
  status: string;
  vote_count: number;
  support_count: number;
  rejection_count: number;
  created_at: string;
}

export default function ResultsPage() {
  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals-results'],
    queryFn: async () => {
      const response = await api.get('/api/proposals?limit=100');
      return response.data.results as Proposal[];
    },
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/overview');
      return response.data;
    },
  });

  const isLoading = proposalsLoading || analyticsLoading;

  const closedProposals = proposalsData?.filter((p) => p.status === 'closed') || [];
  const activeProposals = proposalsData?.filter((p) => p.status === 'active') || [];

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Stack spacing={6}>
          <Skeleton height="40px" width="250px" />
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" p={6}>
                <SkeletonText noOfLines={2} spacing={4} />
              </Box>
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  const totalProposals = proposalsData?.length || 0;
  const approvedProposals = closedProposals.filter((p) => p.support_count > p.rejection_count).length;
  const rejectedProposals = closedProposals.length - approvedProposals;
  const totalVotesCast =
    proposalsData?.reduce((sum, p) => sum + p.support_count + p.rejection_count, 0) || 0;

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Heading size="xl">Voting Results</Heading>

        {analyticsData && (
          <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={6}>
            <StatCard label="Total Users" value={analyticsData.total_users?.toString() || '0'} color="blue" />
            <StatCard label="Total Proposals" value={analyticsData.total_proposals?.toString() || '0'} color="green" />
            <StatCard label="Total Votes" value={analyticsData.total_votes?.toString() || '0'} color="purple" />
            <StatCard
              label="Participation"
              value={`${(analyticsData.participation_rate || 0).toFixed(1)}%`}
              color="orange"
            />
          </Grid>
        )}

        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
          <StatCard label="Total Proposals" value={totalProposals.toString()} color="blue" />
          <StatCard label="Approved" value={approvedProposals.toString()} color="green" />
          <StatCard label="Rejected" value={rejectedProposals.toString()} color="red" />
          <StatCard label="Total Votes Cast" value={totalVotesCast.toString()} color="purple" />
        </Grid>

        {activeProposals.length > 0 && (
          <>
            <Heading size="md">Active Proposals</Heading>
            <Box bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" overflow="hidden">
              <TableContainer>
                <Table variant="simple">
                  <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                    <Tr>
                      <Th>Proposal</Th>
                      <Th>Category</Th>
                      <Th isNumeric>For</Th>
                      <Th isNumeric>Against</Th>
                      <Th isNumeric>Total</Th>
                      <Th>Progress</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {activeProposals.map((result) => (
                      <ResultRow key={result.id} result={result} />
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}

        {closedProposals.length > 0 && (
          <>
            <Heading size="md">Closed Proposals</Heading>
            <Box bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" overflow="hidden">
              <TableContainer>
                <Table variant="simple">
                  <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                    <Tr>
                      <Th>Proposal</Th>
                      <Th>Category</Th>
                      <Th isNumeric>For</Th>
                      <Th isNumeric>Against</Th>
                      <Th isNumeric>Total</Th>
                      <Th>Result</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {closedProposals.map((result) => (
                      <ResultRow key={result.id} result={result} showResult />
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}

        {totalProposals === 0 && (
          <Center py={12}>
            <Text color="gray.500">No voting results yet. Be the first to create a proposal!</Text>
          </Center>
        )}
      </Stack>
    </Container>
  );
}

function ResultRow({ result, showResult }: { result: Proposal; showResult?: boolean }) {
  const total = result.support_count + result.rejection_count;
  const forPercentage = total > 0 ? (result.support_count / total) * 100 : 0;
  const isApproved = result.support_count > result.rejection_count;

  return (
    <Tr>
      <Td>
        <Stack spacing={1}>
          <Text fontWeight="bold">{result.title}</Text>
          <Text fontSize="sm" noOfLines={1} color="gray.500">
            {result.summary}
          </Text>
        </Stack>
      </Td>
      <Td>
        <Badge variant="outline" fontSize="xs">
          {result.category}
        </Badge>
      </Td>
      <Td isNumeric>
        <Text fontWeight="medium" color="green.500">
          {result.support_count}
        </Text>
      </Td>
      <Td isNumeric>
        <Text fontWeight="medium" color="red.500">
          {result.rejection_count}
        </Text>
      </Td>
      <Td isNumeric>{total}</Td>
      <Td>
        <Stack spacing={1}>
          <Progress value={forPercentage} colorScheme={isApproved ? 'green' : 'red'} size="sm" rounded="full" />
          {showResult && (
            <Badge
              colorScheme={isApproved ? 'green' : 'red'}
              fontSize="xs"
              px={2}
              py={1}
              rounded="md"
              alignSelf="flex-start"
            >
              {isApproved ? 'APPROVED' : 'REJECTED'}
            </Badge>
          )}
        </Stack>
      </Td>
    </Tr>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box bg={useColorModeValue('white', 'gray.700')} rounded="lg" shadow="md" p={6}>
      <Stack spacing={2}>
        <Text fontSize="sm" color="gray.500" textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="3xl" fontWeight="bold" color={`${color}.500`}>
          {value}
        </Text>
      </Stack>
    </Box>
  );
}
