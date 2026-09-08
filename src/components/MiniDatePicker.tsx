// src/components/MiniDatePicker.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface MiniDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (dateStr: string) => void;
  label?: string;
  accentColor?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed month
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, day: d };
      }
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

export function formatDateString(year: number, month: number, day: number): string {
  const yStr = String(year);
  const mStr = String(month + 1).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

export const MiniDatePicker: React.FC<MiniDatePickerProps> = ({
  value,
  onChange,
  label = 'DATE',
  accentColor = Colors.brand,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = useMemo(() => parseDateString(value), [value]);

  // Calendar view navigation state
  const [viewYear, setViewYear] = useState(selectedDate.year);
  const [viewMonth, setViewMonth] = useState(selectedDate.month);

  // Keep view sync'd if selectedDate changes externally
  const handleToggle = () => {
    if (!isOpen) {
      setViewYear(selectedDate.year);
      setViewMonth(selectedDate.month);
    }
    setIsOpen(!isOpen);
  };

  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      str: formatDateString(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }, []);

  const yesterdayStr = useMemo(() => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return formatDateString(yest.getFullYear(), yest.getMonth(), yest.getDate());
  }, []);

  // Format readable display for collapsed pill
  const formattedDisplay = useMemo(() => {
    const { year, month, day } = selectedDate;
    const d = new Date(year, month, day);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const isToday = value === today.str;
    const isYesterday = value === yesterdayStr;

    const base = `${dayNames[d.getDay()]}, ${day} ${monthShort[month]} ${year}`;
    if (isToday) return `${base} • Today`;
    if (isYesterday) return `${base} • Yesterday`;
    return base;
  }, [selectedDate, value, today, yesterdayStr]);

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calendar grid matrix
  const calendarDays = useMemo(() => {
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 6 = Sat
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      dateStr: string;
    }> = [];

    // Trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const d = daysInPrevMonth - i;
      days.push({
        day: d,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateStr: formatDateString(prevYear, prevMonth, d),
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        dateStr: formatDateString(viewYear, viewMonth, d),
      });
    }

    // Leading days from next month to complete the 7-col grid (up to 35 or 42)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        day: d,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateStr: formatDateString(nextYear, nextMonth, d),
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
  };

  const handleQuickToday = () => {
    onChange(today.str);
    setViewYear(today.year);
    setViewMonth(today.month);
  };

  const handleQuickYesterday = () => {
    onChange(yesterdayStr);
    const { year, month } = parseDateString(yesterdayStr);
    setViewYear(year);
    setViewMonth(month);
  };

  const handleQuickFirstOfMonth = () => {
    const firstStr = formatDateString(today.year, today.month, 1);
    onChange(firstStr);
    setViewYear(today.year);
    setViewMonth(today.month);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}

      {/* Main Trigger Button */}
      <TouchableOpacity
        onPress={handleToggle}
        style={[
          styles.triggerBtn,
          isOpen && [styles.triggerBtnOpen, { borderColor: accentColor }],
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.triggerLeft}>
          <View style={[styles.calendarIconCircle, { backgroundColor: `${accentColor}1A` }]}>
            <CalendarIcon size={16} color={accentColor} />
          </View>
          <View>
            <Text style={styles.dateText}>{formattedDisplay}</Text>
            <Text style={styles.rawDateSubtext}>{value}</Text>
          </View>
        </View>

        <View style={styles.triggerRight}>
          {value === today.str && (
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>TODAY</Text>
            </View>
          )}
          {isOpen ? (
            <ChevronUp size={16} color={accentColor} />
          ) : (
            <ChevronDown size={16} color={Colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Mini Calendar */}
      {isOpen && (
        <View style={styles.calendarCard}>
          {/* Quick Shortcut Buttons */}
          <View style={styles.quickShortcutsRow}>
            <TouchableOpacity
              onPress={handleQuickToday}
              style={[
                styles.shortcutPill,
                value === today.str && [styles.shortcutPillActive, { backgroundColor: `${accentColor}25`, borderColor: accentColor }],
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.shortcutPillText,
                  value === today.str && { color: accentColor, fontWeight: '700' },
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleQuickYesterday}
              style={[
                styles.shortcutPill,
                value === yesterdayStr && [styles.shortcutPillActive, { backgroundColor: `${accentColor}25`, borderColor: accentColor }],
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.shortcutPillText,
                  value === yesterdayStr && { color: accentColor, fontWeight: '700' },
                ]}
              >
                Yesterday
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleQuickFirstOfMonth}
              style={styles.shortcutPill}
              activeOpacity={0.7}
            >
              <Text style={styles.shortcutPillText}>1st of Month</Text>
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation Header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navArrowBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={16} color={Colors.text} />
            </TouchableOpacity>

            <Text style={styles.monthYearTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navArrowBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels Header */}
          <View style={styles.weekdaysRow}>
            {WEEKDAY_NAMES.map((w, idx) => (
              <View key={`${w}-${idx}`} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{w}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              const isSelected = item.dateStr === value;
              const isItemToday = item.dateStr === today.str;

              return (
                <TouchableOpacity
                  key={`${item.dateStr}-${index}`}
                  onPress={() => handleSelectDay(item.dateStr)}
                  style={[
                    styles.dayCell,
                    isSelected && [styles.dayCellSelected, { backgroundColor: accentColor }],
                    isItemToday && !isSelected && styles.dayCellToday,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !item.isCurrentMonth && styles.dayTextMuted,
                      isItemToday && !isSelected && styles.dayTextToday,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {item.day}
                  </Text>
                  {isItemToday && !isSelected && (
                    <View style={[styles.todayIndicatorDot, { backgroundColor: accentColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View style={styles.calendarFooter}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerLabel}>Selected:</Text>
              <Text style={[styles.footerDate, { color: accentColor }]}>{value}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={[styles.doneBtn, { backgroundColor: accentColor }]}
              activeOpacity={0.8}
            >
              <Check size={14} color={Colors.white} />
              <Text style={styles.doneBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerBtnOpen: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  calendarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  rawDateSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
    fontFamily: 'monospace',
  },
  triggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  calendarCard: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  shortcutPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shortcutPillActive: {
    borderWidth: 1,
  },
  shortcutPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  navArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 6,
  },
  weekdayCell: {
    width: 36,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  dayCellSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  dayText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  dayTextMuted: {
    color: Colors.textSubdued,
    opacity: 0.5,
  },
  dayTextToday: {
    fontWeight: '700',
    color: Colors.white,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  todayIndicatorDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footerDate: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
