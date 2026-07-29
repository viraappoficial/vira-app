import { Check, Sparkles, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { chamarQuebrarTarefa } from '../lib/quebrarTarefa';
import { COLORS } from '../lib/theme';

export default function ModalQuebrarTarefa({ visible, task, onClose, onConfirm }) {
  const [sugestoes, setSugestoes] = useState([]);
  const [selecionadas, setSelecionadas] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    if (!visible || !task) return;
    setSugestoes([]);
    setSelecionadas({});
    setErro(null);
    setLoading(true);
    chamarQuebrarTarefa(task.titulo, task.descricao)
      .then((lista) => {
        setSugestoes(lista);
        const marcadas = {};
        lista.forEach((_, i) => (marcadas[i] = true));
        setSelecionadas(marcadas);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, [visible, task]);

  if (!visible) return null;

  function toggle(i) {
    setSelecionadas((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  async function handleConfirm() {
    const escolhidas = sugestoes.filter((_, i) => selecionadas[i]);
    if (escolhidas.length === 0) return;
    setCriando(true);
    await onConfirm(escolhidas);
    setCriando(false);
  }

  const temSelecionadas = sugestoes.some((_, i) => selecionadas[i]);

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={15} color={COLORS.accent} />
            <Text style={styles.headerTitle}>Quebrar tarefa</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.subtitle} numberOfLines={2}>
          {task?.titulo}
        </Text>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={styles.loadingText}>Pensando em como dividir...</Text>
          </View>
        )}

        {erro && <Text style={styles.erroText}>{erro}</Text>}

        {!loading && !erro && (
          <View style={styles.list}>
            {sugestoes.map((s, i) => (
              <Pressable key={i} style={styles.item} onPress={() => toggle(i)}>
                <View style={[styles.checkbox, selecionadas[i] && styles.checkboxOn]}>
                  {selecionadas[i] && <Check size={12} color={COLORS.bg} />}
                </View>
                <Text style={styles.itemText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!loading && !erro && (
          <Pressable
            style={[styles.confirmButton, !temSelecionadas && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!temSelecionadas || criando}
          >
            {criando ? (
              <ActivityIndicator size="small" color={COLORS.bg} />
            ) : (
              <Text style={styles.confirmButtonText}>Criar tarefas selecionadas</Text>
            )}
          </Pressable>
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
    maxWidth: 420,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  erroText: {
    color: COLORS.atrasado,
    fontSize: 13,
    paddingVertical: 16,
  },
  list: {
    gap: 8,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  itemText: {
    color: COLORS.text,
    fontSize: 13,
    flexShrink: 1,
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '600',
  },
});
