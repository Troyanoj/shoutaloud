/**
 * Shout Aloud Mobile App - React Native
 * Project structure and configuration
 */

// package.json
export const packageJson = {
  "name": "shout-aloud-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~49.0.0",
    "expo-camera": "~13.4.0",
    "expo-face-detector": "~12.4.0",
    "expo-local-authentication": "~13.4.0",
    "expo-location": "~16.1.0",
    "expo-secure-store": "~12.3.0",
    "expo-status-bar": "~1.6.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/native-stack": "^6.9.13",
    "@react-navigation/bottom-tabs": "^6.5.8",
    "ethers": "^5.7.2",
    "@walletconnect/react-native-dapp": "^1.8.0",
    "react-native-svg": "13.9.0",
    "react-native-reanimated": "~3.3.0",
    "react-native-gesture-handler": "~2.12.0",
    "@tanstack/react-query": "^4.32.0",
    "zustand": "^4.4.0",
    "react-native-mmkv": "^2.10.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.14",
    "typescript": "^5.1.3"
  }
};

// App.tsx - Main entry point
export const AppTsx = `
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { Web3Provider } from './src/contexts/Web3Context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useIdentityStore } from './src/stores/identityStore';

const queryClient = new QueryClient();

export default function App() {
  const initializeApp = useIdentityStore((state) => state.initialize);

  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <Web3Provider>
            <AuthProvider>
              <NavigationContainer>
                <StatusBar style="light" />
                <RootNavigator />
              </NavigationContainer>
            </AuthProvider>
          </Web3Provider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
`;

// Project structure
export const projectStructure = `
frontend-mobile/
├── App.tsx
├── package.json
├── tsconfig.json
├── babel.config.js
├── app.json
├── assets/
│   ├── logo.png
│   ├── splash.png
│   └── icons/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── auth/
│   │   │   ├── BiometricScanner.tsx
│   │   │   ├── DocumentScanner.tsx
│   │   │   └── IdentityVerification.tsx
│   │   ├── proposals/
│   │   │   ├── ProposalCard.tsx
│   │   │   ├── AIExplanation.tsx
│   │   │   └── VoteButtons.tsx
│   │   └── results/
│   │       ├── ResultsChart.tsx
│   │       └── ZoneStats.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegistrationScreen.tsx
│   │   ├── main/
│   │   │   ├── ProposalsScreen.tsx
│   │   │   ├── VotingScreen.tsx
│   │   │   ├── ResultsScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── onboarding/
│   │       └── OnboardingScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── proposalsApi.ts
│   │   │   ├── votingApi.ts
│   │   │   └── aiApi.ts
│   │   ├── blockchain/
│   │   │   ├── contracts.ts
│   │   │   ├── voting.ts
│   │   │   └── identity.ts
│   │   └── storage/
│   │       ├── secureStorage.ts
│   │       └── mmkvStorage.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProposals.ts
│   │   ├── useVoting.ts
│   │   └── useRealTimeResults.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── Web3Context.tsx
│   ├── stores/
│   │   ├── identityStore.ts
│   │   ├── proposalStore.ts
│   │   └── votingStore.ts
│   ├── utils/
│   │   ├── crypto.ts
│   │   ├── zkProofs.ts
│   │   └── constants.ts
│   └── types/
│       ├── auth.types.ts
│       ├── proposal.types.ts
│       └── voting.types.ts
`;

// TypeScript configuration
export const tsConfig = {
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  }
};

// Babel configuration
export const babelConfig = `
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types'
          }
        }
      ]
    ]
  };
};
`;

// App configuration
export const appJson = {
  "expo": {
    "name": "Shout Aloud",
    "slug": "shout-aloud",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "org.shoutaloud.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Required for identity verification",
        "NSLocationWhenInUseUsageDescription": "Required to determine your voting zone",
        "NSFaceIDUsageDescription": "Required for secure authentication"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "org.shoutaloud.app",
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Required for identity verification"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Required to determine your voting zone"
        }
      ]
    ]
  }
};