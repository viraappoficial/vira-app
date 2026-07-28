import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ViraLogo from '../components/ViraLogo';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';

const SUBTITLES = [
  'Não é mais um sistema pra manter. É só o que você precisa lembrar.',
  'Bora organizar sem virar um segundo trabalho.',
];

export default function AuthScreen() {
  const subtitle = useMemo(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)], []);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSendLink() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('sending');
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithOtp({ email: trimmed });
    if (error) {
      setStatus('error');
      setErrorMsg('Não rolou dessa vez. Confere o e-mail e tenta de novo.');
      return;
    }
    setStatus('sent');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <ViraLogo size={48} />
        <Text style={styles.title}>vira</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {status === 'sent' ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentText}>Te mandamos um link pro seu e-mail.</Text>
            <Text style={styles.sentSubtext}>É só abrir e você já entra.</Text>
          </View>
        ) : (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
              editable={status !== 'sending'}
              onSubmitEditing={handleSendLink}
            />
            {status === 'error' && <Text style={styles.errorText}>{errorMsg}</Text>}
            <Pressable
              onPress={handleSendLink}
              disabled={!email.trim() || status === 'sending'}
              style={({ pressed }) => [
                styles.button,
                (!email.trim() || status === 'sending') && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {status === 'sending' ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={styles.buttonText}>Enviar link mágico</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    maxWidth: 360,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
    marginTop: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.atrasado,
    fontSize: 13,
    alignSelf: 'flex-start',
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '600',
  },
  sentBox: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sentText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sentSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
