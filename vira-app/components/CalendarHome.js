import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  addDaysIso,
  DOW_LABELS,
  MESES,
  monthCells,
  startOfWeekIso,
  todayIso,
  weekDaysOf,
} from '../lib/calendario';
import { COLORS, PRIORIDADE_COLORS } from '../lib/theme';

function dotsFor(tasksByDate, iso) {
  const tasks = tasksByDate[iso] || [];
  return tasks.slice(0, 3).map((t) => PRIORIDADE_COLORS[t.prioridade] || PRIORIDADE_COLORS.media);
}

export default function CalendarHome({ tasks, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [stripAnchor, setStripAnchor] = useState(selected);
  const [monthAnchor, setMonthAnchor] = useState(selected);
  const hoje = todayIso();

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (t.status === 'concluido' || !t.data_prevista) return;
      if (!map[t.data_prevista]) map[t.data_prevista] = [];
      map[t.data_prevista].push(t);
    });
    return map;
  }, [tasks]);

  const weekDays = useMemo(() => weekDaysOf(stripAnchor), [stripAnchor]);

  const [monthY, monthM] = monthAnchor.split('-').map(Number);
  const cells = useMemo(() => monthCells(monthY, monthM - 1), [monthY, monthM]);
  const monthLabel = `${MESES[monthM - 1]} ${monthY}`;

  function selecionar(iso) {
    onSelect(iso);
    setStripAnchor(iso);
  }

  function mudarUnidade(delta) {
    if (expanded) {
      let novoMes = monthM - 1 + delta;
      let novoAno = monthY;
      if (novoMes < 0) {
        novoMes = 11;
        novoAno -= 1;
      } else if (novoMes > 11) {
        novoMes = 0;
        novoAno += 1;
      }
      setMonthAnchor(`${novoAno}-${String(novoMes + 1).padStart(2, '0')}-01`);
    } else {
      setStripAnchor(addDaysIso(startOfWeekIso(stripAnchor), delta * 7));
    }
  }

  function irParaHoje() {
    onSelect(hoje);
    setStripAnchor(hoje);
    setMonthAnchor(hoje);
  }

  function toggleExpanded() {
    if (!expanded) setMonthAnchor(stripAnchor);
    setExpanded((v) => !v);
  }

  return (
    <View style={styles.block}>
      <View style={styles.headRow}>
        <Pressable style={styles.monthToggle} onPress={toggleExpanded}>
          <Text style={styles.monthLabel}>{expanded ? monthLabel : `${MESES[Number(stripAnchor.split('-')[1]) - 1]} ${stripAnchor.split('-')[0]}`}</Text>
          <ChevronDown
            size={12}
            color={COLORS.textSecondary}
            style={expanded ? styles.chevronOpen : undefined}
          />
        </Pressable>
        <View style={styles.nav}>
          <Pressable style={styles.navBtn} onPress={() => mudarUnidade(-1)} hitSlop={6}>
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <Pressable style={styles.navBtn} onPress={() => mudarUnidade(1)} hitSlop={6}>
            <Text style={styles.navBtnText}>›</Text>
          </Pressable>
          <Pressable onPress={irParaHoje} hitSlop={6}>
            <Text style={styles.todayLink}>hoje</Text>
          </Pressable>
        </View>
      </View>

      {!expanded && (
        <View style={styles.weekStrip}>
          {weekDays.map((iso) => {
            const [, , d] = iso.split('-');
            const isToday = iso === hoje;
            const isSelected = iso === selected;
            return (
              <Pressable key={iso} style={styles.stripDay} onPress={() => selecionar(iso)}>
                <Text style={styles.stripDow}>{DOW_LABELS[new Date(`${iso}T00:00:00`).getDay()]}</Text>
                <View
                  style={[
                    styles.stripNum,
                    isToday && !isSelected && styles.stripNumToday,
                    isSelected && styles.stripNumSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.stripNumText,
                      isToday && !isSelected && styles.stripNumTextToday,
                      isSelected && styles.stripNumTextSelected,
                    ]}
                  >
                    {Number(d)}
                  </Text>
                </View>
                <View style={styles.dotsRow}>
                  {dotsFor(tasksByDate, iso).map((color, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: isSelected ? COLORS.bg : color }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {expanded && (
        <>
          <View style={styles.weekdaysRow}>
            {DOW_LABELS.map((label, i) => (
              <Text key={i} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {cells.map((cell, i) => {
              if (cell.muted) return <View key={i} style={styles.monthCell} />;
              const isToday = cell.iso === hoje;
              const isSelected = cell.iso === selected;
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.monthCell,
                    isToday && !isSelected && styles.monthCellToday,
                    isSelected && styles.monthCellSelected,
                  ]}
                  onPress={() => selecionar(cell.iso)}
                >
                  <Text
                    style={[
                      styles.monthNum,
                      isToday && !isSelected && styles.monthNumToday,
                      isSelected && styles.monthNumSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  <View style={styles.dotsRowSmall}>
                    {dotsFor(tasksByDate, cell.iso).map((color, i2) => (
                      <View key={i2} style={[styles.dotSmall, { backgroundColor: isSelected ? COLORS.bg : color }]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    paddingBottom: 6,
    marginBottom: 18,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  monthToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthLabel: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: -2,
  },
  todayLink: {
    color: COLORS.accent,
    fontSize: 10.5,
    fontWeight: '600',
  },
  weekStrip: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  stripDay: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  stripDow: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
    opacity: 0.75,
    textTransform: 'uppercase',
  },
  stripNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripNumToday: {
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  stripNumSelected: {
    backgroundColor: COLORS.accent,
  },
  stripNumText: {
    fontSize: 13,
    color: COLORS.text,
  },
  stripNumTextToday: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  stripNumTextSelected: {
    color: COLORS.bg,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingTop: 4,
    marginBottom: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  monthCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  monthCellToday: {
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  monthCellSelected: {
    backgroundColor: COLORS.accent,
  },
  monthNum: {
    fontSize: 11.5,
    color: COLORS.text,
  },
  monthNumToday: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  monthNumSelected: {
    color: COLORS.bg,
    fontWeight: '700',
  },
  dotsRowSmall: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 3,
  },
  dotSmall: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
