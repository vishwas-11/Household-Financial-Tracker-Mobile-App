// src/lib/recurringManager.ts
import { RecurringItem, Transaction, Member } from '../types';

export function parseDueDay(dueDateStr: string): number {
  if (!dueDateStr) return 1;
  const trimmed = dueDateStr.trim();
  // If ISO YYYY-MM-DD format, extract day component (parts[2])
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    const day = parseInt(parts[2], 10);
    return Math.min(Math.max(day, 1), 31);
  }
  const match = trimmed.match(/\d+/);
  if (match) {
    const day = parseInt(match[0], 10);
    return Math.min(Math.max(day, 1), 31);
  }
  return 1;
}

export interface RecurringScheduleInfo {
  dueDay: number;
  isSettledThisMonth: boolean;
  isDueToday: boolean;
  isPastDueThisMonth: boolean;
  nextDateStr: string;
  daysRemaining: number;
  statusLabel: string;
}

export function getRecurringScheduleInfo(
  item: RecurringItem,
  transactions: Transaction[],
  now: Date = new Date()
): RecurringScheduleInfo {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDate = now.getDate();

  const dueDay = parseDueDay(item.nextDueDate);
  const currentMonthCycle = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Check if a transaction for this recurring item already exists in this month
  const isSettledThisMonth = transactions.some(
    (t) =>
      t.isRecurring &&
      (t.notes?.includes(item.id) || t.description.toLowerCase() === item.title.toLowerCase()) &&
      t.fullDate.startsWith(currentMonthCycle)
  );

  const isDueToday = todayDate === dueDay;
  const isPastDueThisMonth = todayDate > dueDay;

  let nextDate: Date;
  let daysRemaining: number;
  let statusLabel: string;

  if (isSettledThisMonth) {
    // Next due is next month
    nextDate = new Date(currentYear, currentMonth + 1, dueDay);
    const diffTime = nextDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const nextMonthName = nextDate.toLocaleDateString('en-US', { month: 'short' });
    statusLabel = `Deducted for this month · Next due ${nextMonthName} ${dueDay}`;
  } else if (isDueToday) {
    nextDate = new Date(currentYear, currentMonth, dueDay);
    daysRemaining = 0;
    statusLabel = `Due Today · Auto-Pay Cycle`;
  } else if (todayDate < dueDay) {
    nextDate = new Date(currentYear, currentMonth, dueDay);
    const diffTime = nextDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    statusLabel = `Due in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} (${nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  } else {
    // todayDate > dueDay and not settled this month
    // Scheduled payment applies to next cycle
    nextDate = new Date(currentYear, currentMonth + 1, dueDay);
    const diffTime = nextDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const nextMonthName = nextDate.toLocaleDateString('en-US', { month: 'short' });
    statusLabel = `Next due ${nextMonthName} ${dueDay} (in ${daysRemaining} days)`;
  }

  return {
    dueDay,
    isSettledThisMonth,
    isDueToday,
    isPastDueThisMonth,
    nextDateStr: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    daysRemaining,
    statusLabel,
  };
}

export function buildTransactionFromRecurring(
  item: RecurringItem,
  members: Member[],
  dateObj: Date = new Date()
): Transaction {
  const member = members.find((m) => m.id === item.memberId) || members[0];
  const fullDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    id: `tx-rec-${item.id}-${Date.now()}`,
    date: displayDate,
    fullDate,
    description: item.title,
    category: item.category,
    type: item.type,
    amount: item.amount,
    memberId: member ? member.id : 'A',
    memberName: member ? member.name : 'Household',
    notes: `Automated recurring payment [ref:${item.id}]`,
    isRecurring: true,
  };
}
