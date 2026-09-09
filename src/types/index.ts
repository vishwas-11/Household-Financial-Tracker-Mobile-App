// src/types/index.ts

export type TransactionType = 'income' | 'expenditure' | 'savings';

export type TabType = 'dashboard' | 'ledger' | 'recurring' | 'members' | 'settings';

export interface Member {
  id: string;
  name: string;
  avatarLetter: string;
  colorBg: string;
  colorText: string;
  role: string;
  email: string;
  totalIncome?: number;
  totalExpense?: number;
}

export interface Transaction {
  id: string;
  date: string; // e.g. "Oct 24"
  fullDate: string; // e.g. "2023-10-24"
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  memberId: string;
  memberName: string;
  notes?: string;
  receiptUrl?: string; // Supabase Storage public URL or attachment path
  isRecurring?: boolean;
}

export interface RecurringItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: TransactionType;
  frequency: 'Monthly' | 'Bi-weekly' | 'Weekly' | 'Annual';
  nextDueDate: string;
  autoPay: boolean;
  memberId: string;
}

export interface MonthlyCashFlow {
  month: string;
  income: number;
  expenditure: number;
}

export interface HouseholdInfo {
  id: string;
  name: string;
  inviteCode: string;
  role?: string;
  isOwner?: boolean;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  householdId?: string;
  householdName?: string;
  inviteCode?: string;
  availableHouseholds?: HouseholdInfo[];
}
