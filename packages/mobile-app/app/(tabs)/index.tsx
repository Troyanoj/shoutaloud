import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a ShoutAloud</Text>
      <Text style={styles.subtitle}>Tu voz importa. Participa en la democracia.</Text>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/proposals')}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuTitle}>Propuestas</Text>
          <Text style={styles.menuDesc}>Explora y vota en propuestas ciudadanas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuTitle}>Tu Perfil</Text>
          <Text style={styles.menuDesc}>Revisa tu reputación y badges</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/proposal/new')}
        >
          <Text style={styles.menuIcon}>✏️</Text>
          <Text style={styles.menuTitle}>Crear Propuesta</Text>
          <Text style={styles.menuDesc}>Presenta una nueva propuesta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 24,
  },
  menu: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 14,
    color: '#718096',
  },
});
