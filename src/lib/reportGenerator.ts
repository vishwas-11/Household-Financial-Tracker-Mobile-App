import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import { Transaction, Member } from '../types';

export type ReportScopeType =
  | 'all_records'
  | 'this_month'
  | 'last_30_days'
  | 'specific_month'
  | 'past_12_months'
  | 'specific_year';

export interface ReportScope {
  type: ReportScopeType;
  year?: number;
  month?: number; // 0-indexed (0 = Jan, 11 = Dec)
}

export interface ReportAnalytics {
  periodLabel: string;
  dateRangeText: string;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
  dailyAverageExpense: number;
  daysInPeriod: number;
  largestExpense: Transaction | null;
  largestIncome: Transaction | null;
  categoryBreakdown: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  memberBreakdown: {
    memberId: string;
    name: string;
    avatarLetter: string;
    colorBg: string;
    colorText: string;
    totalSpent: number;
    totalEarned: number;
    netBalance: number;
    expensePercentage: number;
  }[];
  monthlyTrends: {
    monthKey: string;
    monthName: string;
    income: number;
    expense: number;
    net: number;
  }[];
  filteredTransactions: Transaction[];
}

/**
 * Parses transaction date safely into a standard midday Date object
 */
export function parseTxDate(tx: Transaction): Date {
  if (tx.fullDate && tx.fullDate.includes('-')) {
    const parts = tx.fullDate.split('-');
    if (parts.length === 3) {
      const yr = parseInt(parts[0], 10);
      const mo = parseInt(parts[1], 10) - 1;
      const da = parseInt(parts[2], 10);
      if (!isNaN(yr) && !isNaN(mo) && !isNaN(da)) {
        return new Date(yr, mo, da, 12, 0, 0);
      }
    }
  }
  if ((tx as any).created_at) {
    const parsed = new Date((tx as any).created_at);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const currentYear = new Date().getFullYear();
  const parsed = new Date(`${tx.date} ${currentYear}`);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Filters transactions and computes full financial reconciliation analytics for the chosen scope
 */
export function computeReportAnalytics(
  transactions: Transaction[],
  members: Member[],
  scope: ReportScope
): ReportAnalytics {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let periodLabel = '';

  switch (scope.type) {
    case 'all_records': {
      if (transactions.length > 0) {
        const sorted = [...transactions].sort(
          (a, b) => parseTxDate(a).getTime() - parseTxDate(b).getTime()
        );
        startDate = parseTxDate(sorted[0]);
        startDate.setHours(0, 0, 0, 0);
        endDate = parseTxDate(sorted[sorted.length - 1]);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }
      periodLabel = 'All Time Master Financial Statement';
      break;
    }
    case 'this_month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const monthName = now.toLocaleString('en-US', { month: 'long' });
      periodLabel = `${monthName} ${now.getFullYear()} Statement`;
      break;
    }
    case 'last_30_days': {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      periodLabel = 'Past 30 Days Operating Statement';
      break;
    }
    case 'specific_month': {
      const yr = scope.year ?? now.getFullYear();
      const mo = scope.month ?? now.getMonth();
      startDate = new Date(yr, mo, 1);
      endDate = new Date(yr, mo + 1, 0, 23, 59, 59);
      const mName = startDate.toLocaleString('en-US', { month: 'long' });
      periodLabel = `${mName} ${yr} Financial Statement`;
      break;
    }
    case 'past_12_months': {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      periodLabel = 'Trailing 12 Months Annual Review';
      break;
    }
    case 'specific_year': {
      const yr = scope.year ?? now.getFullYear();
      startDate = new Date(yr, 0, 1);
      endDate = new Date(yr, 11, 31, 23, 59, 59);
      periodLabel = `Fiscal Year ${yr} Statement`;
      break;
    }
    default: {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      periodLabel = 'Financial Reconciliation Statement';
    }
  }

  // Filter transactions within the bounding dates
  const filtered = transactions.filter((tx) => {
    const txDate = parseTxDate(tx);
    return txDate >= startDate && txDate <= endDate;
  });

  // Sort descending by date for the detailed itemized audit ledger
  filtered.sort((a, b) => parseTxDate(b).getTime() - parseTxDate(a).getTime());

  // Aggregate totals
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSavings = 0;
  let largestExpense: Transaction | null = null;
  let largestIncome: Transaction | null = null;

  const categoryMap: { [cat: string]: { amount: number; count: number } } = {};
  const memberSpentMap: { [mId: string]: number } = {};
  const memberEarnedMap: { [mId: string]: number } = {};
  const monthlyMap: { [key: string]: { income: number; expense: number; monthName: string } } = {};

  filtered.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const txDate = parseTxDate(tx);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = txDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { income: 0, expense: 0, monthName };
    }

    if (tx.type === 'income') {
      totalIncome += amt;
      monthlyMap[monthKey].income += amt;
      if (tx.memberId) {
        memberEarnedMap[tx.memberId] = (memberEarnedMap[tx.memberId] || 0) + amt;
      }
      if (!largestIncome || amt > Number(largestIncome.amount)) {
        largestIncome = tx;
      }
    } else if (tx.type === 'savings') {
      totalSavings += amt;
      totalExpense += amt;
      monthlyMap[monthKey].expense += amt;
      const cat = tx.category || 'Savings';
      if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
      categoryMap[cat].amount += amt;
      categoryMap[cat].count += 1;
      if (tx.memberId) {
        memberSpentMap[tx.memberId] = (memberSpentMap[tx.memberId] || 0) + amt;
      }
    } else {
      totalExpense += amt;
      monthlyMap[monthKey].expense += amt;
      const cat = tx.category || 'General';
      if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
      categoryMap[cat].amount += amt;
      categoryMap[cat].count += 1;

      if (tx.memberId) {
        memberSpentMap[tx.memberId] = (memberSpentMap[tx.memberId] || 0) + amt;
      }
      if (!largestExpense || amt > Number(largestExpense.amount)) {
        largestExpense = tx;
      }
    }
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  // Compute total days in period
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const daysInPeriod = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const dailyAverageExpense = daysInPeriod > 0 ? totalExpense / daysInPeriod : 0;

  // Category Breakdown sorted by amount descending
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Member Breakdown
  const colorPalette = [
    { bg: '#e0e7ff', text: '#3730a3' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#fef3c7', text: '#b45309' },
    { bg: '#fce7f3', text: '#be185d' },
    { bg: '#e0f2fe', text: '#0369a1' },
    { bg: '#ede9fe', text: '#6d28d9' },
  ];

  const memberBreakdown = members.map((m, idx) => {
    const totalSpent = memberSpentMap[m.id] || 0;
    const totalEarned = memberEarnedMap[m.id] || 0;
    const colors = colorPalette[idx % colorPalette.length];
    return {
      memberId: m.id,
      name: m.name,
      avatarLetter: (m.name || 'U').charAt(0).toUpperCase(),
      colorBg: colors.bg,
      colorText: colors.text,
      totalSpent,
      totalEarned,
      netBalance: totalEarned - totalSpent,
      expensePercentage: totalExpense > 0 ? Math.round((totalSpent / totalExpense) * 100) : 0,
    };
  });

  // Sort monthly trends chronologically
  const monthlyTrends = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      monthKey: key,
      monthName: data.monthName,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));

  const formatDateStr = (d: Date) =>
    d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const dateRangeText = `${formatDateStr(startDate)} — ${formatDateStr(endDate)}`;

  return {
    periodLabel,
    dateRangeText,
    totalIncome,
    totalExpense,
    totalSavings,
    netBalance,
    savingsRate,
    transactionCount: filtered.length,
    dailyAverageExpense,
    daysInPeriod,
    largestExpense,
    largestIncome,
    categoryBreakdown,
    memberBreakdown,
    monthlyTrends,
    filteredTransactions: filtered,
  };
}

/**
 * Formats a number to Indian numbering comma style with 2 decimals
 */
function formatInr(val: number): string {
  const parts = Math.abs(val).toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `₹${formattedInt}.${decimalPart}`;
}

function formatAccountingInr(val: number): string {
  if (val < 0) {
    return `(${formatInr(Math.abs(val))})`;
  }
  return formatInr(val);
}

/**
 * Generates an ultra-crisp, professional CPA-grade financial statement and reconciliation HTML document.
 * Layout is 100% full-width across all schedules to eliminate cramped overlapping columns and text-wrapping bugs.
 */
export function generateReportHtml(
  analytics: ReportAnalytics,
  householdName: string,
  inviteCode: string
): string {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const statementRef = `HFT-${inviteCode ? inviteCode.toUpperCase() : 'STMT'}-${yearMonth}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Schedule A: Category Breakdown Rows (Full Width - 5 Columns)
  const categoryRowsHtml = analytics.categoryBreakdown
    .map(
      (cat, idx) => `
      <tr>
        <td style="padding: 7px 5px; font-family: monospace; font-size: 11px; font-weight: 700; color: #475569; text-align: center;">
          ${(idx + 1).toString().padStart(2, '0')}
        </td>
        <td style="padding: 7px 6px; font-size: 12px; font-weight: 700; color: #090d16;">
          ${cat.category}
        </td>
        <td style="padding: 7px 5px; text-align: center; font-size: 11px; font-weight: 700; color: #334155; font-family: monospace;">
          ${cat.count}
        </td>
        <td style="padding: 7px 6px; text-align: right; font-size: 12px; font-weight: 800; color: #090d16; font-family: monospace; white-space: nowrap;">
          ${formatInr(cat.amount)}
        </td>
        <td style="padding: 7px 6px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #334155; min-width: 32px; text-align: right;">
              ${cat.percentage}%
            </span>
            <div style="flex: 1; max-width: 75px; height: 6px; background-color: #e2e8f0; border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${Math.min(100, Math.max(3, cat.percentage))}%; background-color: #4338ca; border-radius: 3px;"></div>
            </div>
          </div>
        </td>
      </tr>
    `
    )
    .join('');

  // Schedule B: Member Breakdown Rows (Full Width)
  const memberRowsHtml = analytics.memberBreakdown
    .map(
      (m) => `
      <tr>
        <td style="padding: 7px 6px;">
          <span style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; background: ${m.colorBg}; color: ${m.colorText}; text-align: center; line-height: 20px; font-weight: 800; font-size: 10.5px; font-family: monospace; vertical-align: middle; margin-right: 6px;">
            ${m.avatarLetter}
          </span>
          <span style="font-size: 12px; font-weight: 700; color: #090d16; vertical-align: middle;">
            ${m.name}
          </span>
        </td>
        <td style="padding: 7px 6px; text-align: right; color: #047857; font-size: 12px; font-weight: 700; font-family: monospace; white-space: nowrap;">
          +${formatInr(m.totalEarned)}
        </td>
        <td style="padding: 7px 6px; text-align: right; color: #be123c; font-size: 12px; font-weight: 700; font-family: monospace; white-space: nowrap;">
          ${formatAccountingInr(-m.totalSpent)}
        </td>
        <td style="padding: 7px 6px; text-align: right; font-size: 12px; font-weight: 800; font-family: monospace; color: ${m.netBalance >= 0 ? '#047857' : '#be123c'}; white-space: nowrap;">
          ${m.netBalance >= 0 ? '+' : ''}${formatInr(m.netBalance)}
        </td>
        <td style="padding: 7px 5px; text-align: center; font-size: 11px; font-weight: 700; color: #334155; font-family: monospace; white-space: nowrap;">
          ${m.expensePercentage}%
        </td>
      </tr>
    `
    )
    .join('');

  // Schedule C: Monthly Comparison Rows (if multiple months)
  const showMonthlySection = analytics.monthlyTrends.length > 1;
  const monthlyRowsHtml = analytics.monthlyTrends
    .map(
      (mt) => `
      <tr>
        <td style="padding: 7px 6px; font-size: 12px; font-weight: 700; border-bottom: 1px solid #cbd5e1; color: #090d16;">
          ${mt.monthName}
        </td>
        <td style="padding: 7px 6px; text-align: right; border-bottom: 1px solid #cbd5e1; color: #047857; font-size: 12px; font-family: monospace; font-weight: 700; white-space: nowrap;">
          +${formatInr(mt.income)}
        </td>
        <td style="padding: 7px 6px; text-align: right; border-bottom: 1px solid #cbd5e1; color: #be123c; font-size: 12px; font-family: monospace; font-weight: 700; white-space: nowrap;">
          ${formatAccountingInr(-mt.expense)}
        </td>
        <td style="padding: 7px 6px; text-align: right; border-bottom: 1px solid #cbd5e1; font-size: 12px; font-weight: 800; font-family: monospace; color: ${
          mt.net >= 0 ? '#047857' : '#be123c'
        }; white-space: nowrap;">
          ${mt.net >= 0 ? '+' : ''}${formatInr(mt.net)}
        </td>
      </tr>
    `
    )
    .join('');

  // Schedule D: Itemized Ledger Rows
  const displayTxList = analytics.filteredTransactions.slice(0, 200);
  const ledgerRowsHtml = displayTxList
    .map((tx, idx) => {
      const isIncome = tx.type === 'income';
      const isSavings = tx.type === 'savings';
      const typeLabel = isIncome ? 'CR' : isSavings ? 'SAV' : 'DR';
      const debitText = isIncome ? '-' : formatInr(tx.amount);
      const creditText = isIncome ? `+${formatInr(tx.amount)}` : '-';
      const debitColor = isIncome ? '#94a3b8' : '#be123c';
      const creditColor = isIncome ? '#047857' : '#94a3b8';

      const txDateObj = parseTxDate(tx);
      const formattedTxDate = txDateObj.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 7px 5px; font-size: 11px; font-weight: 600; font-family: monospace; color: #334155; text-align: center; white-space: nowrap;">
          ${formattedTxDate}
        </td>
        <td style="padding: 7px 5px; font-size: 10.5px; font-weight: 700; font-family: monospace; color: #475569; text-align: center; white-space: nowrap;">
          #${tx.id.slice(-6).toUpperCase()}
        </td>
        <td style="padding: 7px 6px; font-size: 12px; font-weight: 700; color: #090d16; line-height: 1.35;">
          ${tx.description}
          ${
            tx.notes
              ? `<div style="font-size: 10.5px; color: #64748b; font-weight: normal; margin-top: 2px;">Note: ${tx.notes}</div>`
              : ''
          }
        </td>
        <td style="padding: 7px 5px; font-size: 11px; font-weight: 600; color: #334155; white-space: nowrap;">
          <span style="display: inline-block; padding: 1px 4px; font-size: 9px; font-weight: 800; border-radius: 3px; background-color: ${
            isIncome ? '#ecfdf5' : isSavings ? '#e0e7ff' : '#fff1f2'
          }; color: ${isIncome ? '#047857' : isSavings ? '#3730a3' : '#be123c'}; margin-right: 4px; font-family: monospace;">
            ${typeLabel}
          </span>
          ${tx.category || 'General'}
        </td>
        <td style="padding: 7px 5px; font-size: 11px; font-weight: 600; color: #1e293b; white-space: nowrap;">
          ${tx.memberName || 'Household'}
        </td>
        <td style="padding: 7px 6px; text-align: right; font-family: monospace; font-size: 11.5px; font-weight: 800; color: ${debitColor}; white-space: nowrap;">
          ${debitText}
        </td>
        <td style="padding: 7px 6px; text-align: right; font-family: monospace; font-size: 11.5px; font-weight: 800; color: ${creditColor}; white-space: nowrap;">
          ${creditText}
        </td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${analytics.periodLabel} - ${householdName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    @media print {
      html, body {
        width: 100%;
        background: #ffffff !important;
        color: #090d16 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      thead {
        display: table-header-group;
      }
      tfoot {
        display: table-footer-group;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #090d16;
      background-color: #ffffff;
      font-size: 13px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
      padding: 10px 14px;
    }
    .doc-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .main-title {
      font-size: 23px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #090d16;
      text-transform: uppercase;
    }
    .sub-title {
      font-size: 13px;
      font-weight: 700;
      color: #4338ca;
      margin-top: 3px;
      letter-spacing: 0.3px;
    }
    .entity-line {
      font-size: 12px;
      color: #334155;
      margin-top: 4px;
    }
    .audit-stamp {
      display: inline-block;
      padding: 5px 10px;
      background-color: #ecfdf5;
      border: 1.5px solid #059669;
      border-radius: 5px;
      font-family: monospace;
      font-size: 11.5px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .doc-rule {
      border: none;
      border-top: 2.5px solid #0f172a;
      border-bottom: 1px solid #94a3b8;
      height: 4px;
      margin: 10px 0 16px 0;
    }
    .scope-banner {
      background-color: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .scope-title {
      font-size: 16px;
      font-weight: 800;
      color: #090d16;
    }
    .scope-dates {
      font-size: 12px;
      color: #475569;
      font-family: monospace;
      font-weight: 600;
      margin-top: 3px;
    }
    .scope-stats {
      text-align: right;
      font-size: 12.5px;
      color: #1e293b;
      font-family: monospace;
      line-height: 1.4;
    }
    .recon-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
      border: 1.5px solid #94a3b8;
      table-layout: fixed;
    }
    .recon-table th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: left;
    }
    .recon-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #cbd5e1;
      font-size: 13.5px;
    }
    .recon-total-row td {
      background-color: #f1f5f9;
      font-weight: 800;
      font-size: 15px;
      border-top: 2.5px solid #0f172a;
      border-bottom: 3.5px double #0f172a;
    }
    .section-header {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #090d16;
      margin: 22px 0 4px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 5px;
    }
    .section-desc {
      font-size: 11px;
      color: #475569;
      margin: 0 0 10px 0;
      line-height: 1.4;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #cbd5e1;
      margin-bottom: 20px;
      table-layout: fixed;
    }
    .data-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 7px 5px;
      border-bottom: 1.5px solid #94a3b8;
      border-right: 1px solid #cbd5e1;
      text-align: left;
      vertical-align: middle;
      line-height: 1.25;
      overflow: hidden;
    }
    .data-table th:last-child {
      border-right: none;
    }
    .data-table td {
      padding: 7px 5px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      vertical-align: middle;
      overflow: hidden;
      font-size: 11.5px;
      line-height: 1.35;
    }
    .data-table td:last-child {
      border-right: none;
    }
    .cert-box {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      background-color: #f8fafc;
      padding: 16px 20px;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .cert-text {
      font-size: 12px;
      color: #334155;
      line-height: 1.6;
      margin-bottom: 18px;
      font-style: italic;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .sign-table td {
      width: 50%;
      vertical-align: top;
      padding-right: 24px;
    }
    .sign-line {
      border-bottom: 1.5px solid #334155;
      margin: 24px 0 6px 0;
    }
    .sign-label {
      font-size: 11px;
      color: #475569;
      font-family: monospace;
      font-weight: 700;
      text-transform: uppercase;
    }
    .footer-note {
      margin-top: 22px;
      padding-top: 10px;
      border-top: 1.5px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="doc-container">

    <!-- Formal CPA Header -->
    <table class="header-table" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align: middle; width: 62%;">
          <div class="main-title">Household Financial Statement</div>
          <div class="sub-title">OFFICIAL ACCOUNTING & CASH RECONCILIATION AUDIT</div>
          <div class="entity-line">
            Entity: <strong>${householdName.toUpperCase()}</strong> &bull; Household Code: <strong>${inviteCode || 'HFT-SECURE'}</strong>
          </div>
        </td>
        <td style="vertical-align: middle; text-align: right; width: 38%;">
          <div class="audit-stamp">&#10003; RECONCILED & BALANCED</div>
          <div style="font-size: 11.5px; font-family: monospace; color: #1e293b; font-weight: 800;">
            STATEMENT REF: ${statementRef}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 3px;">
            Statement Issued: ${generatedDate}
          </div>
        </td>
      </tr>
    </table>

    <div class="doc-rule"></div>

    <!-- Scope & Interval Summary -->
    <div class="scope-banner">
      <div>
        <div class="scope-title">${analytics.periodLabel}</div>
        <div class="scope-dates">Accounting Window: ${analytics.dateRangeText} (${analytics.daysInPeriod} active days)</div>
      </div>
      <div class="scope-stats">
        <div><strong>${analytics.transactionCount}</strong> Reconciled Entries</div>
        <div>Reporting Currency: <strong>INR (₹)</strong></div>
      </div>
    </div>

    <!-- Section 1: Statement of Financial Position & Reconciliation Summary -->
    <table class="recon-table">
      <thead>
        <tr>
          <th>ACCOUNTING RECONCILIATION SCHEDULE</th>
          <th style="text-align: right; width: 200px; white-space: nowrap;">AMOUNT (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: 700; color: #1e293b; font-size: 13.5px;">
            Gross Operating Inflow & Deposits (Total Credits)
          </td>
          <td style="text-align: right; font-weight: 800; font-size: 14px; font-family: monospace; color: #047857; white-space: nowrap;">
            +${formatInr(analytics.totalIncome)}
          </td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #1e293b; font-size: 13.5px;">
            Less: Operating Household Expenditures (Total Debits)
          </td>
          <td style="text-align: right; font-weight: 800; font-size: 14px; font-family: monospace; color: #be123c; white-space: nowrap;">
            ${formatAccountingInr(-analytics.totalExpense)}
          </td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #1e293b; font-size: 13.5px;">
            Less: Capital Dedicated to Savings & Reserve Allocations
          </td>
          <td style="text-align: right; font-weight: 800; font-size: 14px; font-family: monospace; color: #4338ca; white-space: nowrap;">
            ${formatAccountingInr(-analytics.totalSavings)}
          </td>
        </tr>
        <tr class="recon-total-row">
          <td style="color: #090d16; text-transform: uppercase;">
            NET RECONCILED CASH POSITION (OPERATING SURPLUS / DEFICIT)
          </td>
          <td style="text-align: right; font-family: monospace; font-size: 15.5px; font-weight: 800; color: ${analytics.netBalance >= 0 ? '#047857' : '#be123c'}; white-space: nowrap;">
            ${analytics.netBalance >= 0 ? '+' : ''}${formatInr(analytics.netBalance)}
          </td>
        </tr>
        <tr>
          <td style="font-size: 12px; color: #475569; padding: 8px 14px; background: #fafafa;" colspan="2">
            <strong>Key Metrics:</strong> Savings Efficiency Rate: <strong>${analytics.savingsRate}%</strong> &bull; Daily Operating Outflow Burn Rate: <strong>${formatInr(analytics.dailyAverageExpense)}/day</strong>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Section 2: Schedule A - Expenditure Classification (Full Width Table) -->
    <div class="section-header">
      <span>Schedule A: Expenditure Classification & Categorization</span>
      <span style="font-size: 11.5px; font-weight: 600; color: #475569;">${analytics.categoryBreakdown.length} Categories</span>
    </div>
    <div class="section-desc">
      Detailed categorization of all household expenses, displaying transaction volume, total debited amount, and relative percentage share of overall expenditures.
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 6%; text-align: center;">#</th>
          <th style="width: 36%;">Category</th>
          <th style="width: 10%; text-align: center;">Txns</th>
          <th style="width: 22%; text-align: right;">Debit (DR)</th>
          <th style="width: 26%; text-align: center;">Expense Share</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRowsHtml || '<tr><td colspan="5" style="padding: 14px; text-align: center; color: #64748b;">No expenditures recorded in this period.</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background-color: #f8fafc; font-weight: 800; border-top: 2px solid #94a3b8;">
          <td colspan="3" style="padding: 7px 6px; text-transform: uppercase; font-size: 11px; border-right: 1px solid #cbd5e1; letter-spacing: 0.3px;">
            Total Reconciled Expenditures
          </td>
          <td style="padding: 7px 6px; text-align: right; font-family: monospace; font-size: 12px; color: #be123c; white-space: nowrap; border-right: 1px solid #cbd5e1;">
            ${formatAccountingInr(-analytics.totalExpense)}
          </td>
          <td style="padding: 7px 6px; text-align: center; font-family: monospace; font-size: 11px; color: #334155; white-space: nowrap;">
            100% of Total
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Section 3: Schedule B - Member Inflow / Outflow Settlement (Full Width Table) -->
    <div class="section-header">
      <span>Schedule B: Member Inflow / Outflow & Settlement Ledger</span>
      <span style="font-size: 11.5px; font-weight: 600; color: #475569;">${analytics.memberBreakdown.length} Accounts</span>
    </div>
    <div class="section-desc">
      Individual member contribution summary detailing inflows deposited, household expenses settled, and final net balance.
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 28%;">Member / Account</th>
          <th style="width: 18%; text-align: right;">Inflow (CR)</th>
          <th style="width: 18%; text-align: right;">Outflow (DR)</th>
          <th style="width: 22%; text-align: right;">Net Position</th>
          <th style="width: 14%; text-align: center;">Share</th>
        </tr>
      </thead>
      <tbody>
        ${memberRowsHtml || '<tr><td colspan="5" style="padding: 14px; text-align: center; color: #64748b;">No member records found.</td></tr>'}
      </tbody>
    </table>

    ${
      showMonthlySection
        ? `
      <!-- Section 4: Schedule C - Multi-Month Trend -->
      <div class="section-header">
        <span>Schedule C: Multi-Month Cash Flow Analysis</span>
        <span style="font-size: 11.5px; font-weight: 600; color: #475569;">${analytics.monthlyTrends.length} Billing Periods</span>
      </div>
      <div class="section-desc">
        Comparative multi-month cash flow analysis highlighting operational trends and net margins across billing cycles.
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 28%;">Billing Period</th>
            <th style="width: 24%; text-align: right;">Inflow (CR)</th>
            <th style="width: 24%; text-align: right;">Outflow (DR)</th>
            <th style="width: 24%; text-align: right;">Net Margin</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyRowsHtml}
        </tbody>
      </table>
    `
        : ''
    }

    <!-- Section 5: Schedule D - Itemized Audit Ledger (7 Proportional Columns) -->
    <div class="section-header">
      <span>Schedule D: Itemized Audit Ledger & Voucher Journal</span>
      <span style="font-size: 11.5px; font-weight: 600; color: #475569;">
        Showing ${displayTxList.length} of ${analytics.filteredTransactions.length} entries
      </span>
    </div>
    <div class="section-desc">
      Chronological ledger journal of all itemized debit and credit transactions reconciled within the statement period.
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 11%; text-align: center;">Date</th>
          <th style="width: 8%; text-align: center;">Ref #</th>
          <th style="width: 30%;">Particulars & Purpose</th>
          <th style="width: 13%;">Category</th>
          <th style="width: 8%;">Paid By</th>
          <th style="width: 15%; text-align: right;">Debit (DR)</th>
          <th style="width: 15%; text-align: right;">Credit (CR)</th>
        </tr>
      </thead>
      <tbody>
        ${ledgerRowsHtml || '<tr><td colspan="7" style="padding: 16px; text-align: center; color: #64748b;">No transaction entries found for the selected timeline.</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background-color: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a; border-bottom: 3.5px double #0f172a;">
          <td colspan="5" style="padding: 8px 6px; text-transform: uppercase; font-size: 11px; border-right: 1px solid #cbd5e1; text-align: right; letter-spacing: 0.3px;">
            Statement Totals:
          </td>
          <td style="padding: 8px 6px; text-align: right; font-family: monospace; font-size: 11.5px; color: #be123c; white-space: nowrap; border-right: 1px solid #cbd5e1;">
            ${formatAccountingInr(-analytics.totalExpense)}
          </td>
          <td style="padding: 8px 6px; text-align: right; font-family: monospace; font-size: 11.5px; color: #047857; white-space: nowrap;">
            +${formatInr(analytics.totalIncome)}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Section 6: Audit Certification & Dual Sign-Off -->
    <div class="cert-box">
      <div class="cert-text">
        "I hereby certify that this Financial Statement and Reconciliation Report is an accurate, systematic representation of all recorded household funds, inflows, expenditures, and allocations for the designated accounting period. All transactions herein have been audited against household verification records."
      </div>
      <table class="sign-table">
        <tr>
          <td>
            <div class="sign-line"></div>
            <div class="sign-label">Primary Account Administrator Signature</div>
            <div style="font-size: 12.5px; font-weight: 700; color: #090d16; margin-top: 4px;">
              ${analytics.memberBreakdown[0]?.name || 'Authorized Signatory'}
            </div>
          </td>
          <td>
            <div class="sign-line"></div>
            <div class="sign-label">Household Reviewer / Co-Owner Signature</div>
            <div style="font-size: 12.5px; font-weight: 700; color: #090d16; margin-top: 4px;">
              ${analytics.memberBreakdown[1]?.name || 'Household Co-Owner'}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Official Footer Note -->
    <div class="footer-note">
      <div>Household Funds Tracker &bull; Official Financial Reconciliation Record</div>
      <div>Statement Ref: ${statementRef} &bull; Generated Automatically</div>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Directly opens a saved PDF document in the device's default PDF viewer (e.g. Google Drive, Adobe Acrobat, Files)
 * without triggering the social share sheet (WhatsApp, etc.).
 */
export async function openPdfDocument(fileUri: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS === 'android') {
      // Android 7.0+ requires a content:// URI to grant secure external app access
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/pdf',
      });
      return { success: true };
    } else if (Platform.OS === 'ios') {
      // On iOS, Sharing.shareAsync with UTI: 'com.adobe.pdf' allows direct preview or save
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
        });
        return { success: true };
      }
      return { success: false, error: 'Preview not available on this device' };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Direct open PDF viewer failed, attempting fallback:', err);
    // Graceful fallback if no default PDF viewer was registered
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
        });
        return { success: true };
      }
    } catch (fallbackErr: any) {
      return { success: false, error: err?.message || fallbackErr?.message };
    }
    return { success: false, error: err?.message || 'Could not open PDF viewer' };
  }
}

/**
 * Generates and saves the financial statement PDF directly into the device's persistent local memory.
 * Immediately invokes the default PDF viewer to view the document without social share sheets.
 */
export async function exportReportPdf(
  analytics: ReportAnalytics,
  householdName: string,
  inviteCode: string
): Promise<{ success: boolean; uri?: string; fileName?: string; error?: string }> {
  try {
    const html = generateReportHtml(analytics, householdName, inviteCode);

    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') {
        return { success: false, error: 'Web document not available' };
      }

      // 1. Remove any previous print iframe
      const existingFrame = document.getElementById('__hft_print_frame__');
      if (existingFrame) existingFrame.remove();

      // 2. Create an isolated hidden iframe
      const iframe = document.createElement('iframe');
      iframe.id = '__hft_print_frame__';
      iframe.setAttribute(
        'style',
        'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none;'
      );
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        throw new Error('Failed to access print frame document');
      }

      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      // 3. Give iframe time to parse CSS and fonts, then print ONLY the iframe document
      await new Promise((resolve) => setTimeout(resolve, 350));

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // 4. Clean up after print dialog finishes
      setTimeout(() => {
        iframe.remove();
      }, 4000);

      return { success: true };
    }

    // Native iOS and Android
    // 1. Generate PDF with base64 enabled so we can write directly to persistent local memory
    const { uri, base64 } = await Print.printToFileAsync({
      html,
      base64: true,
    });

    // 2. Save persistently to documentDirectory (persistent local memory on user's device)
    const sanitizedPeriod = (analytics.periodLabel || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Financial_Report_${sanitizedPeriod}_${Date.now()}.pdf`;
    const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const destinationUri = targetDir ? `${targetDir}${fileName}` : uri;

    let savedUri = uri;

    if (targetDir) {
      try {
        if (base64) {
          // Write directly to persistent documentDirectory from base64
          await FileSystem.writeAsStringAsync(destinationUri, base64, {
            encoding: 'base64',
          });
          savedUri = destinationUri;
        } else {
          await FileSystem.copyAsync({
            from: uri,
            to: destinationUri,
          });
          savedUri = destinationUri;
        }
      } catch (fsErr) {
        console.warn('Could not relocate PDF to document directory, falling back to original uri:', fsErr);
        savedUri = uri;
      }
    }

    // 3. Directly open the saved PDF document in the default viewer (No social share sheet!)
    await openPdfDocument(savedUri);

    return { success: true, uri: savedUri, fileName };
  } catch (err: any) {
    console.error('Error generating report PDF:', err);
    return { success: false, error: err?.message || 'Failed to generate PDF' };
  }
}
