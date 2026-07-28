import { ArrowRight, Check, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ViraLogo from '../components/ViraLogo';
import { COLORS } from '../lib/theme';

const SUGESTOES = [
  'Responder e-mails pendentes',
  'Ligar pro fornecedor',
  'Marcar consulta',
  'Revisar planilha do mês',
];

export default function OnboardingScreen({ onCreateTasks, onDone }) {
  const [passo, setPasso] = useState(0);
  const [tarefas, setTarefas] = useState([]);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (passo === 1) setTimeout(() => inputRef.current?.focus(), 100);
  }, [passo]);

  function adicionar(titulo) {
    const texto = titulo ?? input;
    if (!texto.trim()) return;
    setTarefas((prev) => [...prev, texto.trim()]);
    setInput('');
    inputRef.current?.focus();
  }

  function remover(idx) {
    setTarefas((prev) => prev.filter((_, i) => i !== idx));
  }

  async function finalizar() {
    setSaving(true);
    await onCreateTasks(tarefas);
    setSaving(false);
    setPasso(2);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {passo === 0 && (
          <View style={styles.centerBlock}>
            <ViraLogo size={56} />
            <Text style={styles.title}>vira</Text>
            <Text style={styles.subtitle}>
              Não é mais um sistema pra manter.{'\n'}É só o que você precisa lembrar.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => setPasso(1)}>
              <Text style={styles.primaryButtonText}>Começar</Text>
              <ArrowRight size={16} color={COLORS.bg} />
            </Pressable>
          </View>
        )}

        {passo === 1 && (
          <View style={styles.captureBlock}>
            <Text style={styles.captureTitle}>O que tá pendente agora?</Text>
            <Text style={styles.captureSubtitle}>Joga 2 ou 3 coisas que você precisa lembrar. Sem enrolação.</Text>

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                placeholder="Ex: ligar pro fornecedor"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                onSubmitEditing={() => adicionar()}
              />
              <Pressable onPress={() => adicionar()} disabled={!input.trim()} style={[styles.addButton, !input.trim() && styles.addButtonDisabled]}>
                <Plus size={18} color={COLORS.accent} />
              </Pressable>
            </View>

            {tarefas.length === 0 && (
              <View style={styles.sugestoesRow}>
                {SUGESTOES.map((s) => (
                  <Pressable key={s} onPress={() => adicionar(s)} style={styles.sugestaoChip}>
                    <Text style={styles.sugestaoText}>+ {s}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {tarefas.length > 0 && (
              <View style={styles.listaBlock}>
                {tarefas.map((t, i) => (
                  <View key={i} style={styles.tarefaRow}>
                    <Text style={styles.tarefaText}>{t}</Text>
                    <Pressable onPress={() => remover(i)}>
                      <Text style={styles.removerText}>remover</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={finalizar}
              disabled={tarefas.length === 0 || saving}
              style={[styles.primaryButton, styles.fullWidth, (tarefas.length === 0 || saving) && styles.addButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? 'Salvando...'
                  : tarefas.length === 0
                    ? 'Adicione ao menos 1'
                    : `Pronto — ${tarefas.length} adicionada${tarefas.length !== 1 ? 's' : ''}`}
              </Text>
            </Pressable>

            <Pressable onPress={() => setPasso(2)} style={styles.skipButton}>
              <Text style={styles.skipText}>Pular por agora</Text>
            </Pressable>
          </View>
        )}

        {passo === 2 && (
          <View style={styles.centerBlock}>
            <ViraLogo size={48} />
            <View style={styles.checkCircle}>
              <Check size={26} color={COLORS.concluido} strokeWidth={3} />
            </View>
            <Text style={styles.title}>Prontinho.</Text>
            <Text style={styles.subtitle}>
              {tarefas.length > 0
                ? `${tarefas.length} coisa${tarefas.length !== 1 ? 's' : ''} já não tá${tarefas.length !== 1 ? 'ão' : ''} só na sua cabeça.`
                : 'Quando quiser, é só tocar no + pra começar.'}
            </Text>
            <Pressable style={styles.primaryButton} onPress={onDone}>
              <Text style={styles.primaryButtonText}>Ir pro Vira</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: 380,
    width: '100%',
    alignSelf: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  fullWidth: {
    width: '100%',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '600',
  },
  captureBlock: {
    gap: 12,
  },
  captureTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  captureSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 12,
    padding: 12,
  },
  sugestoesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sugestaoChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sugestaoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  listaBlock: {
    gap: 6,
  },
  tarefaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tarefaText: {
    color: COLORS.text,
    fontSize: 14,
  },
  removerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 4,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.concluido}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
