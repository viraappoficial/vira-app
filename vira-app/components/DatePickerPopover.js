import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { addDaysIso, DOW_LABELS, isoDate, MESES, monthCells, todayIso } from '../lib/calendario';
import { COLORS } from '../lib/theme';

export default function DatePickerPopover({ value, onSelect, onClose }) {
  const [y, m] = value.split('-').map(Number);
  const [viewYear, setViewYear] = useState(y);
  const [viewMonth, setViewMonth] = useState(m - 1);

  const hoje = todayIso();
  const cells = monthCells(viewYear, viewMonth);

  function mudarMes(delta) {
    let novoMes = viewMonth + delta;
    let novoAno = viewYear;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno -= 1;
    } else if (novoMes > 11) {
      novoMes = 0;
      novoAno += 1;
    }
    setViewMonth(novoMes);
    setViewYear(novoAno);
  }

  return (
    <View style={styles.pop}>
      <View style={styles.head}>
        <Text style={styles.headLabel}>
          {MESES[viewMonth]} {viewYear}
        </Text>
        <View style={styles.headNav}>
          <Pressable onPress={() => mudarMes(-1)} style={styles.navBtn} hitSlop={6}>
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <Pressable onPress={() => mudarMes(1)} style={styles.navBtn} hitSlop={6}>
            <Text style={styles.navBtnText}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.weekdaysRow}>
        {DOW_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, i) => {
          if (cell.muted) return <View key={i} style={styles.dayCell} />;
          const isToday = cell.iso === hoje;
          const isChosen = cell.iso === value;
          const isPast = cell.iso < hoje;
          return (
            <Pressable
              key={i}
              disabled={isPast}
              style={[
                styles.dayCell,
                isChosen && styles.dayCellChosen,
                !isChosen && isToday && styles.dayCellToday,
              ]}
              onPress={() => {
                onSelect(cell.iso);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.dayNum,
                  isPast && styles.dayNumPast,
                  isChosen && styles.dayNumChosen,
                  !isChosen && isToday && styles.dayNumToday,
                ]}
              >
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.quickRow}>
        <Pressable
          style={styles.quickBtn}
          onPress={() => {
            onSelect(hoje);
            onClose();
          }}
        >
          <Text style={styles.quickBtnText}>Hoje</Text>
        </Pressable>
        <Pressable
          style={styles.quickBtn}
          onPress={() => {
            onSelect(addDaysIso(hoje, 1));
            onClose();
          }}
        >
          <Text style={styles.quickBtnText}>Amanhã</Text>
        </Pressable>
        <Pressable
          style={styles.quickBtn}
          onPress={() => {
            onSelect(addDaysIso(hoje, 7));
            onClose();
          }}
        >
          <Text style={styles.quickBtnText}>+7 dias</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pop: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { boxShadow: '0 12px 30px rgba(0,0,0,0.5)' } : {}),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  headLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  headNav: {
    flexDirection: 'row',
    gap: 4,
  },
  navBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: -1,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  dayCellChosen: {
    backgroundColor: COLORS.accent,
  },
  dayNum: {
    color: COLORS.text,
    fontSize: 11,
  },
  dayNumToday: {
    color: COLORS.accent,
  },
  dayNumPast: {
    color: COLORS.textSecondary,
    opacity: 0.35,
  },
  dayNumChosen: {
    color: COLORS.bg,
    fontWeight: '700',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: 'center',
  },
  quickBtnText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
  },
});
