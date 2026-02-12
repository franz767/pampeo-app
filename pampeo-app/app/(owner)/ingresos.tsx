import { View, Text, StyleSheet } from 'react-native';

export default function IngresosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresos</Text>
      <Text style={styles.subtitle}>Proximamente: Historial de pagos recibidos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
