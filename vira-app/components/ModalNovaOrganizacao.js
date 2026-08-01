import { Check, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { criarOrganizacao } from '../lib/organizacao';
import { COLORS } from '../lib/theme';

const CORES_SUGERIDAS = ['#5B8CFF', '#3FAE72', '#8E6FE8', '#E86F9C', '#D9A544'];

export default function ModalNovaOrganizacao({ visible, onClose, onCriada }) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState(null);
  const [criada, setCriada] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setNome('');
    setCor(CORES_SUGERIDAS[0]);
    setSaving(false);
    setErro(null);
    setCriada(null);
  }, [visible]);

  if (!visible) return null;

  const inicial = nome.trim() ? nome.trim()[0].toUpperCase() : '?';

  async function handleCriar() {
    if (!nome.trim() || saving) return;
    setSaving(true);
    setErro(null);
    try {
      const resultado = await criarOrganizacao({ nome: nome.trim(), cor });
      setCriada(resultado);
      onCriada?.(resultado);
    } catch (e) {
      setErro(e.message || 'Não deu pra criar agora. Tenta de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{criada ? 'Organização criada' : 'Nova organização'}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {criada ? (
          <View style={styles.sucessoWrap}>
            <View style={[styles.preview, { backgroundColor: `${criada.organizacao.cor}22` }]}>
              <Text style={[styles.previewText, { color: criada.organizacao.cor }]}>
                {criada.organizacao.nome[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.sucessoTitulo}>{criada.organizacao.nome}</Text>
            <Text style={styles.sucessoHint}>
              Você é o líder. Já criamos o setor "Geral" pra começar — dá pra organizar em mais setores
              depois.
            </Text>
            <Pressable onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>Show</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.previewWrap}>
              <View style={[styles.preview, { backgroundColor: `${cor}22` }]}>
                <Text style={[styles.previewText, { color: cor }]}>{inicial}</Text>
              </View>
              <Text style={styles.previewHint}>Sem logo por enquanto — usamos a inicial do nome</Text>
            </View>

            <Text style={styles.label}>Nome da organização</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Prime"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              editable={!saving}
            />

            <Text style={styles.label}>Cor</Text>
            <View style={styles.coresRow}>
              {CORES_SUGERIDAS.map((c) => (
                <Pressable key={c} onPress={() => setCor(c)} style={[styles.corSwatch, { backgroundColor: c }]}>
                  {cor === c && <Check size={13} color={COLORS.bg} strokeWidth={3} />}
                </Pressable>
              ))}
            </View>

            {erro && <Text style={styles.erro}>{erro}</Text>}

            <Pressable
              onPress={handleCriar}
              disabled={!nome.trim() || saving}
              style={[styles.button, (!nome.trim() || saving) && styles.buttonDisabled]}
            >
              {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.buttonText}>Criar organização</Text>}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: Platform.OS === 'web' ? 24 : 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxWidth: 380,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 26,
    fontWeight: '700',
  },
  previewHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 220,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 20,
  },
  coresRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  corSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  erro: {
    color: COLORS.atrasado,
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '600',
  },
  sucessoWrap: {
    alignItems: 'center',
    gap: 4,
  },
  sucessoTitulo: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  sucessoHint: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
    maxWidth: 260,
  },
});
