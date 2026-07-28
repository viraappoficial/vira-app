import { AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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

function CardContent({ task, espaco }) {
  return (
    <>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {task.titulo}
      </Text>
      <View style={styles.cardMeta}>
        <EspacoCapsula espaco={espaco} small />
        {task.hora && <Text style={styles.cardHora}>{task.hora.slice(0, 5)}</Text>}
      </View>
    </>
  );
}

export default function KanbanScreen({ tasks, espacos, onSetStatus, onVirarDia }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [touchDrag, setTouchDrag] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const dragIdRef = useRef(null);
  const touchDragRef = useRef(null);
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
    const acc = { fazer: [], andamento: [], concluido: [], atrasado: [] };
    tasks.forEach((t) => acc[t.status]?.push(t));
    return acc;
  }, [tasks]);

  function handlePick(status) {
    onSetStatus(selectedTask.id, status);
    setSelectedTask(null);
  }

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
    if (id) onSetStatus(id, status);
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
      if (col) onSetStatus(id, col.getAttribute('data-status'));
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
      <ScrollView contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Board</Text>
          <Pressable style={styles.virarDiaButton} onPress={onVirarDia}>
            <Text style={styles.virarDiaText}>Virar o dia</Text>
          </Pressable>
        </View>

        {!IS_WEB && <Text style={styles.hintText}>Toque num card pra mudar o status.</Text>}

        <View style={isWide ? styles.columnsRow : undefined}>
        {STATUS_ORDER.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const lista = grouped[s];
          const isOver = dragOver === s;

          const columnInner = (
            <>
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
                  const isBeingDragged = (touchDrag && touchDrag.id === t.id) || draggingId === t.id;

                  if (IS_WEB) {
                    return (
                      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id, t.titulo)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(e, t)}
                        style={rawCardStyle(isBeingDragged)}
                      >
                        <CardContent task={t} espaco={espaco} />
                      </div>
                    );
                  }

                  return (
                    <Pressable key={t.id} style={styles.card} onPress={() => setSelectedTask(t)}>
                      <CardContent task={t} espaco={espaco} />
                    </Pressable>
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
            <View key={s} style={styles.column}>
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
  scrollContentWide: {
    maxWidth: 1100,
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
    marginTop: 12,
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
