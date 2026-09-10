// src/constants/initialData.ts
import { Member, Transaction, RecurringItem, MonthlyCashFlow } from '../types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'primary-admin',
    name: 'Primary Account',
    avatarLetter: 'P',
    colorBg: '#5e6ad2',
    colorText: '#ffffff',
    role: 'Primary Account',
    email: '',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_RECURRING: RecurringItem[] = [];

export const getTrailingMonths = (): MonthlyCashFlow[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const res: MonthlyCashFlow[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push({
      month: months[d.getMonth()],
      income: 0,
      expenditure: 0,
    });
  }
  return res;
};

export const MONTHLY_CASH_FLOW_DATA: MonthlyCashFlow[] = getTrailingMonths();

export const EXPENSE_CATEGORIES: string[] = [
  'Housing',
  'Groceries',
  'Utilities',
  'Bills',
  'Dining',
  'Transport',
  'Health',
  'Shopping',
  'Entertainment',
  'Education',
  'Other',
];

export const INCOME_CATEGORIES: string[] = [
  'Salary',
  'Investment',
  'Business',
  'Freelance',
  'Rental',
  'Bonus',
  'Savings',
  'Other',
];

export const TRANSACTION_CATEGORIES: string[] = [
  'Housing',
  'Groceries',
  'Utilities',
  'Bills',
  'Dining',
  'Transport',
  'Health',
  'Shopping',
  'Entertainment',
  'Education',
  'Salary',
  'Investment',
  'Business',
  'Freelance',
  'Rental',
  'Bonus',
  'Savings',
  'Other',
];
