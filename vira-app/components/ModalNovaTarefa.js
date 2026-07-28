import { Flag, Home as HomeIcon, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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

export default function ModalNovaTarefa({ visible, espacosList, onClose, onCreate }) {
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
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
                  <TextInput
                    value={hora}
                    onChangeText={setHora}
                    placeholder="HH:MM"
                    placeholderTextColor={COLORS.textSecondary}
                    style={styles.horaInput}
                    maxLength={5}
                  />
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
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
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
