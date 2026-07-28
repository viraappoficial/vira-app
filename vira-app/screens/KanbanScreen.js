import { AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import EspacoCapsula from '../components/EspacoCapsula';
import ViraLogo from '../components/ViraLogo';
import { EMPTY_MESSAGES, pickRandom } from '../lib/copy';
import { COLORS } from '../lib/theme';

const STATUS_ORDER = ['fazer', 'andamento', 'concluido', 'atrasado'];
const STATUS_CONFIG = {
  fazer: { label: 'A fazer', color: COLORS.fazer, Icon: Circle },
  andamento: { label: 'Em andamento', color: COLORS.andamento, Icon: Clock },
  concluido: { label: 'Concluído', color: COLORS.concluido, Icon: CheckCircle2 },
  atrasado: { label: 'Atrasado', color: COLORS.atrasado, Icon: AlertTriangle },
};

function StatusPicker({ task, onPick, onClose }) {
  return (
    <View style={styles.pickerOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <Text style={styles.pickerTitle} numberOfLines={1}>
          {task.titulo}
        </Text>
        {STATUS_ORDER.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const active = task.status === s;
          return (
            <Pressable
              key={s}
              onPress={() => onPick(s)}
              style={[styles.pickerOption, active && { borderColor: cfg.color, backgroundColor: `${cfg.color}18` }]}
            >
              <cfg.Icon size={16} color={cfg.color} />
              <Text style={[styles.pickerOptionText, active && { color: cfg.color }]}>{cfg.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function KanbanScreen({ tasks, espacos, onSetStatus, onVirarDia }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const emptyMsgByColumn = useMemo(() => {
    const map = {};
    STATUS_ORDER.forEach((s) => {
      map[s] = pickRandom(EMPTY_MESSAGES);
    });
    return map;
  }, []);

  const grouped = useMemo(() => {
    const acc = { fazer: [], andamento: [], concluido: [], atrasado: [] };
    tasks.forEach((t) => acc[t.status]?.push(t));
    return acc;
  }, [tasks]);

  function handlePick(status) {
    onSetStatus(selectedTask.id, status);
    setSelectedTask(null);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Board</Text>
          <Pressable style={styles.virarDiaButton} onPress={onVirarDia}>
            <Text style={styles.virarDiaText}>Virar o dia</Text>
          </Pressable>
        </View>

        {STATUS_ORDER.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const lista = grouped[s];
          return (
            <View key={s} style={styles.column}>
              <View style={styles.columnHeader}>
                <cfg.Icon size={14} color={cfg.color} />
                <Text style={styles.columnLabel}>{cfg.label}</Text>
                <Text style={styles.columnCount}>{lista.length}</Text>
              </View>

              {lista.length === 0 ? (
                <Text style={styles.emptyText}>{emptyMsgByColumn[s]}</Text>
              ) : (
                lista.map((t) => {
                  const espaco = espacos[t.espaco_id];
                  return (
                    <Pressable key={t.id} style={styles.card} onPress={() => setSelectedTask(t)}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {t.titulo}
                      </Text>
                      <View style={styles.cardMeta}>
                        <EspacoCapsula espaco={espaco} small />
                        {t.hora && <Text style={styles.cardHora}>{t.hora.slice(0, 5)}</Text>}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>

      {selectedTask && (
        <StatusPicker task={selectedTask} onPick={handlePick} onClose={() => setSelectedTask(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  virarDiaButton: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  virarDiaText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  column: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  columnLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  columnCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
    opacity: 0.7,
  },
  card: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHora: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  pickerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  pickerOptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
