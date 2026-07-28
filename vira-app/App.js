import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import ViraLogo from './components/ViraLogo';
import AuthScreen from './screens/AuthScreen';
import { supabase } from './lib/supabase';
import { COLORS } from './lib/theme';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = deslogado

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accent} />
        <StatusBar style="light" />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <ViraLogo size={40} />
      <Text style={styles.title}>vira</Text>
      <Text style={styles.status}>Logado como {session.user.email}</Text>
      <Pressable style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sair</Text>
      </Pressable>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
  },
  status: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  signOutButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
