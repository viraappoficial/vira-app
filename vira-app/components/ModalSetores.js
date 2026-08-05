import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock, Copy, Plus, UserMinus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  atualizarMembro,
  atualizarSetor,
  criarConvite,
  criarSetor,
  linkConvite,
  listarMembros,
  listarSetores,
  listarTarefasDoSetor,
} from '../lib/organizacao';
import { COLORS } from '../lib/theme';

const CORES_SUGERIDAS = ['#5B8CFF', '#3FAE72', '#8E6FE8', '#E86F9C', '#D9A544'];

const STATUS_ICON = {
  fazer: { Icon: Circle, color: COLORS.fazer },
  andamento: { Icon: Clock, color: COLORS.andamento },
  concluido: { Icon: CheckCircle2, color: COLORS.concluido },
  atrasado: { Icon: AlertTriangle, color: COLORS.atrasado },
};

function profundidade(caminho) {
  if (!caminho) return 0;
  return caminho.split('.').length - 1;
}

function SetorRow({ setor, organizacaoId, userId, todosSetores, aberto, onToggle, onSalvo }) {
  const [nome, setNome] = useState(setor.nome);
  const [cor, setCor] = useState(setor.cor);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [tarefas, setTarefas] = useState(null);
  const [linkGerado, setLinkGerado] = useState(null);
  const [gerandoConvite, setGerandoConvite] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [membros, setMembros] = useState(null);
  const [movendoId, setMovendoId] = useState(null);
  const [movendoPara, setMovendoPara] = useState(null);

  function recarregarMembros() {
    listarMembros(organizacaoId)
      .then((todos) => setMembros(todos.filter((m) => m.setor_id === setor.id)))
      .catch(() => setMembros([]));
  }

  useEffect(() => {
    if (!aberto) return;
    setNome(setor.nome);
    setCor(setor.cor);
    setLinkGerado(null);
    setMovendoId(null);
    listarTarefasDoSetor(setor.id, organizacaoId)
      .then(setTarefas)
      .catch(() => setTarefas([]));
    recarregarMembros();
  }, [aberto, setor.id, organizacaoId]);

  async function handleMoverMembro(usuarioId, novoSetorId) {
    setErro(null);
    try {
      await atualizarMembro(organizacaoId, usuarioId, { setorId: novoSetorId });
      setMovendoId(null);
      recarregarMembros();
    } catch (e) {
      setErro(e.message || 'Não deu pra mover esse membro agora.');
    }
  }

  async function handleRemoverMembro(usuarioId) {
    setErro(null);
    try {
      await atualizarMembro(organizacaoId, usuarioId, { status: 'inativo' });
      recarregarMembros();
    } catch (e) {
      setErro(e.message || 'Não deu pra remover esse membro agora.');
    }
  }

  async function handleSalvar() {
    if (!nome.trim() || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await atualizarSetor(setor.id, { nome: nome.trim(), cor });
      onSalvo();
    } catch (e) {
      setErro(e.message || 'Não deu pra salvar agora.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleConvidar() {
    if (gerandoConvite) return;
    setGerandoConvite(true);
    setErro(null);
    try {
      const convite = await criarConvite({ organizacaoId, setorId: setor.id, criadoPor: userId });
      setLinkGerado(linkConvite(convite.token));
      setLinkCopiado(false);
    } catch (e) {
      setErro(e.message || 'Não deu pra gerar o convite agora.');
    } finally {
      setGerandoConvite(false);
    }
  }

  async function handleCopiar() {
    if (!linkGerado) return;
    try {
      await navigator.clipboard.writeText(linkGerado);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // link continua visível na tela pra copiar manualmente
    }
  }

  return (
    <View style={[styles.setorWrap, { marginLeft: profundidade(setor.caminho) * 16 }]}>
      <Pressable onPress={onToggle} style={styles.setorHeader}>
        {aberto ? (
          <ChevronDown size={14} color={COLORS.textSecondary} />
        ) : (
          <ChevronRight size={14} color={COLORS.textSecondary} />
        )}
        <View style={[styles.setorDot, { backgroundColor: setor.cor }]} />
        <Text style={styles.setorNome}>{setor.nome}</Text>
      </Pressable>

      {aberto && (
        <View style={styles.setorBody}>
          <Text style={styles.label}>Nome do setor</Text>
          <TextInput value={nome} onChangeText={setNome} style={styles.input} placeholderTextColor={COLORS.textSecondary} />

          <Text style={styles.label}>Cor</Text>
          <View style={styles.coresRow}>
            {CORES_SUGERIDAS.map((c) => (
              <Pressable key={c} onPress={() => setCor(c)} style={[styles.corSwatch, { backgroundColor: c }]}>
                {cor === c && <Check size={11} color={COLORS.bg} strokeWidth={3} />}
              </Pressable>
            ))}
          </View>

          {erro && <Text style={styles.erro}>{erro}</Text>}

          <Pressable onPress={handleSalvar} disabled={salvando} style={styles.salvarButton}>
            {salvando ? <ActivityIndicator color={COLORS.bg} size="small" /> : <Text style={styles.salvarButtonText}>Salvar</Text>}
          </Pressable>

          {!linkGerado ? (
            <Pressable onPress={handleConvidar} disabled={gerandoConvite} style={styles.convidarButton}>
              <Text style={styles.convidarButtonText}>
                {gerandoConvite ? 'Gerando link...' : `Convidar pra ${setor.nome}`}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.conviteLinkBox}>
              <Text style={styles.conviteLinkText} numberOfLines={1}>
                {linkGerado}
              </Text>
              <Pressable onPress={handleCopiar} style={styles.copyButton} hitSlop={6}>
                <Copy size={12} color={COLORS.accent} />
                <Text style={styles.copyButtonText}>{linkCopiado ? 'Copiado!' : 'Copiar'}</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.tarefasLabel}>Membros desse setor</Text>
          {membros === null ? (
            <ActivityIndicator color={COLORS.textSecondary} size="small" />
          ) : membros.length === 0 ? (
            <Text style={styles.tarefasVazio}>Ninguém nesse setor ainda.</Text>
          ) : (
            membros.map((m) => (
              <View key={m.usuario_id} style={styles.membroRow}>
                <View style={styles.membroInfo}>
                  <Text style={styles.membroNome} numberOfLines={1}>
                    {m.nome_exibicao || 'Alguém do time'}
                  </Text>
                  <Text style={styles.membroPapel}>{m.papel}</Text>
                </View>
                {m.usuario_id !== userId && (
                  <View style={styles.membroAcoes}>
                    {movendoId === m.usuario_id ? (
                      <View style={styles.moverRow}>
                        {(todosSetores || [])
                          .filter((s) => s.id !== setor.id)
                          .map((s) => (
                            <Pressable
                              key={s.id}
                              onPress={() => handleMoverMembro(m.usuario_id, s.id)}
                              style={styles.paiChip}
                            >
                              <Text style={styles.paiChipText}>{s.nome}</Text>
                            </Pressable>
                          ))}
                        <Pressable onPress={() => setMovendoId(null)} hitSlop={6}>
                          <X size={13} color={COLORS.textSecondary} />
                        </Pressable>
                      </View>
                    ) : (
                      <>
                        <Pressable onPress={() => setMovendoId(m.usuario_id)} hitSlop={6}>
                          <Text style={styles.moverButtonText}>Mover</Text>
                        </Pressable>
                        <Pressable onPress={() => handleRemoverMembro(m.usuario_id)} hitSlop={6}>
                          <UserMinus size={14} color={COLORS.atrasado} />
                        </Pressable>
                      </>
                    )}
                  </View>
                )}
              </View>
            ))
          )}

          <Text style={styles.tarefasLabel}>Tarefas nesse setor</Text>
          {tarefas === null ? (
            <ActivityIndicator color={COLORS.textSecondary} size="small" />
          ) : tarefas.length === 0 ? (
            <Text style={styles.tarefasVazio}>Nada por aqui ainda.</Text>
          ) : (
            tarefas.map((t) => {
              const cfg = STATUS_ICON[t.status] || STATUS_ICON.fazer;
              return (
                <View key={t.id} style={styles.tarefaRow}>
                  <cfg.Icon size={13} color={cfg.color} />
                  <Text style={styles.tarefaTitulo} numberOfLines={1}>
                    {t.titulo}
                  </Text>
                  <Text style={styles.tarefaResponsavel}>{t.nome_responsavel}</Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

export default function ModalSetores({ visible, organizacao, userId, onClose }) {
  const [setores, setSetores] = useState(null);
  const [abertoId, setAbertoId] = useState(null);
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoPaiId, setNovoPaiId] = useState(null);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [erroNovo, setErroNovo] = useState(null);

  function recarregar() {
    if (!organizacao) return;
    listarSetores(organizacao.id)
      .then(setSetores)
      .catch(() => setSetores([]));
  }

  useEffect(() => {
    if (!visible) return;
    setCriando(false);
    setNovoNome('');
    setNovoPaiId(null);
    recarregar();
  }, [visible, organizacao?.id]);

  if (!visible || !organizacao) return null;

  async function handleCriarSetor() {
    if (!novoNome.trim() || salvandoNovo) return;
    setSalvandoNovo(true);
    setErroNovo(null);
    try {
      await criarSetor({
        organizacaoId: organizacao.id,
        setorPaiId: novoPaiId,
        nome: novoNome.trim(),
        cor: CORES_SUGERIDAS[(setores?.length || 0) % CORES_SUGERIDAS.length],
        criadoPor: userId,
      });
      setCriando(false);
      setNovoNome('');
      setNovoPaiId(null);
      recarregar();
    } catch (e) {
      setErroNovo(e.message || 'Não deu pra criar o setor agora.');
    } finally {
      setSalvandoNovo(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Setores — {organizacao.nome}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll}>
          {setores === null ? (
            <ActivityIndicator color={COLORS.textSecondary} />
          ) : (
            setores.map((setor) => (
              <SetorRow
                key={setor.id}
                setor={setor}
                organizacaoId={organizacao.id}
                userId={userId}
                todosSetores={setores}
                aberto={abertoId === setor.id}
                onToggle={() => setAbertoId(abertoId === setor.id ? null : setor.id)}
                onSalvo={recarregar}
              />
            ))
          )}

          {criando ? (
            <View style={styles.novoSetorBox}>
              <Text style={styles.label}>Nome do novo setor</Text>
              <TextInput
                value={novoNome}
                onChangeText={setNovoNome}
                placeholder="Ex: Vendas"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
              />
              <Text style={styles.label}>Dentro de</Text>
              <View style={styles.paiRow}>
                {(setores || []).map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setNovoPaiId(s.id)}
                    style={[styles.paiChip, novoPaiId === s.id && styles.paiChipAtivo]}
                  >
                    <Text style={[styles.paiChipText, novoPaiId === s.id && styles.paiChipTextAtivo]}>{s.nome}</Text>
                  </Pressable>
                ))}
              </View>
              {erroNovo && <Text style={styles.erro}>{erroNovo}</Text>}
              <Pressable onPress={handleCriarSetor} disabled={!novoNome.trim() || salvandoNovo} style={styles.salvarButton}>
                {salvandoNovo ? (
                  <ActivityIndicator color={COLORS.bg} size="small" />
                ) : (
                  <Text style={styles.salvarButtonText}>Criar setor</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setCriando(true)} style={styles.novoButton}>
              <Plus size={14} color={COLORS.accent} />
              <Text style={styles.novoButtonText}>Novo setor</Text>
            </Pressable>
          )}
        </ScrollView>
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
    justifyContent: 'center',
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    maxWidth: 420,
    width: '92%',
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  scroll: {
    flexGrow: 0,
  },
  setorWrap: {
    marginBottom: 8,
  },
  setorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  setorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  setorNome: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '500',
  },
  setorBody: {
    padding: 12,
    paddingTop: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 12,
  },
  coresRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  corSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  erro: {
    color: COLORS.atrasado,
    fontSize: 11.5,
    marginBottom: 8,
  },
  salvarButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 10,
  },
  salvarButtonText: {
    color: COLORS.bg,
    fontSize: 12.5,
    fontWeight: '600',
  },
  convidarButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 14,
  },
  convidarButtonText: {
    color: COLORS.accent,
    fontSize: 12.5,
    fontWeight: '500',
  },
  conviteLinkBox: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 8,
    gap: 6,
    marginBottom: 14,
  },
  conviteLinkText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 8,
    paddingVertical: 6,
  },
  copyButtonText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  tarefasLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  membroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
  },
  membroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  membroNome: {
    color: COLORS.text,
    fontSize: 12.5,
    flexShrink: 1,
  },
  membroPapel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  membroAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moverButtonText: {
    color: COLORS.accent,
    fontSize: 11.5,
    fontWeight: '500',
  },
  moverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tarefasVazio: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
  },
  tarefaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
  },
  tarefaTitulo: {
    color: COLORS.text,
    fontSize: 12,
    flex: 1,
  },
  tarefaResponsavel: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
  },
  novoSetorBox: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  paiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  paiChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  paiChipAtivo: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  paiChipText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
  },
  paiChipTextAtivo: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  novoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  novoButtonText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '500',
  },
});
