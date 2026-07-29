import { Home as HomeIcon, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../lib/theme';

export default function ModalEspacos({ visible, espacosList, nome, onSaveNome, onClose, onSelect, onNew }) {
  const [nomeInput, setNomeInput] = useState(nome || '');

  if (!visible) return null;

  function handleBlurNome() {
    const trimmed = nomeInput.trim();
    if (trimmed && trimmed !== nome) onSaveNome(trimmed);
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Espaços</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.nomeField}>
          <Text style={styles.nomeLabel}>Como podemos te chamar?</Text>
          <TextInput
            value={nomeInput}
            onChangeText={setNomeInput}
            onBlur={handleBlurNome}
            placeholder="Seu nome"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.nomeInput}
          />
        </View>

        {espacosList.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum espaço ainda — crie o primeiro abaixo.</Text>
        ) : (
          <View style={styles.list}>
            {espacosList.map((e) => (
              <Pressable key={e.id} onPress={() => onSelect(e)} style={styles.item}>
                <View style={[styles.itemIcon, { backgroundColor: `${e.cor}22` }]}>
                  {e.icone === 'casa' ? (
                    <HomeIcon size={14} color={e.cor} />
                  ) : (
                    <Text style={[styles.itemIconText, { color: e.cor }]}>{e.nome[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.itemText}>{e.nome}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={onNew} style={styles.newButton}>
          <Plus size={16} color={COLORS.accent} />
          <Text style={styles.newButtonText}>Novo espaço</Text>
        </Pressable>
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
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  nomeField: {
    marginBottom: 16,
  },
  nomeLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  nomeInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
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
  itemIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
  },
  newButtonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
});
