// src/lib/recurringManager.ts
import { RecurringItem, Transaction, Member } from '../types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function parseDueDay(dueDateStr: string): number {
  if (!dueDateStr) return 1;
  const trimmed = dueDateStr.trim();
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

export function parseDateParts(dStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
    const parts = dStr.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date();
}

export function formatDateObj(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface RecurringScheduleInfo {
  dueDay: number;
  isSettledThisMonth: boolean;
  isDueToday: boolean;
  isPastDueThisMonth: boolean;
  isUpcomingThisMonth: boolean;
  nextOccurrenceDateStr: string;
  nextDateStr: string;
  daysRemaining: number;
  statusLabel: string;
}

export function getRecurringScheduleInfo(
  item: RecurringItem,
  transactions: Transaction[] = [],
  now: Date = new Date()
): RecurringScheduleInfo {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();
  const todayStr = formatDateObj(now);
  const currentMonthCycle = `${currentYear}-${pad(currentMonth + 1)}`;
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endOfCurrentMonth = `${currentYear}-${pad(currentMonth + 1)}-${pad(daysInCurrentMonth)}`;

  const freq = item.frequency || 'Monthly';
  let startDateStr = item.nextDueDate || todayStr;
  let dueDay = 1;

  if (/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
    dueDay = parseInt(startDateStr.split('-')[2], 10);
  } else {
    dueDay = parseDueDay(startDateStr);
    startDateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dueDay)}`;
  }

  const isSettledThisMonth = transactions.some(
    (t) =>
      t.isRecurring &&
      (t.notes?.includes(item.id) || t.description?.toLowerCase() === item.title.toLowerCase()) &&
      t.fullDate &&
      t.fullDate.startsWith(currentMonthCycle)
  );

  let nextOccurrenceStr = startDateStr;
  let isUpcomingThisMonth = false;
  let isDueToday = false;
  let isPastDueThisMonth = false;
  let statusLabel = '';

  if (freq === 'Monthly') {
    if (startDateStr > endOfCurrentMonth) {
      // Future month
      nextOccurrenceStr = startDateStr;
      isUpcomingThisMonth = false;
      const futureDate = parseDateParts(startDateStr);
      statusLabel = `Starts ${futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · Future cycle`;
    } else {
      if (isSettledThisMonth) {
        let nextM = currentMonth + 1;
        let nextY = currentYear;
        if (nextM > 11) {
          nextM = 0;
          nextY += 1;
        }
        const maxD = new Date(nextY, nextM + 1, 0).getDate();
        nextOccurrenceStr = `${nextY}-${pad(nextM + 1)}-${pad(Math.min(dueDay, maxD))}`;
        isUpcomingThisMonth = false;
        const nextDate = parseDateParts(nextOccurrenceStr);
        statusLabel = `Deducted this month · Next due ${nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (dueDay === todayDate) {
        nextOccurrenceStr = todayStr;
        isDueToday = true;
        statusLabel = `Due Today · Auto-Pay Cycle`;
      } else if (dueDay > todayDate) {
        nextOccurrenceStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dueDay)}`;
        isUpcomingThisMonth = true;
        const diffDays = dueDay - todayDate;
        const nextDate = parseDateParts(nextOccurrenceStr);
        statusLabel = `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'} (${nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      } else {
        // dueDay < todayDate and not settled
        let nextM = currentMonth + 1;
        let nextY = currentYear;
        if (nextM > 11) {
          nextM = 0;
          nextY += 1;
        }
        const maxD = new Date(nextY, nextM + 1, 0).getDate();
        nextOccurrenceStr = `${nextY}-${pad(nextM + 1)}-${pad(Math.min(dueDay, maxD))}`;
        isPastDueThisMonth = true;
        const nextDate = parseDateParts(nextOccurrenceStr);
        statusLabel = `Next due ${nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Past cycle`;
      }
    }
  } else {
    // Weekly, Bi-weekly, Annual
    let curr = parseDateParts(startDateStr);
    const intervalDays = freq === 'Weekly' ? 7 : freq === 'Bi-weekly' ? 14 : 0;
    if (intervalDays > 0) {
      while (formatDateObj(curr) < todayStr) {
        curr.setDate(curr.getDate() + intervalDays);
      }
    } else if (freq === 'Annual') {
      while (formatDateObj(curr) < todayStr) {
        curr.setFullYear(curr.getFullYear() + 1);
      }
    }
    nextOccurrenceStr = formatDateObj(curr);
    isUpcomingThisMonth = nextOccurrenceStr.startsWith(currentMonthCycle) && nextOccurrenceStr > todayStr;
    isDueToday = nextOccurrenceStr === todayStr;
    const nextDate = parseDateParts(nextOccurrenceStr);
    statusLabel = `Next due ${nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  const nextOccObj = parseDateParts(nextOccurrenceStr);
  const diffTime = nextOccObj.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    dueDay,
    isSettledThisMonth,
    isDueToday,
    isPastDueThisMonth,
    isUpcomingThisMonth,
    nextOccurrenceDateStr: nextOccurrenceStr,
    nextDateStr: nextOccObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
  const fullDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
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
