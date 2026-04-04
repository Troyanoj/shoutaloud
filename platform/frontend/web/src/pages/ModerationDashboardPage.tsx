import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Box,
  Container,
  Stack,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  HStack,
  Button,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Textarea,
  FormControl,
  FormLabel,
  SimpleGrid,
  useDisclosure,
  SkeletonText,
  Skeleton,
  Center,
} from '@chakra-ui/react';
import api from '../services/api';

interface ContentReport {
  id: number;
  reporter_id: number;
  content_type: string;
  content_id: string;
  reason: string;
  description: string | null;
  status: string;
  moderator_id: number | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface ContentReportList {
  results: ContentReport[];
  total: number;
  pending_count: number;
}

interface ModerationDashboard {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  total_actions: number;
  reports_by_reason: Record<string, number>;
  reports_by_status: Record<string, number>;
}

export default function ModerationDashboardPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const { data: dashboard, isLoading: dashLoading } = useQuery<ModerationDashboard>({
    queryKey: ['moderation-dashboard'],
    queryFn: async () => {
      const response = await api.get('/api/moderation/dashboard');
      return response.data;
    },
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery<ContentReportList>({
    queryKey: ['moderation-reports', filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const response = await api.get(`/api/moderation/reports${params}`);
      return response.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      resolution,
    }: {
      reportId: number;
      status: string;
      resolution: string;
    }) => {
      const response = await api.put(`/api/moderation/reports/${reportId}/resolve`, {
        status,
        resolution,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-dashboard'] });
      toast({ title: 'Report resolved', status: 'success', duration: 3000 });
      onClose();
    },
    onError: () => {
      toast({ title: 'Error resolving report', status: 'error', duration: 3000 });
    },
  });

  const handleResolve = (report: ContentReport, status: string, resolution: string) => {
    resolveMutation.mutate({ reportId: report.id, status, resolution });
  };

  const isLoading = dashLoading || reportsLoading;

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Stack spacing={6}>
          <Skeleton height="40px" width="300px" />
          <SimpleGrid columns={4} spacing={6}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} bg="white" rounded="lg" shadow="md" p={6} dark:bg="gray.700">
                <SkeletonText noOfLines={2} spacing={4} />
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Heading size="xl">Moderation Dashboard</Heading>

        {dashboard && (
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            <StatCard label="Total Reports" value={dashboard.total_reports.toString()} color="blue" />
            <StatCard label="Pending" value={dashboard.pending_reports.toString()} color="orange" />
            <StatCard label="Resolved" value={dashboard.resolved_reports.toString()} color="green" />
            <StatCard label="Actions Taken" value={dashboard.total_actions.toString()} color="purple" />
          </SimpleGrid>
        )}

        {dashboard && Object.keys(dashboard.reports_by_reason).length > 0 && (
          <Box bg="white" rounded="lg" shadow="md" p={6} dark:bg="gray.700">
            <Heading size="md" mb={4}>
              Reports by Reason
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              {Object.entries(dashboard.reports_by_reason).map(([reason, count]) => (
                <Box key={reason} textAlign="center" p={3} bg="gray.50" rounded="md" dark:bg="gray.600">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {count}
                  </Text>
                  <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                    {reason}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}

        <HStack justify="space-between">
          <Heading size="md">Reports</Heading>
          <Select
            maxW="200px"
            placeholder="All statuses"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </Select>
        </HStack>

        <Box bg="white" rounded="lg" shadow="md" overflow="hidden" dark:bg="gray.700">
          <TableContainer>
            <Table variant="simple">
              <Thead bg="gray.50" dark:bg="gray.800">
                <Tr>
                  <Th>ID</Th>
                  <Th>Type</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reportsData?.results.map((report) => (
                  <Tr key={report.id}>
                    <Td>#{report.id}</Td>
                    <Td>
                      <Badge variant="outline">{report.content_type}</Badge>
                    </Td>
                    <Td>{report.reason}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          report.status === 'pending'
                            ? 'orange'
                            : report.status === 'resolved'
                            ? 'green'
                            : 'gray'
                        }
                      >
                        {report.status}
                      </Badge>
                    </Td>
                    <Td fontSize="sm">{new Date(report.created_at).toLocaleDateString()}</Td>
                    <Td>
                      {report.status === 'pending' && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => {
                            setSelectedReport(report);
                            onOpen();
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {reportsData?.results.length === 0 && (
          <Center py={12}>
            <Text color="gray.500">No reports found.</Text>
          </Center>
        )}
      </Stack>

      <ResolveModal
        isOpen={isOpen}
        onClose={onClose}
        report={selectedReport}
        onResolve={handleResolve}
        isLoading={resolveMutation.isPending}
      />
    </Container>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box bg="white" rounded="lg" shadow="md" p={6} dark:bg="gray.700">
      <Text fontSize="sm" color="gray.500" textTransform="uppercase">
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="bold" color={`${color}.500`}>
        {value}
      </Text>
    </Box>
  );
}

function ResolveModal({
  isOpen,
  onClose,
  report,
  onResolve,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: ContentReport | null;
  onResolve: (report: ContentReport, status: string, resolution: string) => void;
  isLoading: boolean;
}) {
  const [resolution, setResolution] = useState('');
  const [status, setStatus] = useState('resolved');

  const handleSubmit = () => {
    if (report && resolution.trim()) {
      onResolve(report, status, resolution);
      setResolution('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Review Report #{report?.id}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Stack spacing={4}>
            <Box bg="gray.50" p={3} rounded="md" dark:bg="gray.700">
              <Text fontSize="sm">
                <strong>Type:</strong> {report?.content_type}
              </Text>
              <Text fontSize="sm">
                <strong>Reason:</strong> {report?.reason}
              </Text>
              {report?.description && (
                <Text fontSize="sm">
                  <strong>Description:</strong> {report.description}
                </Text>
              )}
            </Box>

            <FormControl>
              <FormLabel>Resolution</FormLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="resolved">Resolved - Content removed</option>
                <option value="dismissed">Dismissed - No action needed</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Add resolution notes..."
                rows={3}
              />
            </FormControl>

            <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
              Submit Resolution
            </Button>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
