import { ArrowRight, Check, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ViraLogoSpinner from '../components/ViraLogoSpinner';
import { COLORS } from '../lib/theme';

const SUGESTOES_TAREFA = [
  'Responder e-mails pendentes',
  'Ligar pro fornecedor',
  'Marcar consulta',
  'Revisar planilha do mês',
];

const CORES_ESPACO = ['#5B8CFF', '#4FC98A', '#D9A544', '#8E6FE8', '#E86F9C', '#3FAE72'];

const ESPACOS_SUGERIDOS = ['Trabalho', 'Pessoal', 'Estudos', 'Saúde'];

export default function OnboardingScreen({
  userNameSugerido,
  onSaveNome,
  onSaveArea,
  onCreateEspaco,
  onDeleteEspaco,
  onCreateTasks,
  onDone,
}) {
  const [passo, setPasso] = useState(0);
  const [nome, setNome] = useState(userNameSugerido || '');
  const [area, setArea] = useState('');
  const [espacosCriados, setEspacosCriados] = useState([]);
  const [novoEspacoInput, setNovoEspacoInput] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [criandoEspaco, setCriandoEspaco] = useState(false);
  const [tarefas, setTarefas] = useState([]);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const nomeInputRef = useRef(null);
  const espacoInputRef = useRef(null);
  const tarefaInputRef = useRef(null);

  useEffect(() => {
    if (passo === 1) setTimeout(() => nomeInputRef.current?.focus(), 100);
    if (passo === 3) setTimeout(() => tarefaInputRef.current?.focus(), 100);
  }, [passo]);

  async function handleSalvarPerfil() {
    setSalvandoPerfil(true);
    if (nome.trim()) await onSaveNome(nome.trim());
    if (area.trim()) await onSaveArea(area.trim());
    setSalvandoPerfil(false);
    setPasso(2);
  }

  async function handleCriarEspaco(nomeEspaco) {
    const texto = (nomeEspaco ?? novoEspacoInput).trim();
    if (!texto || criandoEspaco) return;
    setCriandoEspaco(true);
    const cor = CORES_ESPACO[espacosCriados.length % CORES_ESPACO.length];
    const { data, error } = await onCreateEspaco({ nome: texto, cor, logo_url: null });
    if (!error) {
      setEspacosCriados((prev) => [...prev, data]);
      setNovoEspacoInput('');
    }
    setCriandoEspaco(false);
  }

  async function handleRemoverEspaco(espaco) {
    setEspacosCriados((prev) => prev.filter((e) => e.id !== espaco.id));
    await onDeleteEspaco(espaco.id);
  }

  const nomesJaCriados = espacosCriados.map((e) => e.nome.toLowerCase());

  function adicionarTarefa(titulo) {
    const texto = titulo ?? input;
    if (!texto.trim()) return;
    setTarefas((prev) => [...prev, texto.trim()]);
    setInput('');
    tarefaInputRef.current?.focus();
  }

  function removerTarefa(idx) {
    setTarefas((prev) => prev.filter((_, i) => i !== idx));
  }

  async function finalizar() {
    setSaving(true);
    await onCreateTasks(tarefas);
    setSaving(false);
    setPasso(4);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {passo === 0 && (
          <View style={styles.centerBlock}>
            <ViraLogoSpinner size={56} loop={false} />
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
            <Text style={styles.captureTitle}>Conta pra gente</Text>
            <Text style={styles.captureSubtitle}>
              Isso ajuda o Secretário a te entender melhor nas sugestões.
            </Text>

            <Text style={styles.fieldLabel}>Como podemos te chamar?</Text>
            <TextInput
              ref={nomeInputRef}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              onSubmitEditing={handleSalvarPerfil}
            />

            <Text style={styles.fieldLabel}>Com o que você trabalha ou estuda?</Text>
            <TextInput
              value={area}
              onChangeText={setArea}
              placeholder="Ex: farmácia, advocacia, estudante..."
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              onSubmitEditing={handleSalvarPerfil}
            />

            <Pressable
              onPress={handleSalvarPerfil}
              disabled={salvandoPerfil}
              style={[styles.primaryButton, styles.fullWidth, salvandoPerfil && styles.addButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>{salvandoPerfil ? 'Salvando...' : 'Continuar'}</Text>
            </Pressable>

            <Pressable onPress={() => setPasso(2)} style={styles.skipButton}>
              <Text style={styles.skipText}>Pular por agora</Text>
            </Pressable>
          </View>
        )}

        {passo === 2 && (
          <View style={styles.captureBlock}>
            <Text style={styles.captureTitle}>Seus espaços</Text>
            <Text style={styles.captureSubtitle}>
              Espaços organizam suas tarefas por área da vida — trabalho, pessoal, o que fizer sentido.
            </Text>

            <View style={styles.sugestoesRow}>
              {ESPACOS_SUGERIDOS.filter((s) => !nomesJaCriados.includes(s.toLowerCase())).map((s) => (
                <Pressable key={s} onPress={() => handleCriarEspaco(s)} style={styles.sugestaoChip}>
                  <Text style={styles.sugestaoText}>+ {s}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                ref={espacoInputRef}
                value={novoEspacoInput}
                onChangeText={setNovoEspacoInput}
                placeholder="Outro espaço..."
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                onSubmitEditing={() => handleCriarEspaco()}
              />
              <Pressable
                onPress={() => handleCriarEspaco()}
                disabled={!novoEspacoInput.trim() || criandoEspaco}
                style={[styles.addButton, !novoEspacoInput.trim() && styles.addButtonDisabled]}
              >
                <Plus size={18} color={COLORS.accent} />
              </Pressable>
            </View>

            {espacosCriados.length > 0 && (
              <View style={styles.listaBlock}>
                {espacosCriados.map((e) => (
                  <View key={e.id} style={styles.tarefaRow}>
                    <View style={styles.espacoPreview}>
                      <View style={[styles.espacoDot, { backgroundColor: e.cor }]} />
                      <Text style={styles.tarefaText}>{e.nome}</Text>
                    </View>
                    <Pressable onPress={() => handleRemoverEspaco(e)}>
                      <Text style={styles.removerText}>remover</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Pressable style={[styles.primaryButton, styles.fullWidth]} onPress={() => setPasso(3)}>
              <Text style={styles.primaryButtonText}>
                {espacosCriados.length === 0 ? 'Continuar sem espaços' : 'Continuar'}
              </Text>
            </Pressable>
          </View>
        )}

        {passo === 3 && (
          <View style={styles.captureBlock}>
            <Text style={styles.captureTitle}>O que tá pendente agora?</Text>
            <Text style={styles.captureSubtitle}>Joga 2 ou 3 coisas que você precisa lembrar. Sem enrolação.</Text>

            <View style={styles.inputRow}>
              <TextInput
                ref={tarefaInputRef}
                value={input}
                onChangeText={setInput}
                placeholder="Ex: ligar pro fornecedor"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                onSubmitEditing={() => adicionarTarefa()}
              />
              <Pressable onPress={() => adicionarTarefa()} disabled={!input.trim()} style={[styles.addButton, !input.trim() && styles.addButtonDisabled]}>
                <Plus size={18} color={COLORS.accent} />
              </Pressable>
            </View>

            {tarefas.length === 0 && (
              <View style={styles.sugestoesRow}>
                {SUGESTOES_TAREFA.map((s) => (
                  <Pressable key={s} onPress={() => adicionarTarefa(s)} style={styles.sugestaoChip}>
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
                    <Pressable onPress={() => removerTarefa(i)}>
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

            <Pressable onPress={() => setPasso(4)} style={styles.skipButton}>
              <Text style={styles.skipText}>Pular por agora</Text>
            </Pressable>
          </View>
        )}

        {passo === 4 && (
          <View style={styles.centerBlock}>
            <ViraLogoSpinner size={48} loop={false} />
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
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: -6,
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
  espacoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  espacoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
