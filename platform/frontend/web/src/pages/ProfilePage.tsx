import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Stack,
  Heading,
  Text,
  Badge,
  HStack,
  Avatar,
  SimpleGrid,
  Divider,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface UserProfile {
  id: number;
  did: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  municipality_code: number;
  state_code: number;
  is_active: boolean;
  is_verified: boolean;
  reputation_score: number;
  created_at: string;
  last_login: string | null;
}

interface ReputationData {
  user_id: number;
  total_score: number;
  level: string;
  positive_tags: number;
  negative_tags: number;
  neutral_tags: number;
  participation_count: number;
  last_updated: string;
}

interface BadgeData {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/auth/me');
      return response.data;
    },
    enabled: !!user?.id,
  });

  const { data: reputation, isLoading: repLoading } = useQuery<ReputationData>({
    queryKey: ['reputation', user?.id],
    queryFn: async () => {
      const response = await api.get(`/api/reputation/${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const { data: badges, isLoading: badgesLoading } = useQuery<BadgeData[]>({
    queryKey: ['badges', user?.id],
    queryFn: async () => {
      const response = await api.get(`/api/reputation/${user?.id}/badges`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || repLoading || badgesLoading;

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!profile) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="error">
          <AlertIcon />
          Unable to load profile
        </Alert>
      </Container>
    );
  }

  const repLevel = reputation?.level || 'Ciudadano';
  const repScore = reputation?.total_score || profile.reputation_score || 0;
  const nextLevelThreshold = repScore >= 100 ? 100 : repScore >= 50 ? 100 : repScore >= 20 ? 50 : 20;
  const progressPercent = Math.min((repScore / nextLevelThreshold) * 100, 100);

  return (
    <Container maxW="container.md" py={8}>
      <Stack spacing={8}>
        <HStack spacing={6} align="flex-start">
          <Avatar size="xl" name={profile.full_name || profile.username || 'User'} />
          <Stack spacing={1}>
            <Heading size="lg">{profile.full_name || profile.username || 'Anonymous Citizen'}</Heading>
            {profile.email && <Text color="gray.500">{profile.email}</Text>}
            <Text fontSize="sm" color="gray.400" fontFamily="mono">
              {profile.did}
            </Text>
            <HStack mt={2}>
              <Badge colorScheme={profile.is_verified ? 'green' : 'yellow'}>
                {profile.is_verified ? 'Verified' : 'Pending Verification'}
              </Badge>
              <Badge colorScheme={profile.is_active ? 'blue' : 'gray'}>
                {profile.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </HStack>
          </Stack>
        </HStack>

        <Divider />

        <Box bg="gray.50" rounded="lg" p={6} dark:bg="gray.700">
          <Heading size="md" mb={4}>
            Reputation
          </Heading>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="lg" fontWeight="bold">
              {repLevel}
            </Text>
            <Text fontSize="lg" color="blue.500">
              {repScore.toFixed(1)} pts
            </Text>
          </HStack>
          <Progress value={progressPercent} colorScheme="blue" size="md" rounded="full" mb={2} />
          <Text fontSize="sm" color="gray.500">
            Next level: {nextLevelThreshold} pts
          </Text>

          {reputation && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={4}>
              <StatBox label="Positive" value={reputation.positive_tags.toString()} color="green" />
              <StatBox label="Negative" value={reputation.negative_tags.toString()} color="red" />
              <StatBox label="Neutral" value={reputation.neutral_tags.toString()} color="gray" />
              <StatBox label="Participation" value={reputation.participation_count.toString()} color="blue" />
            </SimpleGrid>
          )}
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            Badges
          </Heading>
          {badgesLoading ? (
            <Spinner />
          ) : badges && badges.length > 0 ? (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              {badges.map((badge) => (
                <Box key={badge.id} bg="white" rounded="lg" shadow="md" p={4} textAlign="center" dark:bg="gray.700">
                  <Text fontSize="2xl" mb={2}>
                    {badge.icon === 'user' ? '👤' : badge.icon === 'megaphone' ? '📣' : badge.icon === 'star' ? '⭐' : '🛡️'}
                  </Text>
                  <Text fontWeight="bold" fontSize="sm">
                    {badge.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {badge.description}
                  </Text>
                  {badge.earned_at && (
                    <Text fontSize="xs" color="green.500" mt={1}>
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </Text>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Text color="gray.500">No badges earned yet. Participate more to earn badges!</Text>
          )}
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            Account Info
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <InfoItem label="Municipality Code" value={profile.municipality_code.toString()} />
            <InfoItem label="State Code" value={profile.state_code.toString()} />
            <InfoItem label="Member Since" value={new Date(profile.created_at).toLocaleDateString()} />
            <InfoItem label="Last Login" value={profile.last_login ? new Date(profile.last_login).toLocaleDateString() : 'Never'} />
          </SimpleGrid>
        </Box>
      </Stack>
    </Container>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box textAlign="center">
      <Text fontSize="2xl" fontWeight="bold" color={`${color}.500`}>
        {value}
      </Text>
      <Text fontSize="xs" color="gray.500" textTransform="uppercase">
        {label}
      </Text>
    </Box>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Box bg="gray.50" rounded="md" p={3} dark:bg="gray.700">
      <Text fontSize="xs" color="gray.500" textTransform="uppercase">
        {label}
      </Text>
      <Text fontWeight="medium">{value}</Text>
    </Box>
  );
}
