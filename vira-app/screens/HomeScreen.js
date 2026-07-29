import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import EspacoCapsula from '../components/EspacoCapsula';
import ViraLogo from '../components/ViraLogo';
import { COMPLETE_MESSAGES, EMPTY_MESSAGES, GREETINGS, SUBTITLES, pickRandom } from '../lib/copy';
import { COLORS, PRIORIDADE_COLORS, PRIORIDADE_LABELS } from '../lib/theme';

const STATUS_CONFIG = {
  fazer: { label: 'A fazer', color: COLORS.fazer, Icon: Circle },
  andamento: { label: 'Em andamento', color: COLORS.andamento, Icon: Clock },
  concluido: { label: 'Concluído', color: COLORS.concluido, Icon: CheckCircle2 },
  atrasado: { label: 'Atrasado', color: COLORS.atrasado, Icon: AlertTriangle },
};

export default function HomeScreen({ userName, tasks, espacos, refreshing, onRefresh, onToggle, onEditTask }) {
  const [justCompletedId, setJustCompletedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showConcluidas, setShowConcluidas] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 720;

  const greeting = useMemo(() => `${pickRandom(GREETINGS)}, ${userName}`, [userName]);
  const subtitle = useMemo(() => pickRandom(SUBTITLES), []);
  const emptyMsg = useMemo(() => pickRandom(EMPTY_MESSAGES), []);
  const dataHoje = useMemo(
    () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
    []
  );

  const pendentesList = useMemo(() => tasks.filter((t) => t.status !== 'concluido'), [tasks]);
  const pendentes = pendentesList.length;
  const atrasadas = pendentesList.filter((t) => t.status === 'atrasado').length;

  const ordenadas = useMemo(
    () =>
      [...pendentesList].sort((a, b) => {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
      }),
    [pendentesList]
  );

  const concluidasList = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'concluido')
        .sort((a, b) => (b.concluido_em || '').localeCompare(a.concluido_em || '')),
    [tasks]
  );

  async function handleToggle(task, event) {
    if (task.status !== 'concluido') {
      setJustCompletedId(task.id);
      setToast(pickRandom(COMPLETE_MESSAGES));
      setTimeout(() => setToast(null), 1600);
    }
    const origin = event?.nativeEvent
      ? { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
      : null;
    await onToggle(task, origin);
  }

  function renderTaskRow(item, { concluida } = {}) {
    const cfg = STATUS_CONFIG[item.status];
    const espaco = espacos[item.espaco_id];
    const isJustCompleted = item.id === justCompletedId;
    return (
      <View
        key={item.id}
        style={[
          styles.taskRow,
          {
            borderColor: item.status === 'atrasado' ? `${COLORS.atrasado}55` : COLORS.border,
            transform: [{ scale: isJustCompleted ? 1.02 : 1 }],
          },
          concluida && styles.taskRowConcluida,
        ]}
      >
        <Pressable onPress={(e) => handleToggle(item, e)} hitSlop={8}>
          <cfg.Icon size={22} color={cfg.color} strokeWidth={2} />
        </Pressable>
        <Pressable style={styles.taskInfo} onPress={() => onEditTask(item)}>
          <View style={styles.taskTitleRow}>
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: PRIORIDADE_COLORS[item.prioridade] || PRIORIDADE_COLORS.media },
              ]}
              accessibilityLabel={PRIORIDADE_LABELS[item.prioridade]}
            />
            <Text style={[styles.taskTitle, concluida && styles.taskTitleConcluida]} numberOfLines={1}>
              {item.titulo}
            </Text>
          </View>
          {item.descricao && (
            <Text style={styles.taskDescricao} numberOfLines={1}>
              {item.descricao}
            </Text>
          )}
          <View style={styles.taskMeta}>
            <EspacoCapsula espaco={espaco} small />
            {item.hora && <Text style={styles.taskHora}>{item.hora.slice(0, 5)}</Text>}
          </View>
        </Pressable>
        {concluida && (
          <Pressable onPress={(e) => handleToggle(item, e)} hitSlop={8} style={styles.restaurarButton}>
            <Text style={styles.restaurarText}>Restaurar</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ordenadas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, isWide && styles.listContentWide]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.date}>{dataHoje}</Text>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subtitle}>{pendentes > 0 ? subtitle : 'Nada por aqui hoje.'}</Text>

            {pendentes > 0 && (
              <View style={styles.chips}>
                <View style={[styles.chip, { backgroundColor: COLORS.accentSoft }]}>
                  <Text style={[styles.chipText, { color: COLORS.accent }]}>
                    {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                  </Text>
                </View>
                {atrasadas > 0 && (
                  <View style={[styles.chip, { backgroundColor: `${COLORS.atrasado}22` }]}>
                    <Text style={[styles.chipText, { color: COLORS.atrasado }]}>
                      {atrasadas} atrasada{atrasadas !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <ViraLogo size={40} />
            <Text style={styles.emptyText}>{emptyMsg}</Text>
          </View>
        }
        renderItem={({ item }) => renderTaskRow(item)}
        ListFooterComponent={
          concluidasList.length > 0 ? (
            <View style={styles.concluidasSection}>
              <Pressable style={styles.concluidasToggle} onPress={() => setShowConcluidas((v) => !v)}>
                <CheckCircle2 size={14} color={COLORS.textSecondary} />
                <Text style={styles.concluidasToggleText}>
                  {showConcluidas ? 'Esconder concluídas' : `Ver concluídas (${concluidasList.length})`}
                </Text>
                {showConcluidas ? (
                  <ChevronDown size={14} color={COLORS.textSecondary} />
                ) : (
                  <ChevronRight size={14} color={COLORS.textSecondary} />
                )}
              </Pressable>
              {showConcluidas && concluidasList.map((item) => renderTaskRow(item, { concluida: true }))}
            </View>
          ) : null
        }
      />

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  listContentWide: {
    maxWidth: 720,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  date: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  greeting: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
    opacity: 0.8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
    minWidth: 0,
  },
  taskTitleRow: {
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
  taskTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  taskDescricao: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskHora: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  taskRowConcluida: {
    opacity: 0.6,
  },
  taskTitleConcluida: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  restaurarButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  restaurarText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  concluidasSection: {
    marginTop: 8,
  },
  concluidasToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 4,
  },
  concluidasToggleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  toast: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastText: {
    color: COLORS.concluido,
    fontSize: 14,
    fontWeight: '500',
  },
});
