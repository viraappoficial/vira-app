import { Check } from 'lucide-react-native';
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
import ViraLogoSpinner from '../components/ViraLogoSpinner';
import LegalScreen from './LegalScreen';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';

const SUBTITLES = [
  'Não é mais um sistema pra manter. É só o que você precisa lembrar.',
  'Bora organizar sem virar um segundo trabalho.',
];

const MENSAGENS_ERRO = {
  'Invalid login credentials': 'E-mail ou senha errados.',
  'User already registered': 'Esse e-mail já tem conta — tenta entrar.',
  'Password should be at least 6 characters': 'A senha precisa ter pelo menos 6 caracteres.',
};

export default function AuthScreen() {
  const subtitle = useMemo(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)], []);
  const [modo, setModo] = useState('login'); // login | criar
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [status, setStatus] = useState('idle'); // idle | enviando | erro
  const [errorMsg, setErrorMsg] = useState('');
  const [contaCriadaAguardandoEmail, setContaCriadaAguardandoEmail] = useState(false);
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [legalVisivel, setLegalVisivel] = useState(null); // null | 'privacidade' | 'termos'

  const isCriar = modo === 'criar';

  function handleTrocarModo() {
    setModo(isCriar ? 'login' : 'criar');
    setStatus('idle');
    setErrorMsg('');
    setSenha('');
    setConfirmarSenha('');
  }

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !senha) return;

    if (isCriar && senha !== confirmarSenha) {
      setStatus('erro');
      setErrorMsg('As senhas não são iguais.');
      return;
    }

    if (isCriar && !aceitouTermos) {
      setStatus('erro');
      setErrorMsg('Pra criar conta, aceita a Política de Privacidade e os Termos de Uso.');
      return;
    }

    setStatus('enviando');
    setErrorMsg('');

    if (isCriar) {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: senha,
        options: { data: { termos_aceitos_em: new Date().toISOString() } },
      });
      if (error) {
        setStatus('erro');
        setErrorMsg(MENSAGENS_ERRO[error.message] || 'Não rolou dessa vez. Tenta de novo.');
        return;
      }
      if (!data.session) {
        setContaCriadaAguardandoEmail(true);
        setStatus('idle');
        return;
      }
      // Se já veio sessão, o listener no App.js pega a troca sozinho.
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password: senha });
      if (error) {
        setStatus('erro');
        setErrorMsg(MENSAGENS_ERRO[error.message] || 'Não rolou dessa vez. Tenta de novo.');
        return;
      }
    }
  }

  async function handleEsqueciSenha() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus('erro');
      setErrorMsg('Escreve seu e-mail ali em cima primeiro.');
      return;
    }
    setStatus('enviando');
    setErrorMsg('');
    await supabase.auth.resetPasswordForEmail(trimmedEmail);
    setRecuperacaoEnviada(true);
    setStatus('idle');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <ViraLogoSpinner size={48} loop={false} />
        <Text style={styles.title}>vira</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {contaCriadaAguardandoEmail ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentText}>Confirma seu e-mail pra ativar a conta.</Text>
            <Text style={styles.sentSubtext}>Te mandamos um link de confirmação — depois é só entrar normal.</Text>
          </View>
        ) : recuperacaoEnviada ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentText}>Te mandamos um link pro seu e-mail.</Text>
            <Text style={styles.sentSubtext}>Abre ele pra definir uma senha nova.</Text>
            <Pressable onPress={() => setRecuperacaoEnviada(false)} style={styles.trocarModoButton}>
              <Text style={styles.trocarModoText}>Voltar</Text>
            </Pressable>
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
              editable={status !== 'enviando'}
            />
            <TextInput
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              style={styles.input}
              editable={status !== 'enviando'}
              onSubmitEditing={isCriar ? undefined : handleSubmit}
            />
            {isCriar && (
              <TextInput
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Confirmar senha"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                style={styles.input}
                editable={status !== 'enviando'}
                onSubmitEditing={handleSubmit}
              />
            )}

            {isCriar && (
              <Pressable
                style={styles.termosRow}
                onPress={() => setAceitouTermos((v) => !v)}
                hitSlop={4}
              >
                <View style={[styles.checkbox, aceitouTermos && styles.checkboxAtivo]}>
                  {aceitouTermos && <Check size={12} color={COLORS.bg} strokeWidth={3} />}
                </View>
                <Text style={styles.termosText}>
                  Li e aceito a{' '}
                  <Text style={styles.termosLink} onPress={() => setLegalVisivel('privacidade')}>
                    Política de Privacidade
                  </Text>{' '}
                  e os{' '}
                  <Text style={styles.termosLink} onPress={() => setLegalVisivel('termos')}>
                    Termos de Uso
                  </Text>
                </Text>
              </Pressable>
            )}

            {status === 'erro' && <Text style={styles.errorText}>{errorMsg}</Text>}

            <Pressable
              onPress={handleSubmit}
              disabled={!email.trim() || !senha || status === 'enviando' || (isCriar && !aceitouTermos)}
              style={({ pressed }) => [
                styles.button,
                (!email.trim() || !senha || status === 'enviando' || (isCriar && !aceitouTermos)) &&
                  styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {status === 'enviando' ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={styles.buttonText}>{isCriar ? 'Criar conta' : 'Entrar'}</Text>
              )}
            </Pressable>

            <Pressable onPress={handleTrocarModo} style={styles.trocarModoButton}>
              <Text style={styles.trocarModoText}>
                {isCriar ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
              </Text>
            </Pressable>

            {!isCriar && (
              <Pressable onPress={handleEsqueciSenha} style={styles.trocarModoButton}>
                <Text style={styles.trocarModoText}>Esqueci minha senha</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      <LegalScreen
        visible={legalVisivel !== null}
        initialAba={legalVisivel || 'privacidade'}
        onClose={() => setLegalVisivel(null)}
      />
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
  termosRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    marginTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxAtivo: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  termosText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  termosLink: {
    color: COLORS.accent,
    fontWeight: '600',
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
  trocarModoButton: {
    marginTop: 4,
  },
  trocarModoText: {
    color: COLORS.textSecondary,
    fontSize: 13,
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
