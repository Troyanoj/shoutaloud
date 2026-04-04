// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LoadingScreen } from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegistrationScreen } from '../screens/auth/RegistrationScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
    </Stack.Navigator>
  );
};

// src/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { ProposalsScreen } from '../screens/main/ProposalsScreen';
import { VotingScreen } from '../screens/main/VotingScreen';
import { ResultsScreen } from '../screens/main/ResultsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigator for proposals flow
const ProposalsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProposalsList" component={ProposalsScreen} />
      <Stack.Screen name="Voting" component={VotingScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
};

// Tab bar icon component
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const getIcon = () => {
    switch (name) {
      case 'Proposals': return '📋';
      case 'Results': return '📊';
      case 'Profile': return '👤';
      default: return '❓';
    }
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextActive]}>
        {getIcon()}
      </Text>
    </View>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Proposals"
        component={ProposalsStack}
        options={{
          tabBarLabel: 'Propuestas',
          tabBarIcon: ({ focused }) => <TabIcon name="Proposals" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AllResults"
        component={ResultsScreen}
        options={{
          tabBarLabel: 'Resultados',
          tabBarIcon: ({ focused }) => <TabIcon name="Results" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    paddingBottom: 8,
    height: 64,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontSize: 24,
  },
  tabIconTextActive: {
    transform: [{ scale: 1.1 }],
  },
});

// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useIdentityStore } from '../stores/identityStore';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (did: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, authenticateUser, logout: storeLogout } = useIdentityStore();

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Identity store will handle initialization
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async check
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (did: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await authenticateUser(did);
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await storeLogout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// src/contexts/Web3Context.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '@walletconnect/client';
import { VOTING_CONTRACT_ADDRESS, VOTING_ABI } from '../utils/constants';

interface Web3ContextType {
  provider: ethers.providers.Provider | null;
  contract: ethers.Contract | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

export const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connector, setConnector] = useState<WalletConnect | null>(null);

  useEffect(() => {
    // Initialize with default provider (Polygon RPC)
    const defaultProvider = new ethers.providers.JsonRpcProvider(
      'https://polygon-rpc.com'
    );
    setProvider(defaultProvider);
    
    // Initialize contract with read-only provider
    const votingContract = new ethers.Contract(
      VOTING_CONTRACT_ADDRESS,
      VOTING_ABI,
      defaultProvider
    );
    setContract(votingContract);
  }, []);

  const connectWallet = async () => {
    try {
      // Initialize WalletConnect
      const wcConnector = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org',
        qrcodeModal: {
          open: (uri: string) => {
            // Handle QR code display
            console.log('WalletConnect URI:', uri);
          },
          close: () => {
            console.log('QR Modal closed');
          },
        },
      });

      // Check if already connected
      if (!wcConnector.connected) {
        await wcConnector.createSession();
      }

      wcConnector.on('connect', (error, payload) => {
        if (error) {
          throw error;
        }

        const { accounts, chainId } = payload.params[0];
        console.log('Connected:', accounts, chainId);
        
        setIsConnected(true);
        setConnector(wcConnector);
      });

      wcConnector.on('disconnect', () => {
        setIsConnected(false);
        setConnector(null);
      });

    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    if (connector && connector.connected) {
      await connector.killSession();
    }
    setIsConnected(false);
    setConnector(null);
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        contract,
        isConnected,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// src/screens/LoadingScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export const LoadingScreen: React.FC = () => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Text style={styles.logo}>🗳️</Text>
      </Animated.View>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={styles.loadingText}>Cargando...</Text>
    </LinearGradient>
  );
};

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 20,
  },
});

// src/screens/main/ProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useIdentityStore } from '../../stores/identityStore';

export const ProfileScreen: React.FC = () => {
  const { logout } = useAuth();
  const { userDID, municipalityCode, reputation } = useIdentityStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Mi Perfil</Text>

          <View style={styles.identityCard}>
            <Text style={styles.cardTitle}>Identidad Digital</Text>
            <View style={styles.didContainer}>
              <Text style={styles.didLabel}>DID</Text>
              <Text style={styles.didValue} numberOfLines={1}>
                {userDID?.substring(0, 20)}...
              </Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{reputation || 0}</Text>
                <Text style={styles.statLabel}>Reputación</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{municipalityCode || '---'}</Text>
                <Text style={styles.statLabel}>Municipio</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },