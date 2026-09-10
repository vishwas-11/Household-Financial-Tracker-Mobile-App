// src/lib/transactionCalculations.ts
import { Transaction, RecurringItem } from '../types';
import { getRecurringScheduleInfo } from './recurringManager';

/**
 * Returns today's date in local calendar 'YYYY-MM-DD' format
 */
export function getTodayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether a transaction is scheduled for a future date
 */
export function isTransactionUpcoming(fullDate?: string, todayStr: string = getTodayDateString()): boolean {
  if (!fullDate) return false;
  return fullDate > todayStr;
}

export interface BalanceMetrics {
  currentHolding: number;
  realizedIncome: number;
  realizedExpense: number;
  realizedSavings: number;
  upcomingIncome: number;
  upcomingExpense: number;
  upcomingNet: number;
  upcomingCount: number;
  projectedBalance: number;
  savingsRate: number;
  earliestUpcomingDate?: string;
}

/**
 * Calculates current available holding (<= today) vs. upcoming projected balance (> today)
 */
export function calculateBalanceMetrics(
  transactions: Transaction[],
  recurringItems: RecurringItem[] = [],
  todayStr: string = getTodayDateString()
): BalanceMetrics {
  let realizedIncome = 0;
  let realizedExpense = 0;
  let realizedSavings = 0;

  let upcomingIncome = 0;
  let upcomingExpense = 0;
  let upcomingCount = 0;
  let earliestUpcomingFullDate: string | null = null;
  let earliestUpcomingDateLabel: string | undefined;

  for (const t of transactions) {
    const isUpcoming = t.fullDate && t.fullDate > todayStr;

    if (isUpcoming) {
      upcomingCount++;
      if (t.type === 'income') {
        upcomingIncome += t.amount;
      } else if (t.type === 'expenditure') {
        upcomingExpense += t.amount;
      }

      if (!earliestUpcomingFullDate || t.fullDate < earliestUpcomingFullDate) {
        earliestUpcomingFullDate = t.fullDate;
        earliestUpcomingDateLabel = t.date;
      }
    } else {
      if (t.type === 'income') {
        realizedIncome += t.amount;
      } else if (t.type === 'expenditure') {
        realizedExpense += t.amount;
      } else if (t.type === 'savings') {
        realizedSavings += t.amount;
      }
    }
  }

  // Aggregate active recurring commitments due later this month (if not already settled)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDate = now.getDate();

  for (const item of recurringItems) {
    const info = getRecurringScheduleInfo(item, transactions, now);
    if (!info.isSettledThisMonth && info.isUpcomingThisMonth) {
      upcomingCount++;
      if (item.type === 'income') {
        upcomingIncome += item.amount;
      } else if (item.type === 'expenditure') {
        upcomingExpense += item.amount;
      }

      if (!earliestUpcomingFullDate || info.nextOccurrenceDateStr < earliestUpcomingFullDate) {
        earliestUpcomingFullDate = info.nextOccurrenceDateStr;
        earliestUpcomingDateLabel = info.nextDateStr;
      }
    }
  }

  const currentHolding = realizedIncome - realizedExpense;
  const upcomingNet = upcomingIncome - upcomingExpense;
  const projectedBalance = currentHolding + upcomingNet;

  const savingsRate =
    realizedIncome > 0
      ? Math.max(0, Math.round(((realizedIncome - realizedExpense) / realizedIncome) * 100))
      : 0;

  return {
    currentHolding,
    realizedIncome,
    realizedExpense,
    realizedSavings,
    upcomingIncome,
    upcomingExpense,
    upcomingNet,
    upcomingCount,
    projectedBalance,
    savingsRate,
    earliestUpcomingDate: earliestUpcomingDateLabel,
  };
}

export interface MonthMetrics {
  realizedIncome: number;
  realizedExpense: number;
  realizedNet: number;
  realizedCount: number;
  upcomingIncome: number;
  upcomingExpense: number;
  upcomingNet: number;
  upcomingCount: number;
  projectedNet: number;
  totalIncome: number;
  totalExpense: number;
  earliestUpcomingDate?: string;
}

/**
 * Calculates month metrics splitting realized vs upcoming
 */
export function calculateMonthMetrics(
  monthTransactions: Transaction[],
  recurringItems: RecurringItem[] = [],
  todayStr: string = getTodayDateString()
): MonthMetrics {
  let realizedIncome = 0;
  let realizedExpense = 0;
  let realizedCount = 0;

  let upcomingIncome = 0;
  let upcomingExpense = 0;
  let upcomingCount = 0;
  let earliestUpcomingFullDate: string | null = null;
  let earliestUpcomingDateLabel: string | undefined;

  for (const t of monthTransactions) {
    const isUpcoming = t.fullDate && t.fullDate > todayStr;

    if (isUpcoming) {
      upcomingCount++;
      if (t.type === 'income') upcomingIncome += t.amount;
      else if (t.type === 'expenditure') upcomingExpense += t.amount;

      if (!earliestUpcomingFullDate || t.fullDate < earliestUpcomingFullDate) {
        earliestUpcomingFullDate = t.fullDate;
        earliestUpcomingDateLabel = t.date;
      }
    } else {
      realizedCount++;
      if (t.type === 'income') realizedIncome += t.amount;
      else if (t.type === 'expenditure') realizedExpense += t.amount;
    }
  }

  // Aggregate active recurring commitments due later this month (if not already settled)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  for (const item of recurringItems) {
    const info = getRecurringScheduleInfo(item, monthTransactions, now);
    if (!info.isSettledThisMonth && info.isUpcomingThisMonth) {
      upcomingCount++;
      if (item.type === 'income') {
        upcomingIncome += item.amount;
      } else if (item.type === 'expenditure') {
        upcomingExpense += item.amount;
      }

      if (!earliestUpcomingFullDate || info.nextOccurrenceDateStr < earliestUpcomingFullDate) {
        earliestUpcomingFullDate = info.nextOccurrenceDateStr;
        earliestUpcomingDateLabel = info.nextDateStr;
      }
    }
  }

  const realizedNet = realizedIncome - realizedExpense;
  const upcomingNet = upcomingIncome - upcomingExpense;
  const totalIncome = realizedIncome + upcomingIncome;
  const totalExpense = realizedExpense + upcomingExpense;
  const projectedNet = totalIncome - totalExpense;

  return {
    realizedIncome,
    realizedExpense,
    realizedNet,
    realizedCount,
    upcomingIncome,
    upcomingExpense,
    upcomingNet,
    upcomingCount,
    projectedNet,
    totalIncome,
    totalExpense,
    earliestUpcomingDate: earliestUpcomingDateLabel,
  };
}
