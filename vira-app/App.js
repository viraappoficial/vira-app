import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';

export default function App() {
  const [status, setStatus] = useState('Conectando ao Supabase...');

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(() => setStatus('Conectado ao Supabase ✓'))
      .catch((err) => setStatus(`Erro ao conectar: ${err.message}`));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>vira</Text>
      <Text style={styles.status}>{status}</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14161C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    color: '#EDEFF4',
    fontSize: 24,
    fontWeight: '600',
  },
  status: {
    color: '#8E93A3',
    fontSize: 13,
  },
});
