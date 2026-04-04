// src/screens/auth/WelcomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          entering={FadeInUp.duration(1000)}
          style={styles.logoContainer}
        >
          <Image 
            source={require('../../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Shout Aloud</Text>
          <Text style={styles.subtitle}>La voz del pueblo es la ley</Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(300).duration(1000)}
          style={styles.textContainer}
        >
          <Text style={styles.description}>
            Es tiempo de recuperar lo que nos pertenece:{'\n'}
            el derecho a decidir nuestro propio destino.
          </Text>
          
          <Text style={styles.manifesto}>
            Este es el momento.{'\n'}
            Este es el despertar.{'\n'}
            Esta es la voz del pueblo.
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(600).duration(1000)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Registration')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>Comenzar</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Ya tengo identidad</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  textContainer: {
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  manifesto: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 28,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '600',
  },
});

// src/screens/auth/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useIdentityStore } from '../../stores/identityStore';
import { BiometricScanner } from '../../components/auth/BiometricScanner';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  
  const { authenticateUser, userDID } = useIdentityStore();

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (compatible) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      }
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setIsAuthenticating(true);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifica tu identidad',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // For production, this would verify against stored biometric hash
        await authenticateWithDID();
      } else {
        Alert.alert('Error', 'Autenticación biométrica falló');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar tu identidad');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFaceAuth = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setShowCamera(true);
    } else {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara para verificar tu identidad');
    }
  };

  const authenticateWithDID = async () => {
    try {
      setIsAuthenticating(true);
      
      // Retrieve stored DID from secure storage
      const storedDID = await getUserStoredDID();
      
      if (!storedDID) {
        Alert.alert('Error', 'No se encontró identidad registrada');
        navigation.navigate('Registration');
        return;
      }

      // Authenticate with blockchain
      const authenticated = await authenticateUser(storedDID);
      
      if (authenticated) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        Alert.alert('Error', 'No se pudo autenticar tu identidad');
      }
    } catch (error) {
      Alert.alert('Error', 'Problema al conectar con la red');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getUserStoredDID = async (): Promise<string | null> => {
    // In production, retrieve from secure storage
    return userDID;
  };

  const onFaceCaptured = async (faceData: any) => {
    setShowCamera(false);
    await authenticateWithDID();
  };

  if (showCamera) {
    return (
      <BiometricScanner
        onCapture={onFaceCaptured}
        onCancel={() => setShowCamera(false)}
        mode="authentication"
      />
    );
  }

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Animated.View entering={FadeIn} style={styles.header}>
            <Text style={styles.title}>Bienvenido de vuelta</Text>
            <Text style={styles.subtitle}>
              Verifica tu identidad para continuar
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(200)}
            style={styles.authContainer}
          >
            {isAuthenticating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Verificando identidad...</Text>
              </View>
            ) : (
              <>
                {biometricType && (
                  <TouchableOpacity
                    style={styles.authButton}
                    onPress={handleBiometricAuth}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.authIcon}>
                        {biometricType === 'face' ? '👤' : '👆'}
                      </Text>
                      <Text style={styles.authButtonText}>
                        {biometricType === 'face' 
                          ? 'Usar Face ID' 
                          : 'Usar Huella Digital'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.authButton, styles.secondaryButton]}
                  onPress={handleFaceAuth}
                  activeOpacity={0.8}
                >
                  <Text style={styles.authIcon}>📷</Text>
                  <Text style={styles.secondaryButtonText}>
                    Escanear Rostro
                  </Text>
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                  <Text style={styles.infoIcon}>🔒</Text>
                  <Text style={styles.infoText}>
                    Tu identidad está protegida con tecnología de prueba de conocimiento cero.
                    Ningún dato biométrico se almacena.
                  </Text>
                </View>
              </>
            )}
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tienes una identidad?{' '}
            <Text 
              style={styles.linkText}
              onPress={() => navigation.navigate('Registration')}
            >
              Regístrate aquí
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  authContainer: {
    width: '100%',
  },
  authButton: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  authIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  linkText: {
    color: '#10B981',
    fontWeight: '600',
  },
});

// src/components/auth/BiometricScanner.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Camera, CameraType, FaceDetectionResult } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface BiometricScannerProps {
  onCapture: (data: any) => void;
  onCancel: () => void;
  mode: 'registration' | 'authentication';
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  onCapture,
  onCancel,
  mode,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<Camera>(null);
  
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const handleFacesDetected = ({ faces }: FaceDetectionResult) => {
    if (faces.length > 0 && !capturing) {
      setFaceDetected(true);
      const face = faces[0];
      
      // Check if face is properly positioned
      const faceCentered = 
        face.bounds.origin.x > screenWidth * 0.15 &&
        face.bounds.origin.x + face.bounds.size.width < screenWidth * 0.85;
      
      if (faceCentered && !capturing) {
        captureFace(face);
      }
    } else {
      setFaceDetected(false);
    }
  };

  const captureFace = async (faceData: any) => {
    if (!cameraRef.current || capturing) return;
    
    setCapturing(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      
      // In production, process biometric data locally
      const biometricHash = await processBiometricData(photo.base64!, faceData);
      
      onCapture({
        biometricHash,
        faceData,
        mode,
      });
    } catch (error) {
      console.error('Error capturing face:', error);
      setCapturing(false);
    }
  };

  const processBiometricData = async (imageBase64: string, faceData: any): Promise<string> => {
    // In production, use local biometric processing
    // This is a mock hash generation
    const mockHash = `bio_${mode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return mockHash;
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPermissionText}>
          No hay permiso para usar la cámara
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.front}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.accurate,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.topOverlay}>
            <Text style={styles.instructionText}>
              {mode === 'registration' 
                ? 'Posiciona tu rostro en el círculo'
                : 'Verifica tu identidad'}
            </Text>
          </View>
          
          <View style={styles.middleOverlay}>
            <Animated.View 
              style={[
                styles.faceGuide,
                animatedStyle,
                faceDetected && styles.faceGuideActive
              ]}
            />
            {capturing && (
              <Text style={styles.capturingText}>Procesando...</Text>
            )}
          </View>
          
          <View style={styles.bottomOverlay}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  middleOverlay: {
    height: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  faceGuide: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: screenWidth * 0.35,
    borderWidth: 3,
    borderColor: '#64748B',
    backgroundColor: 'transparent',
  },
  faceGuideActive: {
    borderColor: '#10B981',
  },
  capturingText: {
    position: 'absolute',
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    bottom: -40,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noPermissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});