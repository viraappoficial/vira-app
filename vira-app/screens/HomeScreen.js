import { AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import EspacoCapsula from '../components/EspacoCapsula';
import ViraLogo from '../components/ViraLogo';
import { COMPLETE_MESSAGES, EMPTY_MESSAGES, GREETINGS, SUBTITLES, pickRandom } from '../lib/copy';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';

const STATUS_CONFIG = {
  fazer: { label: 'A fazer', color: COLORS.fazer, Icon: Circle },
  andamento: { label: 'Em andamento', color: COLORS.andamento, Icon: Clock },
  concluido: { label: 'Concluído', color: COLORS.concluido, Icon: CheckCircle2 },
  atrasado: { label: 'Atrasado', color: COLORS.atrasado, Icon: AlertTriangle },
};

export default function HomeScreen({ userName, onSignOut }) {
  const [espacos, setEspacos] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState(null);
  const [toast, setToast] = useState(null);

  const greeting = useMemo(() => `${pickRandom(GREETINGS)}, ${userName}`, [userName]);
  const subtitle = useMemo(() => pickRandom(SUBTITLES), []);
  const emptyMsg = useMemo(() => pickRandom(EMPTY_MESSAGES), []);
  const dataHoje = useMemo(
    () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
    []
  );

  const loadData = useCallback(async () => {
    const [espacosRes, tarefasRes] = await Promise.all([
      supabase.from('espacos').select('*'),
      supabase.from('tarefas').select('*').neq('status', 'concluido').order('data_prevista', { ascending: true }),
    ]);

    if (!espacosRes.error) {
      const map = {};
      espacosRes.data.forEach((e) => {
        map[e.id] = e;
      });
      setEspacos(map);
    }
    if (!tarefasRes.error) {
      setTasks(tarefasRes.data);
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleToggle(task) {
    const novoStatus = task.status === 'concluido' ? 'fazer' : 'concluido';
    setTasks((prev) =>
      novoStatus === 'concluido' ? prev.filter((t) => t.id !== task.id) : prev
    );
    if (novoStatus === 'concluido') {
      setJustCompletedId(task.id);
      setToast(pickRandom(COMPLETE_MESSAGES));
      setTimeout(() => setToast(null), 1600);
    }
    const { error } = await supabase
      .from('tarefas')
      .update({
        status: novoStatus,
        concluido_em: novoStatus === 'concluido' ? new Date().toISOString() : null,
      })
      .eq('id', task.id);
    if (error) {
      await loadData();
    }
  }

  const pendentes = tasks.length;
  const atrasadas = tasks.filter((t) => t.status === 'atrasado').length;

  const ordenadas = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
      }),
    [tasks]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ordenadas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <ViraLogo size={20} />
              <Pressable onPress={onSignOut}>
                <Text style={styles.signOut}>Sair</Text>
              </Pressable>
            </View>
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
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status];
          const espaco = espacos[item.espaco_id];
          const isJustCompleted = item.id === justCompletedId;
          return (
            <View
              style={[
                styles.taskRow,
                {
                  borderColor: item.status === 'atrasado' ? `${COLORS.atrasado}55` : COLORS.border,
                  transform: [{ scale: isJustCompleted ? 1.02 : 1 }],
                },
              ]}
            >
              <Pressable onPress={() => handleToggle(item)} hitSlop={8}>
                <cfg.Icon size={22} color={cfg.color} strokeWidth={2} />
              </Pressable>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {item.titulo}
                </Text>
                <View style={styles.taskMeta}>
                  <EspacoCapsula espaco={espaco} small />
                  {item.hora && <Text style={styles.taskHora}>{item.hora.slice(0, 5)}</Text>}
                </View>
              </View>
            </View>
          );
        }}
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
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  signOut: {
    color: COLORS.textSecondary,
    fontSize: 12,
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
  taskTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
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
