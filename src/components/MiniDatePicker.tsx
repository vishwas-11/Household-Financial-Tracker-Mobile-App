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
  CalendarDays,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface MiniDatePickerProps {
  stepFlow?: boolean;
  value: string; // YYYY-MM-DD format
  onChange: (dateStr: string) => void;
  label?: string;
  accentColor?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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
  stepFlow = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  const selectedDate = useMemo(() => parseDateString(value), [value]);

  // Calendar view navigation state
  const [viewYear, setViewYear] = useState(selectedDate.year);
  const [viewMonth, setViewMonth] = useState(selectedDate.month);
  const [decadeStart, setDecadeStart] = useState(() => Math.floor(selectedDate.year / 12) * 12);

  // Keep view sync'd if opened
  const handleToggle = () => {
    if (!isOpen) {
      setViewYear(selectedDate.year);
      setViewMonth(selectedDate.month);
      setDecadeStart(Math.floor(selectedDate.year / 12) * 12);
      setViewMode(stepFlow ? 'years' : 'days');
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
    const isToday = value === today.str;
    const isYesterday = value === yesterdayStr;

    const base = `${dayNames[d.getDay()]}, ${day} ${MONTH_SHORT_NAMES[month]} ${year}`;
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

  // Decade navigation (12 years)
  const handlePrevDecade = () => {
    setDecadeStart(decadeStart - 12);
  };

  const handleNextDecade = () => {
    setDecadeStart(decadeStart + 12);
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

    // Leading days from next month to complete the 7-col grid
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

  // 12-year window for year grid
  const yearList = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => decadeStart + i);
  }, [decadeStart]);

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex);
    // Update value with new month, clamping day if needed
    const maxDays = new Date(viewYear, monthIndex + 1, 0).getDate();
    const newDay = Math.min(selectedDate.day, maxDays);
    onChange(formatDateString(viewYear, monthIndex, newDay));
    setViewMode('days');
  };

  const handleSelectYear = (yearNum: number) => {
    setViewYear(yearNum);
    // Update value with new year, clamping day if needed (e.g. Feb 29 in leap year)
    const maxDays = new Date(yearNum, viewMonth + 1, 0).getDate();
    const newDay = Math.min(selectedDate.day, maxDays);
    onChange(formatDateString(yearNum, viewMonth, newDay));
    setViewMode('months');
  };

  const handleQuickToday = () => {
    onChange(today.str);
    setViewYear(today.year);
    setViewMonth(today.month);
    setViewMode('days');
  };

  const handleQuickYesterday = () => {
    onChange(yesterdayStr);
    const { year, month } = parseDateString(yesterdayStr);
    setViewYear(year);
    setViewMonth(month);
    setViewMode('days');
  };

  const handleQuickFirstOfMonth = () => {
    const firstStr = formatDateString(viewYear, viewMonth, 1);
    onChange(firstStr);
    setViewMode('days');
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
          {/* Step Guidance Breadcrumbs when stepFlow is active */}
          {stepFlow && (
            <View style={styles.stepBreadcrumbsContainer}>
              <TouchableOpacity
                onPress={() => setViewMode('years')}
                style={[
                  styles.stepBreadcrumbPill,
                  viewMode === 'years' && [styles.stepBreadcrumbActive, { borderColor: accentColor, backgroundColor: `${accentColor}25` }],
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.stepNumBadge, viewMode === 'years' && { backgroundColor: accentColor }]}>
                  <Text style={[styles.stepNumText, viewMode === 'years' && styles.stepNumTextActive]}>1</Text>
                </View>
                <Text style={[styles.stepBreadcrumbLabel, viewMode === 'years' && { color: accentColor, fontWeight: '700' }]}>
                  Year ({viewYear})
                </Text>
              </TouchableOpacity>

              <ChevronRight size={12} color={Colors.textMuted} />

              <TouchableOpacity
                onPress={() => setViewMode('months')}
                style={[
                  styles.stepBreadcrumbPill,
                  viewMode === 'months' && [styles.stepBreadcrumbActive, { borderColor: accentColor, backgroundColor: `${accentColor}25` }],
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.stepNumBadge, viewMode === 'months' && { backgroundColor: accentColor }]}>
                  <Text style={[styles.stepNumText, viewMode === 'months' && styles.stepNumTextActive]}>2</Text>
                </View>
                <Text style={[styles.stepBreadcrumbLabel, viewMode === 'months' && { color: accentColor, fontWeight: '700' }]}>
                  Month ({MONTH_SHORT_NAMES[viewMonth]})
                </Text>
              </TouchableOpacity>

              <ChevronRight size={12} color={Colors.textMuted} />

              <TouchableOpacity
                onPress={() => setViewMode('days')}
                style={[
                  styles.stepBreadcrumbPill,
                  viewMode === 'days' && [styles.stepBreadcrumbActive, { borderColor: accentColor, backgroundColor: `${accentColor}25` }],
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.stepNumBadge, viewMode === 'days' && { backgroundColor: accentColor }]}>
                  <Text style={[styles.stepNumText, viewMode === 'days' && styles.stepNumTextActive]}>3</Text>
                </View>
                <Text style={[styles.stepBreadcrumbLabel, viewMode === 'days' && { color: accentColor, fontWeight: '700' }]}>
                  Day ({selectedDate.day})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Shortcut Buttons */}
          <View style={styles.quickShortcutsRow}>
            <TouchableOpacity
              onPress={handleQuickToday}
              style={[
                styles.shortcutPill,
                value === today.str && [
                  styles.shortcutPillActive,
                  { backgroundColor: `${accentColor}25`, borderColor: accentColor },
                ],
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
                value === yesterdayStr && [
                  styles.shortcutPillActive,
                  { backgroundColor: `${accentColor}25`, borderColor: accentColor },
                ],
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

          {/* Navigation Header */}
          {viewMode === 'days' && (
            <View style={styles.monthHeader}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={16} color={Colors.text} />
              </TouchableOpacity>

              {/* Interactive Month & Year Selectors */}
              <View style={styles.headerPillsRow}>
                <TouchableOpacity
                  onPress={() => setViewMode('months')}
                  style={styles.selectorPill}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectorPillText}>{MONTH_NAMES[viewMonth]}</Text>
                  <ChevronDown size={12} color={Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDecadeStart(Math.floor(viewYear / 12) * 12);
                    setViewMode('years');
                  }}
                  style={[styles.selectorPill, styles.yearSelectorPill]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectorPillText, { fontWeight: '700' }]}>{viewYear}</Text>
                  <ChevronDown size={12} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
          )}

          {/* Header in Year Selection Mode */}
          {viewMode === 'years' && (
            <View style={styles.monthHeader}>
              <TouchableOpacity
                onPress={handlePrevDecade}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={16} color={Colors.text} />
              </TouchableOpacity>

              <Text style={styles.modeTitle}>
                Select Year: {decadeStart} – {decadeStart + 11}
              </Text>

              <TouchableOpacity
                onPress={handleNextDecade}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
          )}

          {/* Header in Month Selection Mode */}
          {viewMode === 'months' && (
            <View style={styles.monthHeader}>
              <View style={{ width: 28 }} />
              <Text style={styles.modeTitle}>Select Month ({viewYear})</Text>
              <TouchableOpacity
                onPress={() => setViewMode('days')}
                style={styles.backPill}
                activeOpacity={0.7}
              >
                <Text style={styles.backPillText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW: DAYS (Calendar Grid) */}
          {viewMode === 'days' && (
            <>
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
            </>
          )}

          {/* VIEW: YEARS (12-Year Grid) */}
          {viewMode === 'years' && (
            <View style={styles.grid12Container}>
              {yearList.map((y) => {
                const isSelectedYear = selectedDate.year === y;
                const isCurrentYear = today.year === y;
                return (
                  <TouchableOpacity
                    key={y}
                    onPress={() => handleSelectYear(y)}
                    style={[
                      styles.grid12Cell,
                      isSelectedYear && [styles.grid12CellSelected, { backgroundColor: accentColor }],
                      isCurrentYear && !isSelectedYear && styles.grid12CellToday,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.grid12Text,
                        isSelectedYear && styles.grid12TextSelected,
                        isCurrentYear && !isSelectedYear && { color: accentColor, fontWeight: '700' },
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* VIEW: MONTHS (12-Month Grid) */}
          {viewMode === 'months' && (
            <View style={styles.grid12Container}>
              {MONTH_SHORT_NAMES.map((mName, idx) => {
                const isSelectedMonth = selectedDate.month === idx && selectedDate.year === viewYear;
                const isCurrentMonth = today.month === idx && today.year === viewYear;
                return (
                  <TouchableOpacity
                    key={mName}
                    onPress={() => handleSelectMonth(idx)}
                    style={[
                      styles.grid12Cell,
                      isSelectedMonth && [styles.grid12CellSelected, { backgroundColor: accentColor }],
                      isCurrentMonth && !isSelectedMonth && styles.grid12CellToday,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.grid12Text,
                        isSelectedMonth && styles.grid12TextSelected,
                        isCurrentMonth && !isSelectedMonth && { color: accentColor, fontWeight: '700' },
                      ]}
                    >
                      {mName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

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
  stepBreadcrumbsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  stepBreadcrumbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepBreadcrumbActive: {
    borderWidth: 1,
  },
  stepNumBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  stepNumTextActive: {
    color: Colors.white,
  },
  stepBreadcrumbLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
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
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  headerPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  yearSelectorPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  selectorPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  backPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
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
  grid12Container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 8,
  },
  grid12Cell: {
    width: '30%',
    height: 42,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid12CellSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  grid12CellToday: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  grid12Text: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  grid12TextSelected: {
    color: Colors.white,
    fontWeight: '700',
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
