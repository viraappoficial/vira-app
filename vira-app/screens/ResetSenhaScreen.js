import { useState } from 'react';
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
import ViraLogoSpinner from '../components/ViraLogoSpinner';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';

export default function ResetSenhaScreen({ onDone }) {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [status, setStatus] = useState('idle'); // idle | salvando | erro
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSalvar() {
    if (!senha) return;
    if (senha !== confirmarSenha) {
      setStatus('erro');
      setErrorMsg('As senhas não são iguais.');
      return;
    }
    setStatus('salvando');
    setErrorMsg('');
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setStatus('erro');
      setErrorMsg('Não rolou dessa vez. Tenta de novo.');
      return;
    }
    onDone();
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <ViraLogoSpinner size={48} loop={false} />
        <Text style={styles.title}>Nova senha</Text>
        <Text style={styles.subtitle}>Define uma senha nova pra sua conta.</Text>

        <TextInput
          value={senha}
          onChangeText={setSenha}
          placeholder="Senha nova"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry
          style={styles.input}
          editable={status !== 'salvando'}
        />
        <TextInput
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          placeholder="Confirmar senha"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry
          style={styles.input}
          editable={status !== 'salvando'}
          onSubmitEditing={handleSalvar}
        />

        {status === 'erro' && <Text style={styles.errorText}>{errorMsg}</Text>}

        <Pressable
          onPress={handleSalvar}
          disabled={!senha || status === 'salvando'}
          style={({ pressed }) => [
            styles.button,
            (!senha || status === 'salvando') && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {status === 'salvando' ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={styles.buttonText}>Salvar senha</Text>
          )}
        </Pressable>
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
});
