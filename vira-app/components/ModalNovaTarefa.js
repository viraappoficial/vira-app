import { Flag, Home as HomeIcon, X } from 'lucide-react-native';
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
import { COLORS } from '../lib/theme';

const PRIORIDADES = [
  { id: 'baixa', cor: COLORS.fazer },
  { id: 'media', cor: COLORS.andamento },
  { id: 'alta', cor: COLORS.atrasado },
];

function formatHoraInput(text, previous) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  // evita reformatar quando o usuário está apagando o ":"
  if (previous.length === 3 && text.length === 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export default function ModalNovaTarefa({ visible, espacosList, modelosList, onClose, onCreate }) {
  const [titulo, setTitulo] = useState('');
  const [espacoId, setEspacoId] = useState(null);
  const [prioridade, setPrioridade] = useState('media');
  const [hora, setHora] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTitulo('');
      setEspacoId(null);
      setPrioridade('media');
      setHora('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  function aplicarModelo(m) {
    setTitulo(m.titulo_padrao);
    setEspacoId(m.espaco_id);
    setHora(m.hora_padrao ? m.hora_padrao.slice(0, 5) : '');
  }

  async function handleCriar() {
    if (!titulo.trim() || saving) return;
    setSaving(true);
    const horaValida = /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora) ? hora : null;
    await onCreate({
      titulo: titulo.trim(),
      espaco_id: espacoId,
      prioridade,
      hora: horaValida,
    });
    setSaving(false);
  }

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Nova tarefa</Text>
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
            onSubmitEditing={handleCriar}
          />

          {modelosList.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelosRow}>
              {modelosList.map((m) => (
                <Pressable key={m.id} onPress={() => aplicarModelo(m)} style={styles.modeloChip}>
                  <Text style={styles.modeloChipText}>{m.titulo_padrao}</Text>
                </Pressable>
              ))}
            </ScrollView>
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

          <Pressable
            onPress={handleCriar}
            disabled={!titulo.trim() || saving}
            style={[styles.button, (!titulo.trim() || saving) && styles.buttonDisabled]}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.buttonText}>Criar tarefa</Text>
            )}
          </Pressable>
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
  modelosRow: {
    marginBottom: 16,
  },
  modeloChip: {
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
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
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
});
