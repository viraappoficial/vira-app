import { RotateCcw, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import EspacoCapsula from './EspacoCapsula';
import ViraLogo from './ViraLogo';
import { formatDiaRelativo } from '../lib/calendario';
import { COLORS, PRIORIDADE_COLORS, PRIORIDADE_LABELS } from '../lib/theme';

export default function ModalHistorico({ visible, tasks, espacos, onClose, onRestore, onEditTask }) {
  const dias = useMemo(() => {
    const grupos = {};
    tasks.forEach((t) => {
      if (t.status !== 'concluido' || !t.concluido_em) return;
      const dia = t.concluido_em.slice(0, 10);
      if (!grupos[dia]) grupos[dia] = [];
      grupos[dia].push(t);
    });
    return Object.keys(grupos)
      .sort((a, b) => b.localeCompare(a))
      .map((dia) => ({
        dia,
        tarefas: grupos[dia].sort((a, b) => b.concluido_em.localeCompare(a.concluido_em)),
      }));
  }, [tasks]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Histórico</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {dias.length === 0 ? (
          <View style={styles.empty}>
            <ViraLogo size={36} />
            <Text style={styles.emptyText}>Nada concluído ainda.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {dias.map(({ dia, tarefas }) => (
              <View key={dia} style={styles.diaGrupo}>
                <View style={styles.diaHeadRow}>
                  <Text style={styles.diaLabel}>{formatDiaRelativo(dia)}</Text>
                  <Text style={styles.diaCount}>
                    {tarefas.length} concluída{tarefas.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {tarefas.map((item) => {
                  const espaco = espacos[item.espaco_id];
                  return (
                    <View key={item.id} style={styles.item}>
                      <Pressable style={styles.itemInfo} onPress={() => onEditTask(item)}>
                        <View style={styles.itemTitleRow}>
                          <View
                            style={[
                              styles.priorityDot,
                              { backgroundColor: PRIORIDADE_COLORS[item.prioridade] || PRIORIDADE_COLORS.media },
                            ]}
                            accessibilityLabel={PRIORIDADE_LABELS[item.prioridade]}
                          />
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.titulo}
                          </Text>
                        </View>
                        <View style={styles.itemMeta}>
                          <EspacoCapsula espaco={espaco} small />
                          {item.hora && <Text style={styles.itemHora}>{item.hora.slice(0, 5)}</Text>}
                        </View>
                      </Pressable>
                      <Pressable onPress={() => onRestore(item.id)} style={styles.restoreButton} hitSlop={8}>
                        <RotateCcw size={12} color={COLORS.accent} />
                        <Text style={styles.restoreText}>Restaurar</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
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
    maxWidth: 440,
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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
    opacity: 0.8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  list: {
    flexGrow: 0,
  },
  diaGrupo: {
    marginBottom: 18,
  },
  diaHeadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  diaLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  diaCount: {
    color: COLORS.textSecondary,
    fontSize: 11,
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
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    minWidth: 0,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'line-through',
    flexShrink: 1,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemHora: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  restoreText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
});
