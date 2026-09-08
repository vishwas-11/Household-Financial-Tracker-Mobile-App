// src/lib/reportGenerator.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
        const lastTxDate = parseTxDate(sorted[sorted.length - 1]);
        endDate = new Date(Math.max(now.getTime(), lastTxDate.getTime()));
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        endDate = now;
      }
      periodLabel = 'Comprehensive Reconciliation Statement - Cumulative Ledger';
      break;
    }
    case 'this_month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      endDate = new Date(now.getFullYear(), now.getMonth(), lastDay, 23, 59, 59);
      const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      periodLabel = `Monthly Statement - ${monthName}`;
      break;
    }
    case 'last_30_days': {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      periodLabel = 'Rolling 30-Day Financial Performance Audit';
      break;
    }
    case 'specific_month': {
      const year = scope.year ?? now.getFullYear();
      const month = scope.month ?? now.getMonth();
      startDate = new Date(year, month, 1, 0, 0, 0);
      const lastDay = new Date(year, month + 1, 0).getDate();
      endDate = new Date(year, month, lastDay, 23, 59, 59);
      const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      periodLabel = `Monthly Statement - ${monthName}`;
      break;
    }
    case 'past_12_months': {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0);
      periodLabel = 'Past 12 Months Comprehensive Audit';
      break;
    }
    case 'specific_year': {
      const year = scope.year ?? now.getFullYear();
      startDate = new Date(year, 0, 1, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59);
      periodLabel = `Annual Financial Statement - Fiscal Year ${year}`;
      break;
    }
  }

  // Filter transactions within the interval
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  const filtered = transactions.filter((tx) => {
    const d = parseTxDate(tx);
    const t = d.getTime();
    return t >= startTime && t <= endTime;
  });

  // Sort descending by date
  filtered.sort((a, b) => parseTxDate(b).getTime() - parseTxDate(a).getTime());

  // Calculations
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSavings = 0;
  let largestExpense: Transaction | null = null;
  let largestIncome: Transaction | null = null;

  const categoryMap: { [cat: string]: { amount: number; count: number } } = {};
  const memberSpentMap: { [mid: string]: number } = {};
  const memberEarnedMap: { [mid: string]: number } = {};

  filtered.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
      memberEarnedMap[tx.memberId] = (memberEarnedMap[tx.memberId] || 0) + tx.amount;
      if (!largestIncome || tx.amount > largestIncome.amount) {
        largestIncome = tx;
      }
    } else if (tx.type === 'expenditure') {
      totalExpense += tx.amount;
      memberSpentMap[tx.memberId] = (memberSpentMap[tx.memberId] || 0) + tx.amount;

      if (!categoryMap[tx.category]) {
        categoryMap[tx.category] = { amount: 0, count: 0 };
      }
      categoryMap[tx.category].amount += tx.amount;
      categoryMap[tx.category].count += 1;

      if (!largestExpense || tx.amount > largestExpense.amount) {
        largestExpense = tx;
      }
    } else if (tx.type === 'savings') {
      totalSavings += tx.amount;
    }
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

  const diffMs = Math.max(1, endTime - startTime);
  const daysInPeriod = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)));
  const dailyAverageExpense = Math.round(totalExpense / daysInPeriod);

  // Category Breakdown
  const categoryBreakdown = Object.keys(categoryMap)
    .map((cat) => {
      const data = categoryMap[cat];
      return {
        category: cat,
        amount: data.amount,
        count: data.count,
        percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Member Breakdown
  const memberBreakdown = members.map((m) => {
    const spent = memberSpentMap[m.id] || 0;
    const earned = memberEarnedMap[m.id] || 0;
    return {
      memberId: m.id,
      name: m.name,
      avatarLetter: m.avatarLetter,
      colorBg: m.colorBg,
      colorText: m.colorText,
      totalSpent: spent,
      totalEarned: earned,
      netBalance: earned - spent,
      expensePercentage: totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0,
    };
  });

  // Monthly trends (group by YYYY-MM)
  const monthMap: { [mKey: string]: { income: number; expense: number } } = {};
  filtered.forEach((tx) => {
    const d = parseTxDate(tx);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!monthMap[key]) {
      monthMap[key] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') monthMap[key].income += tx.amount;
    if (tx.type === 'expenditure') monthMap[key].expense += tx.amount;
  });

  const monthlyTrends = Object.keys(monthMap)
    .sort()
    .map((mKey) => {
      const parts = mKey.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const inc = monthMap[mKey].income;
      const exp = monthMap[mKey].expense;
      return {
        monthKey: mKey,
        monthName,
        income: inc,
        expense: exp,
        net: inc - exp,
      };
    });

  const startFormatted = startDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const endFormatted = endDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const dateRangeText = `${startFormatted} - ${endFormatted}`;

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
 * Standard Indian Currency Formatter with Rupee symbol &#8377;
 */
function formatInr(val: number): string {
  const isNeg = val < 0;
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNeg ? '-' : ''}&#8377;${formatted}`;
}

/**
 * Accounting Parentheses Formatter for Debits & Negatives
 */
function formatAccountingInr(val: number): string {
  const isNeg = val < 0;
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNeg ? `(&#8377;${formatted})` : `&#8377;${formatted}`;
}

/**
 * Generates an executive CPA-grade Financial Statement & Reconciliation Report HTML document
 */
export function generateReportHtml(
  analytics: ReportAnalytics,
  householdName: string,
  inviteCode: string
): string {
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const verificationCode = `HFT-REC-${(inviteCode || 'DEMO').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // Schedule A: Category Table Rows
  const categoryRowsHtml = analytics.categoryBreakdown
    .map(
      (cat, idx) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #64748b; width: 30px;">
          ${(idx + 1).toString().padStart(2, '0')}
        </td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">
          ${cat.category}
        </td>
        <td style="padding: 7px 10px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #475569; font-family: monospace;">
          ${cat.count}
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; font-family: monospace;">
          ${formatInr(cat.amount)}
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 600; color: #475569; width: 60px;">
          ${cat.percentage}%
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; width: 110px;">
          <div style="height: 6px; background-color: #f1f5f9; border-radius: 3px; overflow: hidden; width: 100%;">
            <div style="height: 100%; width: ${Math.min(100, Math.max(2, cat.percentage))}%; background-color: #4f46e5; border-radius: 3px;"></div>
          </div>
        </td>
      </tr>
    `
    )
    .join('');

  // Schedule B: Member Breakdown Rows
  const memberRowsHtml = analytics.memberBreakdown
    .map(
      (m) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; background: ${m.colorBg}; color: ${m.colorText}; text-align: center; line-height: 20px; font-weight: 700; font-size: 10px; font-family: monospace;">
              ${m.avatarLetter}
            </span>
            <span style="font-weight: 600; color: #0f172a;">${m.name}</span>
          </div>
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #059669; font-weight: 600; font-family: monospace;">
          +${formatInr(m.totalEarned)}
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #e11d48; font-weight: 600; font-family: monospace;">
          ${formatAccountingInr(-m.totalSpent)}
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-family: monospace; color: ${m.netBalance >= 0 ? '#059669' : '#e11d48'};">
          ${m.netBalance >= 0 ? '+' : ''}${formatInr(m.netBalance)}
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-family: monospace;">
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
        <td style="padding: 7px 10px; font-weight: 600; border-bottom: 1px solid #e2e8f0; color: #0f172a;">
          ${mt.monthName}
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #059669; font-family: monospace; font-weight: 600;">
          +${formatInr(mt.income)}
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #e11d48; font-family: monospace; font-weight: 600;">
          ${formatAccountingInr(-mt.expense)}
        </td>
        <td style="padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-family: monospace; color: ${
          mt.net >= 0 ? '#059669' : '#e11d48'
        };">
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
      const debitColor = isIncome ? '#94a3b8' : '#e11d48';
      const creditColor = isIncome ? '#059669' : '#94a3b8';

      return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; font-family: monospace; color: #64748b; white-space: nowrap;">
          ${tx.fullDate || tx.date}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; font-family: monospace; color: #475569;">
          #${tx.id.slice(-6).toUpperCase()}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a; font-size: 11px;">
          ${tx.description}
          ${
            tx.notes
              ? `<div style="font-size: 9.5px; color: #64748b; font-weight: normal; margin-top: 1px;">Note: ${tx.notes}</div>`
              : ''
          }
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; color: #475569;">
          ${tx.category}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; color: #334155;">
          ${tx.memberName || 'Household'}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; text-align: center; font-family: monospace; font-size: 9.5px; font-weight: 700; color: ${isIncome ? '#059669' : '#e11d48'};">
          ${typeLabel}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; font-size: 11px; font-weight: 600; color: ${debitColor}; white-space: nowrap;">
          ${debitText}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; font-size: 11px; font-weight: 700; color: ${creditColor}; white-space: nowrap;">
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
      margin: 12mm 14mm;
    }
    @media print {
      html, body {
        width: 100%;
        background: #ffffff !important;
        color: #0f172a !important;
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
      color: #0f172a;
      background-color: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
      padding: 10px 14px;
    }
    .doc-container {
      max-width: 820px;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .main-title {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .sub-title {
      font-size: 11px;
      font-weight: 600;
      color: #4f46e5;
      margin-top: 2px;
    }
    .entity-line {
      font-size: 10.5px;
      color: #475569;
      margin-top: 3px;
    }
    .audit-stamp {
      display: inline-block;
      padding: 4px 8px;
      background-color: #ecfdf5;
      border: 1px solid #10b981;
      border-radius: 4px;
      font-family: monospace;
      font-size: 10px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .doc-rule {
      border: none;
      border-top: 2px solid #0f172a;
      border-bottom: 1px solid #cbd5e1;
      height: 4px;
      margin: 8px 0 14px 0;
    }
    .scope-banner {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .scope-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .scope-dates {
      font-size: 10px;
      color: #64748b;
      font-family: monospace;
      margin-top: 2px;
    }
    .scope-stats {
      text-align: right;
      font-size: 10px;
      color: #475569;
      font-family: monospace;
    }
    .recon-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      border: 1px solid #cbd5e1;
    }
    .recon-table th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 8px 12px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: left;
    }
    .recon-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .recon-total-row td {
      background-color: #f8fafc;
      font-weight: 800;
      font-size: 12px;
      border-top: 2px solid #0f172a;
      border-bottom: 3px double #0f172a;
    }
    .section-header {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0f172a;
      margin: 16px 0 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 16px;
    }
    .data-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 7px 10px;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }
    .cert-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background-color: #f8fafc;
      padding: 12px 16px;
      margin-top: 22px;
      page-break-inside: avoid;
    }
    .cert-text {
      font-size: 10px;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 16px;
      font-style: italic;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
    }
    .sign-table td {
      width: 50%;
      vertical-align: top;
      padding-right: 20px;
    }
    .sign-line {
      border-bottom: 1px solid #475569;
      margin: 22px 0 4px 0;
    }
    .sign-label {
      font-size: 9.5px;
      color: #64748b;
      font-family: monospace;
      text-transform: uppercase;
    }
    .footer-note {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
      font-family: monospace;
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
          <div style="font-size: 10px; font-family: monospace; color: #334155; font-weight: 700;">
            REF: ${verificationCode}
          </div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
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
          <th style="text-align: right; width: 180px;">AMOUNT (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: 600; color: #1e293b;">
            Gross Operating Inflow & Deposits (Total Credits)
          </td>
          <td style="text-align: right; font-weight: 700; font-family: monospace; color: #059669;">
            +${formatInr(analytics.totalIncome)}
          </td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #1e293b;">
            Less: Operating Household Expenditures (Total Debits)
          </td>
          <td style="text-align: right; font-weight: 700; font-family: monospace; color: #e11d48;">
            ${formatAccountingInr(-analytics.totalExpense)}
          </td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #1e293b;">
            Less: Capital Dedicated to Savings & Reserve Allocations
          </td>
          <td style="text-align: right; font-weight: 700; font-family: monospace; color: #4f46e5;">
            ${formatAccountingInr(-analytics.totalSavings)}
          </td>
        </tr>
        <tr class="recon-total-row">
          <td style="color: #0f172a; text-transform: uppercase;">
            NET RECONCILED CASH POSITION (OPERATING SURPLUS / DEFICIT)
          </td>
          <td style="text-align: right; font-family: monospace; color: ${analytics.netBalance >= 0 ? '#059669' : '#e11d48'};">
            ${analytics.netBalance >= 0 ? '+' : ''}${formatInr(analytics.netBalance)}
          </td>
        </tr>
        <tr>
          <td style="font-size: 10px; color: #64748b; padding: 6px 12px; background: #fafafa;" colspan="2">
            <strong>Key Metrics:</strong> Savings Efficiency Rate: <strong>${analytics.savingsRate}%</strong> &bull; Daily Operating Outflow Burn Rate: <strong>${formatInr(analytics.dailyAverageExpense)}/day</strong>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Section 2: Schedule A & Schedule B Grid -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed;">
      <tr>
        <!-- Left: Category Schedule -->
        <td style="width: 54%; vertical-align: top; padding-right: 10px;">
          <div class="section-header">
            <span>Schedule A: Expenditure Classification</span>
            <span style="font-size: 9px; font-weight: normal; color: #64748b;">${analytics.categoryBreakdown.length} Categories</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th>Classification</th>
                <th style="text-align: center; width: 40px;">Txns</th>
                <th style="text-align: right;">Debited</th>
                <th style="text-align: right;">Share</th>
                <th style="text-align: right;">Ratio</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRowsHtml || '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #94a3b8;">No expenditures recorded in this period.</td></tr>'}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                <td colspan="3" style="padding: 6px 10px; text-transform: uppercase; font-size: 9.5px;">Total Expenditures</td>
                <td style="padding: 6px 10px; text-align: right; font-family: monospace; color: #e11d48;">
                  ${formatAccountingInr(-analytics.totalExpense)}
                </td>
                <td style="padding: 6px 10px; text-align: right; font-family: monospace;">100%</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </td>

        <!-- Right: Member Settlement Schedule -->
        <td style="width: 46%; vertical-align: top; padding-left: 10px;">
          <div class="section-header">
            <span>Schedule B: Member Inflow / Outflow</span>
            <span style="font-size: 9px; font-weight: normal; color: #64748b;">${analytics.memberBreakdown.length} Accounts</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th style="text-align: right;">Inflow</th>
                <th style="text-align: right;">Outflow</th>
                <th style="text-align: right;">Net</th>
                <th style="text-align: right;">Share</th>
              </tr>
            </thead>
            <tbody>
              ${memberRowsHtml || '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8;">No records</td></tr>'}
            </tbody>
          </table>
        </td>
      </tr>
    </table>

    ${
      showMonthlySection
        ? `
      <!-- Section 3: Schedule C - Multi-Month Trend -->
      <div class="section-header">
        <span>Schedule C: Multi-Month Cash Flow Analysis</span>
        <span style="font-size: 9px; font-weight: normal; color: #64748b;">${analytics.monthlyTrends.length} Billing Periods</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Billing Period</th>
            <th style="text-align: right;">Gross Inflow (CR)</th>
            <th style="text-align: right;">Household Outflow (DR)</th>
            <th style="text-align: right;">Net Operating Margin</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyRowsHtml}
        </tbody>
      </table>
    `
        : ''
    }

    <!-- Section 4: Schedule D - Itemized Audit Ledger -->
    <div class="section-header">
      <span>Schedule D: Itemized Audit Ledger & Voucher Journal</span>
      <span style="font-size: 9px; font-weight: normal; color: #64748b;">
        Showing ${displayTxList.length} of ${analytics.filteredTransactions.length} entries
      </span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 70px;">Date</th>
          <th style="width: 55px;">Ref #</th>
          <th>Particulars & Purpose</th>
          <th style="width: 85px;">Category</th>
          <th style="width: 85px;">Paid By</th>
          <th style="width: 40px; text-align: center;">Type</th>
          <th style="width: 85px; text-align: right;">Debit (DR)</th>
          <th style="width: 85px; text-align: right;">Credit (CR)</th>
        </tr>
      </thead>
      <tbody>
        ${ledgerRowsHtml || '<tr><td colspan="8" style="padding: 14px; text-align: center; color: #94a3b8;">No transaction entries found for the selected timeline.</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background-color: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a; border-bottom: 3px double #0f172a;">
          <td colspan="5" style="padding: 8px 10px; text-transform: uppercase; font-size: 10px;">
            Cumulative Statement Totals
          </td>
          <td style="text-align: center; font-family: monospace;">-</td>
          <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #e11d48;">
            ${formatAccountingInr(-analytics.totalExpense)}
          </td>
          <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #059669;">
            +${formatInr(analytics.totalIncome)}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Section 5: Audit Certification & Dual Sign-Off -->
    <div class="cert-box">
      <div class="cert-text">
        "I hereby certify that this Financial Statement and Reconciliation Report is an accurate, systematic representation of all recorded household funds, inflows, expenditures, and allocations for the designated accounting period. All transactions herein have been audited against household verification records."
      </div>
      <table class="sign-table">
        <tr>
          <td>
            <div class="sign-line"></div>
            <div class="sign-label">Primary Account Administrator Signature</div>
            <div style="font-size: 10px; font-weight: 600; color: #1e293b; margin-top: 2px;">
              ${analytics.memberBreakdown[0]?.name || 'Authorized Signatory'}
            </div>
          </td>
          <td>
            <div class="sign-line"></div>
            <div class="sign-label">Household Reviewer / Co-Owner Signature</div>
            <div style="font-size: 10px; font-weight: 600; color: #1e293b; margin-top: 2px;">
              ${analytics.memberBreakdown[1]?.name || 'Household Co-Owner'}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Official Footer Note -->
    <div class="footer-note">
      <div>Household Funds Tracker &bull; Official Financial Reconciliation Archive</div>
      <div>Security Hash: ${verificationCode} &bull; Confidential</div>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Triggers printing of ONLY the isolated financial statement document.
 * On Web: Writes HTML into a hidden iframe and prints that iframe exclusively,
 * preventing any app UI (dashboard, buttons, localhost:8081) from printing.
 * On iOS/Android: Uses expo-print to generate a PDF and opens the native share sheet.
 */
export async function exportReportPdf(
  analytics: ReportAnalytics,
  householdName: string,
  inviteCode: string
): Promise<{ success: boolean; uri?: string; error?: string }> {
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
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${analytics.periodLabel} - ${householdName}`,
      });
    }

    return { success: true, uri };
  } catch (err: any) {
    console.error('Error generating report PDF:', err);
    return { success: false, error: err?.message || 'Failed to generate PDF' };
  }
}
