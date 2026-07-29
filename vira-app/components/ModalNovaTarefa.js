import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Home as HomeIcon,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DatePickerPopover from './DatePickerPopover';
import { formatDiaCurto, todayIso } from '../lib/calendario';
import { chamarSecretario } from '../lib/secretario';
import { COLORS, PRIORIDADE_COLORS } from '../lib/theme';

const PRIORIDADES = [
  { id: 'baixa', cor: PRIORIDADE_COLORS.baixa },
  { id: 'media', cor: PRIORIDADE_COLORS.media },
  { id: 'alta', cor: PRIORIDADE_COLORS.alta },
];

const STATUS_ORDER = ['fazer', 'andamento', 'concluido', 'atrasado'];
const STATUS_CONFIG = {
  fazer: { label: 'A fazer', color: COLORS.fazer, Icon: Circle },
  andamento: { label: 'Em andamento', color: COLORS.andamento, Icon: Clock },
  concluido: { label: 'Concluído', color: COLORS.concluido, Icon: CheckCircle2 },
  atrasado: { label: 'Atrasado', color: COLORS.atrasado, Icon: AlertTriangle },
};

function formatHoraInput(text, previous) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  // evita reformatar quando o usuário está apagando o ":"
  if (previous.length === 3 && text.length === 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export default function ModalNovaTarefa({
  visible,
  task,
  espacosList,
  modelosList,
  defaultDate,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onSaveModelo,
  onDeleteModelo,
}) {
  const isEdit = !!task;
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [espacoId, setEspacoId] = useState(null);
  const [prioridade, setPrioridade] = useState('media');
  const [hora, setHora] = useState('');
  const [status, setStatus] = useState('fazer');
  const [dataPrevista, setDataPrevista] = useState(todayIso());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [salvandoModelo, setSalvandoModelo] = useState(false);
  const [secretarioLoading, setSecretarioLoading] = useState(false);
  const [secretarioErro, setSecretarioErro] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setConfirmingDelete(false);
    setDatePickerOpen(false);
    if (task) {
      setTitulo(task.titulo || '');
      setDescricao(task.descricao || '');
      setEspacoId(task.espaco_id || null);
      setPrioridade(task.prioridade || 'media');
      setHora(task.hora ? task.hora.slice(0, 5) : '');
      setStatus(task.status || 'fazer');
      setDataPrevista(task.data_prevista || todayIso());
    } else {
      setTitulo('');
      setDescricao('');
      setEspacoId(null);
      setPrioridade('media');
      setHora('');
      setStatus('fazer');
      setDataPrevista(defaultDate || todayIso());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, task, defaultDate]);

  function aplicarModelo(m) {
    setTitulo(m.titulo_padrao);
    setEspacoId(m.espaco_id);
    setHora(m.hora_padrao ? m.hora_padrao.slice(0, 5) : '');
  }

  async function handleSecretario() {
    if (!titulo.trim() || secretarioLoading) return;
    setSecretarioLoading(true);
    setSecretarioErro(null);
    try {
      const resultado = await chamarSecretario(titulo.trim(), espacosList);
      setTitulo(resultado.titulo);
      if (resultado.data_prevista) setDataPrevista(resultado.data_prevista);
      if (resultado.hora) setHora(resultado.hora);
      if (resultado.espaco_id) setEspacoId(resultado.espaco_id);
      setPrioridade(resultado.prioridade);
    } catch (e) {
      setSecretarioErro(e.message);
      setTimeout(() => setSecretarioErro(null), 3000);
    } finally {
      setSecretarioLoading(false);
    }
  }

  async function handleSalvarModelo() {
    if (!titulo.trim() || salvandoModelo) return;
    setSalvandoModelo(true);
    const horaValida = /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora) ? hora : null;
    await onSaveModelo({ titulo_padrao: titulo.trim(), espaco_id: espacoId, hora_padrao: horaValida });
    setSalvandoModelo(false);
  }

  async function handleSalvar() {
    if (!titulo.trim() || saving) return;
    setSaving(true);
    const horaValida = /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora) ? hora : null;
    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      espaco_id: espacoId,
      prioridade,
      hora: horaValida,
      data_prevista: dataPrevista,
    };
    if (isEdit) {
      await onUpdate(task.id, { ...payload, status });
    } else {
      await onCreate(payload);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setSaving(true);
    await onDelete(task.id);
    setSaving(false);
  }

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            ref={inputRef}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="O que você precisa lembrar?"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            onSubmitEditing={handleSalvar}
          />

          {!isEdit && titulo.trim() && (
            <Pressable
              onPress={handleSecretario}
              disabled={secretarioLoading}
              style={[styles.secretarioButton, secretarioLoading && styles.buttonDisabled]}
            >
              {secretarioLoading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <Sparkles size={13} color={COLORS.accent} />
              )}
              <Text style={styles.secretarioButtonText}>
                {secretarioLoading ? 'Pensando...' : 'Preencher com Secretário'}
              </Text>
            </Pressable>
          )}
          {secretarioErro && <Text style={styles.secretarioErro}>{secretarioErro}</Text>}

          <TextInput
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Detalhes (opcional) — ex: levar boleto e RG"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.descricaoInput}
            multiline
          />

          {!isEdit && (modelosList.length > 0 || titulo.trim()) && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelosRow}>
              {modelosList.map((m) => (
                <View key={m.id} style={styles.modeloChip}>
                  <Pressable onPress={() => aplicarModelo(m)}>
                    <Text style={styles.modeloChipText}>{m.titulo_padrao}</Text>
                  </Pressable>
                  <Pressable onPress={() => onDeleteModelo(m.id)} hitSlop={6}>
                    <X size={11} color={COLORS.accent} />
                  </Pressable>
                </View>
              ))}
              {titulo.trim() && (
                <Pressable onPress={handleSalvarModelo} disabled={salvandoModelo} style={styles.modeloChipNovo}>
                  <Plus size={11} color={COLORS.textSecondary} />
                  <Text style={styles.modeloChipNovoText}>Salvar como atalho</Text>
                </Pressable>
              )}
            </ScrollView>
          )}

          <Text style={styles.label}>
            <Calendar size={11} color={COLORS.textSecondary} /> Data
          </Text>
          <Pressable
            onPress={() => setDatePickerOpen((v) => !v)}
            style={[styles.datePill, dataPrevista === todayIso() && styles.datePillToday]}
          >
            <Text style={[styles.datePillText, dataPrevista === todayIso() && styles.datePillTextToday]}>
              {dataPrevista === todayIso() ? 'Hoje' : formatDiaCurto(dataPrevista)}
            </Text>
            <Calendar size={13} color={dataPrevista === todayIso() ? COLORS.accent : COLORS.textSecondary} />
          </Pressable>

          {datePickerOpen && (
            <DatePickerPopover
              value={dataPrevista}
              onSelect={setDataPrevista}
              onClose={() => setDatePickerOpen(false)}
            />
          )}

          {espacosList.length > 0 && (
            <>
              <Text style={styles.label}>Espaço</Text>
              <View style={styles.espacoRow}>
                {espacosList.map((e) => {
                  const active = espacoId === e.id;
                  return (
                    <Pressable
                      key={e.id}
                      onPress={() => setEspacoId(active ? null : e.id)}
                      style={[
                        styles.espacoChip,
                        {
                          backgroundColor: active ? `${e.cor}22` : 'transparent',
                          borderColor: active ? e.cor : COLORS.border,
                        },
                      ]}
                    >
                      {e.icone === 'casa' ? (
                        <HomeIcon size={11} color={active ? e.cor : COLORS.textSecondary} />
                      ) : (
                        <View style={[styles.espacoDot, { backgroundColor: e.cor }]}>
                          <Text style={styles.espacoDotText}>{e.nome[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={{ color: active ? e.cor : COLORS.textSecondary, fontSize: 12, fontWeight: '500' }}>
                        {e.nome}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>
                <Flag size={11} color={COLORS.textSecondary} /> Prioridade
              </Text>
              <View style={styles.prioridadeRow}>
                {PRIORIDADES.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setPrioridade(p.id)}
                    style={[
                      styles.prioridadeDot,
                      { backgroundColor: p.cor, opacity: prioridade === p.id ? 1 : 0.3 },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Horário (opcional)</Text>
              {Platform.OS === 'web' ? (
                // @ts-ignore — input HTML nativo, disponível via react-native-web
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  style={webTimeInputStyle}
                />
              ) : (
                <TextInput
                  value={hora}
                  onChangeText={(t) => setHora(formatHoraInput(t, hora))}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.textSecondary}
                  style={styles.horaInput}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              )}
            </View>
          </View>

          {isEdit && (
            <>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                {STATUS_ORDER.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const active = status === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[
                        styles.statusChip,
                        { backgroundColor: active ? `${cfg.color}22` : 'transparent', borderColor: active ? cfg.color : COLORS.border },
                      ]}
                    >
                      <cfg.Icon size={12} color={active ? cfg.color : COLORS.textSecondary} />
                      <Text style={{ color: active ? cfg.color : COLORS.textSecondary, fontSize: 11, fontWeight: '500' }}>
                        {cfg.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Pressable
            onPress={handleSalvar}
            disabled={!titulo.trim() || saving}
            style={[styles.button, (!titulo.trim() || saving) && styles.buttonDisabled]}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.buttonText}>{isEdit ? 'Salvar alterações' : 'Criar tarefa'}</Text>
            )}
          </Pressable>

          {isEdit && (
            <Pressable onPress={handleDelete} disabled={saving} style={styles.deleteButton}>
              <Trash2 size={13} color={COLORS.atrasado} />
              <Text style={styles.deleteButtonText}>
                {confirmingDelete ? 'Toca de novo pra confirmar' : 'Excluir tarefa'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const webTimeInputStyle = {
  fontSize: 13,
  color: COLORS.text,
  backgroundColor: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 8,
  paddingBottom: 8,
  fontFamily: 'inherit',
  colorScheme: 'dark',
  width: '100%',
  boxSizing: 'border-box',
};

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
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 16,
  },
  secretarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.accentSoft,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  secretarioButtonText: {
    color: COLORS.accent,
    fontSize: 12.5,
    fontWeight: '600',
  },
  secretarioErro: {
    color: COLORS.atrasado,
    fontSize: 11.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  descricaoInput: {
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modelosRow: {
    marginBottom: 16,
  },
  modeloChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  modeloChipText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  modeloChipNovo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeloChipNovoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  datePillToday: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentSoft,
  },
  datePillText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  datePillTextToday: {
    color: COLORS.accent,
  },
  espacoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  espacoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  espacoDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  espacoDotText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.bg,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  rowItem: {
    flex: 1,
  },
  prioridadeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  prioridadeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  horaInput: {
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: COLORS.atrasado,
    fontSize: 13,
    fontWeight: '500',
  },
});
