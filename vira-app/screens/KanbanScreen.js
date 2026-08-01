import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock, Eye, EyeOff, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import EspacoCapsula from '../components/EspacoCapsula';
import ModalHistorico from '../components/ModalHistorico';
import ModalQuebrarTarefa from '../components/ModalQuebrarTarefa';
import ViraLogo from '../components/ViraLogo';
import { todayIso } from '../lib/calendario';
import { EMPTY_MESSAGES, pickRandom } from '../lib/copy';
import { ordenarPorPrioridade } from '../lib/priorizacao';
import { COLORS, PRIORIDADE_COLORS, PRIORIDADE_LABELS } from '../lib/theme';

const STATUS_ORDER = ['fazer', 'andamento', 'concluido', 'atrasado'];
const STATUS_CONFIG = {
  fazer: { label: 'A fazer', color: COLORS.fazer, Icon: Circle },
  andamento: { label: 'Em andamento', color: COLORS.andamento, Icon: Clock },
  concluido: { label: 'Concluído', color: COLORS.concluido, Icon: CheckCircle2 },
  atrasado: { label: 'Atrasado', color: COLORS.atrasado, Icon: AlertTriangle },
};

const IS_WEB = Platform.OS === 'web';

function rawColumnStyle(isOver, isWide) {
  return {
    backgroundColor: isOver ? COLORS.accentSoft : COLORS.surface,
    border: `1px solid ${isOver ? COLORS.accent : COLORS.border}`,
    borderRadius: '16px',
    padding: '12px',
    marginTop: isWide ? 0 : '12px',
    boxSizing: 'border-box',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    ...(isWide ? { flex: '1 1 0px', minWidth: 0 } : {}),
  };
}

function rawCardStyle(isDragging) {
  return {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: COLORS.bg,
    border: `1px solid ${isDragging ? COLORS.accent : COLORS.border}`,
    borderRadius: '12px',
    padding: '10px',
    marginBottom: '6px',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    opacity: isDragging ? 0.5 : 1,
    boxSizing: 'border-box',
    userSelect: 'none',
    transform: isDragging ? 'rotate(-2deg) scale(1.03)' : 'rotate(0deg) scale(1)',
    boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.45)' : 'none',
    transition: 'transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  };
}

function CardContent({ task, espaco, onQuebrar }) {
  return (
    <>
      <View style={styles.cardTitleRow}>
        <View
          style={[
            styles.priorityDot,
            { backgroundColor: PRIORIDADE_COLORS[task.prioridade] || PRIORIDADE_COLORS.media },
          ]}
          accessibilityLabel={PRIORIDADE_LABELS[task.prioridade]}
        />
        <Text style={styles.cardTitle} numberOfLines={1}>
          {task.titulo}
        </Text>
      </View>
      {task.descricao && (
        <Text style={styles.cardDescricao} numberOfLines={1}>
          {task.descricao}
        </Text>
      )}
      <View style={styles.cardMeta}>
        <EspacoCapsula espaco={espaco} small />
        {task.hora && <Text style={styles.cardHora}>{task.hora.slice(0, 5)}</Text>}
      </View>
      {task.vezes_adiada >= 3 && (
        <Pressable
          style={styles.nudgeRow}
          onPress={(e) => {
            e.stopPropagation?.();
            onQuebrar?.(task);
          }}
        >
          <Sparkles size={11} color={COLORS.atrasado} />
          <Text style={styles.nudgeText}>
            Adiada {task.vezes_adiada}x — toque pra ver como dividir
          </Text>
        </Pressable>
      )}
    </>
  );
}

function NativeDraggableCard({ task, espaco, onEditTask, onQuebrar, onDragStart, onDragUpdate, onDragEnd }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const dragging = useSharedValue(false);

  const pan = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      dragging.value = true;
      scale.value = withSpring(1.04);
      runOnJS(onDragStart)(task.id);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      runOnJS(onDragUpdate)(e.absoluteY);
    })
    .onEnd((e) => {
      runOnJS(onDragEnd)(task.id, e.absoluteX, e.absoluteY);
    })
    .onFinalize(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      dragging.value = false;
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onEditTask)(task);
  });

  const gesture = Gesture.Race(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: dragging.value ? '-2deg' : '0deg' },
    ],
    zIndex: dragging.value ? 100 : 1,
    borderColor: dragging.value ? COLORS.accent : COLORS.border,
    shadowOpacity: dragging.value ? 0.35 : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, styles.cardShadow, animatedStyle]}>
        <CardContent task={task} espaco={espaco} onQuebrar={onQuebrar} />
      </Animated.View>
    </GestureDetector>
  );
}

export default function KanbanScreen({ tasks, espacos, areaAtuacao, onSetStatus, onEditTask, onCreateTarefa }) {
  const [dragOver, setDragOver] = useState(null);
  const [touchDrag, setTouchDrag] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [recolhidas, setRecolhidas] = useState({});
  const [concluidasEscondidas, setConcluidasEscondidas] = useState(true);
  const [nativeDraggingId, setNativeDraggingId] = useState(null);
  const [nativeDragOver, setNativeDragOver] = useState(null);
  const [historicoVisible, setHistoricoVisible] = useState(false);
  const [quebrarTask, setQuebrarTask] = useState(null);
  const [espacoFiltro, setEspacoFiltro] = useState(null);
  const dragIdRef = useRef(null);
  const touchDragRef = useRef(null);
  const columnRefs = useRef({});
  const columnRangesRef = useRef({});
  const { width } = useWindowDimensions();
  const isWide = IS_WEB && width >= 720;

  const emptyMsgByColumn = useMemo(() => {
    const map = {};
    STATUS_ORDER.forEach((s) => {
      map[s] = pickRandom(EMPTY_MESSAGES);
    });
    return map;
  }, []);

  const grouped = useMemo(() => {
    const hoje = todayIso();
    const acc = { fazer: [], andamento: [], concluido: [], atrasado: [] };
    tasks.forEach((t) => {
      if (espacoFiltro && t.espaco_id !== espacoFiltro) return;
      // Tarefa com data futura só aparece no dia dela (tela Hoje, navegando o
      // calendário) — não "vaza" pro Board antes da data chegar.
      if (t.data_prevista && t.data_prevista > hoje) return;
      // Concluído só mostra o que foi terminado hoje — o resto vive no Histórico,
      // pra coluna não virar uma pilha infinita com o passar dos dias.
      if (t.status === 'concluido' && t.concluido_em?.slice(0, 10) !== hoje) return;
      acc[t.status]?.push(t);
    });
    STATUS_ORDER.forEach((s) => {
      acc[s] = ordenarPorPrioridade(acc[s]);
    });
    return acc;
  }, [tasks, espacoFiltro]);

  const espacosList = useMemo(() => Object.values(espacos), [espacos]);

  function handleDragStart(e, taskId, titulo) {
    dragIdRef.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    setDraggingId(taskId);

    const ghost = document.createElement('div');
    ghost.textContent = titulo;
    Object.assign(ghost.style, {
      position: 'absolute',
      top: '-1000px',
      left: '-1000px',
      padding: '10px 14px',
      borderRadius: '12px',
      background: COLORS.surface,
      border: `1px solid ${COLORS.accent}`,
      color: COLORS.text,
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
      transform: 'rotate(-2deg) scale(1.03)',
      maxWidth: '220px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => ghost.remove(), 0);
  }

  function toggleRecolhida(status) {
    setRecolhidas((prev) => ({ ...prev, [status]: !prev[status] }));
  }

  function toggleConcluidasEscondidas() {
    setConcluidasEscondidas((v) => !v);
  }

  function measureColumn(status) {
    const node = columnRefs.current[status];
    if (!node || !node.measureInWindow) return;
    node.measureInWindow((x, y, w, h) => {
      columnRangesRef.current[status] = { top: y, bottom: y + h };
    });
  }

  function statusAtY(y) {
    for (const s of STATUS_ORDER) {
      const range = columnRangesRef.current[s];
      if (range && y >= range.top && y <= range.bottom) return s;
    }
    return null;
  }

  const handleNativeDragStart = useCallback((taskId) => {
    setNativeDraggingId(taskId);
  }, []);

  const handleNativeDragUpdate = useCallback((absoluteY) => {
    setNativeDragOver(statusAtY(absoluteY));
  }, []);

  const handleNativeDragEnd = useCallback(
    (taskId, absoluteX, absoluteY) => {
      const status = statusAtY(absoluteY);
      if (status) onSetStatus(taskId, status, { x: absoluteX, y: absoluteY });
      setNativeDraggingId(null);
      setNativeDragOver(null);
    },
    [onSetStatus]
  );

  function handleDragEnd() {
    setDraggingId(null);
    setDragOver(null);
    dragIdRef.current = null;
  }

  function handleDrop(e, status) {
    e.preventDefault();
    setDragOver(null);
    setDraggingId(null);
    const id = dragIdRef.current;
    if (id) onSetStatus(id, status, { x: e.clientX, y: e.clientY });
    dragIdRef.current = null;
  }

  function handleTouchStart(e, task) {
    const touch = e.touches[0];
    const state = { id: task.id, x: touch.clientX, y: touch.clientY, task };
    touchDragRef.current = state;
    setTouchDrag(state);
  }

  useEffect(() => {
    if (!IS_WEB) return undefined;

    function handleTouchMove(e) {
      if (!touchDragRef.current) return;
      const touch = e.touches[0];
      const updated = { ...touchDragRef.current, x: touch.clientX, y: touch.clientY };
      touchDragRef.current = updated;
      setTouchDrag(updated);
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const col = el && el.closest ? el.closest('[data-status]') : null;
      setDragOver(col ? col.getAttribute('data-status') : null);
    }

    function handleTouchEnd() {
      if (!touchDragRef.current) return;
      const { id, x, y } = touchDragRef.current;
      const el = document.elementFromPoint(x, y);
      const col = el && el.closest ? el.closest('[data-status]') : null;
      if (col) onSetStatus(id, col.getAttribute('data-status'), { x, y });
      touchDragRef.current = null;
      setTouchDrag(null);
      setDragOver(null);
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSetStatus]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
        scrollEnabled={!nativeDraggingId}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Board</Text>
          <Pressable onPress={() => setHistoricoVisible(true)}>
            <Text style={styles.historicoLink}>Ver histórico</Text>
          </Pressable>
        </View>

        {espacosList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroRow}>
            <Pressable
              onPress={() => setEspacoFiltro(null)}
              style={[styles.filtroChip, !espacoFiltro && styles.filtroChipAtivo]}
            >
              <Text style={[styles.filtroChipText, !espacoFiltro && styles.filtroChipTextAtivo]}>Todos</Text>
            </Pressable>
            {espacosList.map((e) => {
              const ativo = espacoFiltro === e.id;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => setEspacoFiltro(ativo ? null : e.id)}
                  style={[styles.filtroChip, ativo && { backgroundColor: `${e.cor}33`, borderColor: e.cor }]}
                >
                  <View style={[styles.filtroDot, { backgroundColor: e.cor }]} />
                  <Text style={[styles.filtroChipText, ativo && { color: e.cor }]}>{e.nome}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {!IS_WEB && <Text style={styles.hintText}>Segure um card pra arrastar, toque pra editar.</Text>}

        <View style={isWide ? styles.columnsRow : undefined}>
        {STATUS_ORDER.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const lista = grouped[s];
          const isOver = dragOver === s;
          const isRecolhida = !!recolhidas[s];

          const isEscondida = s === 'concluido' && concluidasEscondidas;

          const columnInner = (
            <>
              <View style={styles.columnHeader}>
                <Pressable style={styles.columnHeaderMain} onPress={() => toggleRecolhida(s)}>
                  <cfg.Icon size={14} color={cfg.color} />
                  <Text style={styles.columnLabel}>{cfg.label}</Text>
                  <Text style={styles.columnCount}>{lista.length}</Text>
                </Pressable>
                {s === 'concluido' && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleConcluidasEscondidas();
                    }}
                    hitSlop={8}
                    style={styles.eyeButton}
                  >
                    {concluidasEscondidas ? (
                      <Eye size={14} color={COLORS.textSecondary} />
                    ) : (
                      <EyeOff size={14} color={COLORS.textSecondary} />
                    )}
                  </Pressable>
                )}
                <Pressable onPress={() => toggleRecolhida(s)} hitSlop={8}>
                  {isRecolhida ? (
                    <ChevronRight size={14} color={COLORS.textSecondary} style={styles.columnChevron} />
                  ) : (
                    <ChevronDown size={14} color={COLORS.textSecondary} style={styles.columnChevron} />
                  )}
                </Pressable>
              </View>

              {isRecolhida ? null : isEscondida ? (
                <Pressable onPress={toggleConcluidasEscondidas}>
                  <Text style={styles.hiddenText}>
                    {lista.length === 0
                      ? 'Nenhuma concluída ainda'
                      : `${lista.length} concluída${lista.length !== 1 ? 's' : ''} ocultas — toque no olho pra ver`}
                  </Text>
                </Pressable>
              ) : lista.length === 0 ? (
                <Text style={styles.emptyText}>{emptyMsgByColumn[s]}</Text>
              ) : (
                lista.map((t) => {
                  const espaco = espacos[t.espaco_id];
                  const isBeingDragged = (touchDrag && touchDrag.id === t.id) || draggingId === t.id;

                  if (IS_WEB) {
                    return (
                      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id, t.titulo)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(e, t)}
                        onClick={() => onEditTask(t)}
                        style={rawCardStyle(isBeingDragged)}
                      >
                        <CardContent task={t} espaco={espaco} onQuebrar={setQuebrarTask} />
                      </div>
                    );
                  }

                  return (
                    <NativeDraggableCard
                      key={t.id}
                      task={t}
                      espaco={espaco}
                      onEditTask={onEditTask}
                      onQuebrar={setQuebrarTask}
                      onDragStart={handleNativeDragStart}
                      onDragUpdate={handleNativeDragUpdate}
                      onDragEnd={handleNativeDragEnd}
                    />
                  );
                })
              )}
            </>
          );

          if (IS_WEB) {
            return (
              <div
                key={s}
                data-status={s}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(s);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, s)}
                style={rawColumnStyle(isOver, isWide)}
              >
                {columnInner}
              </div>
            );
          }

          return (
            <View
              key={s}
              ref={(node) => {
                columnRefs.current[s] = node;
              }}
              onLayout={() => measureColumn(s)}
              style={[styles.column, nativeDragOver === s && styles.columnOver]}
            >
              {columnInner}
            </View>
          );
        })}
        </View>
      </ScrollView>

      {touchDrag && (
        <View style={[styles.ghostCard, { left: touchDrag.x - 100, top: touchDrag.y - 40 }]}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {touchDrag.task.titulo}
          </Text>
        </View>
      )}

      <ModalHistorico
        visible={historicoVisible}
        tasks={tasks}
        espacos={espacos}
        onClose={() => setHistoricoVisible(false)}
        onRestore={(id) => onSetStatus(id, 'fazer')}
        onEditTask={onEditTask}
      />

      <ModalQuebrarTarefa
        visible={!!quebrarTask}
        task={quebrarTask}
        areaAtuacao={areaAtuacao}
        onClose={() => setQuebrarTask(null)}
        onConfirm={async (titulos) => {
          for (const titulo of titulos) {
            await onCreateTarefa({
              titulo,
              espaco_id: quebrarTask.espaco_id,
              prioridade: quebrarTask.prioridade,
              hora: null,
              data_prevista: todayIso(),
            });
          }
          setQuebrarTask(null);
        }}
      />
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
  scrollContentWide: {
    maxWidth: '100%',
    paddingHorizontal: 32,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historicoLink: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  filtroRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filtroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filtroChipAtivo: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  filtroChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  filtroChipTextAtivo: {
    color: COLORS.accent,
  },
  filtroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  hintText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  column: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  columnOver: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  columnHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
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
  eyeButton: {
    padding: 2,
  },
  columnChevron: {},
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
    opacity: 0.7,
  },
  hiddenText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitleRow: {
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
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  cardDescricao: {
    color: COLORS.textSecondary,
    fontSize: 11,
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
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  nudgeText: {
    color: COLORS.atrasado,
    fontSize: 10,
    fontStyle: 'italic',
  },
  ghostCard: {
    position: 'fixed',
    width: 200,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 10,
    zIndex: 2000,
    pointerEvents: 'none',
    transform: [{ rotate: '-2deg' }, { scale: 1.03 }],
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
});
