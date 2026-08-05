import { Building2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { aceitarConvite, validarConvite } from '../lib/organizacao';
import { COLORS } from '../lib/theme';

const PAPEL_LABEL = { lider: 'líder', colaborador: 'colaborador' };

export default function AceitarConviteScreen({ token, onDone, onIgnorar }) {
  const [status, setStatus] = useState('carregando'); // carregando | valido | erro | aceitando | aceito
  const [convite, setConvite] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    validarConvite(token)
      .then((resultado) => {
        setConvite(resultado);
        setStatus('valido');
      })
      .catch((err) => {
        setErro(err.message);
        setStatus('erro');
      });
  }, [token]);

  async function handleAceitar() {
    setStatus('aceitando');
    try {
      await aceitarConvite(token);
      setStatus('aceito');
      setTimeout(onDone, 1400);
    } catch (err) {
      setErro(err.message);
      setStatus('erro');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === 'carregando' && <ActivityIndicator color={COLORS.accent} />}

        {status === 'erro' && (
          <>
            <Text style={styles.titulo}>Não deu pra abrir esse convite</Text>
            <Text style={styles.texto}>{erro}</Text>
            <Pressable onPress={onIgnorar} style={styles.buttonSecundario}>
              <Text style={styles.buttonSecundarioText}>Continuar pro Vira</Text>
            </Pressable>
          </>
        )}

        {(status === 'valido' || status === 'aceitando') && convite && (
          <>
            <View style={[styles.icone, { backgroundColor: `${convite.organizacao.cor}22` }]}>
              <Building2 size={24} color={convite.organizacao.cor} />
            </View>
            <Text style={styles.titulo}>{convite.organizacao.nome}</Text>
            <Text style={styles.texto}>
              Você foi convidado pra entrar como {PAPEL_LABEL[convite.papel] || convite.papel} no setor{' '}
              {convite.setor.nome}.
            </Text>
            <Pressable onPress={handleAceitar} disabled={status === 'aceitando'} style={styles.button}>
              {status === 'aceitando' ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={styles.buttonText}>Aceitar convite</Text>
              )}
            </Pressable>
            <Pressable onPress={onIgnorar} style={styles.buttonSecundario}>
              <Text style={styles.buttonSecundarioText}>Agora não</Text>
            </Pressable>
          </>
        )}

        {status === 'aceito' && (
          <>
            <View style={[styles.icone, { backgroundColor: `${convite.organizacao.cor}22` }]}>
              <Building2 size={24} color={convite.organizacao.cor} />
            </View>
            <Text style={styles.titulo}>Pronto!</Text>
            <Text style={styles.texto}>Você já faz parte de {convite.organizacao.nome}.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    maxWidth: 360,
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  icone: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titulo: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  texto: {
    color: COLORS.textSecondary,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonSecundario: {
    marginTop: 12,
    paddingVertical: 6,
  },
  buttonSecundarioText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
  },
});
