// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  Member,
  RecurringItem,
  MonthlyCashFlow,
  UserSession,
  HouseholdInfo,
} from '../types';
import {
  INITIAL_MEMBERS,
  getTrailingMonths,
} from '../constants/initialData';
import {
  getUserSession,
  clearUserSession,
  signInWithCredentials,
  signUpWithCredentials,
  createHouseholdForUser,
  joinHouseholdWithCode,
  fetchUserHouseholds,
  saveUserSession,
} from '../lib/auth';
import { supabase } from '../lib/supabase';
import { buildTransactionFromRecurring, getRecurringScheduleInfo } from '../lib/recurringManager';

interface AppContextType {
  user: UserSession | null;
  householdName: string;
  inviteCode: string;
  transactions: Transaction[];
  members: Member[];
  recurringItems: RecurringItem[];
  monthlyCashFlow: MonthlyCashFlow[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasDismissedOnboarding: boolean;

  // Multi-household switcher state & methods
  userHouseholds: HouseholdInfo[];
  activeHouseholdId: string | null;
  isHouseholdSwitcherOpen: boolean;
  openHouseholdSwitcher: () => void;
  closeHouseholdSwitcher: () => void;
  switchHousehold: (householdId: string) => Promise<{ success: boolean; error?: string }>;

  // Auth & Household methods
  login: (email: string, pass: string) => Promise<{ success: boolean; session?: UserSession; error?: string }>;
  signup: (name: string, email: string, pass: string) => Promise<{ success: boolean; session?: UserSession; error?: string }>;
  logout: () => Promise<void>;
  createHousehold: (name: string) => Promise<{ success: boolean; error?: string }>;
  joinHousehold: (code: string) => Promise<{ success: boolean; error?: string }>;

  // Data modification methods
  addTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<{ success: boolean; error?: string }>;
  addRecurring: (item: RecurringItem) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  deductRecurringNow: (item: RecurringItem) => Promise<void>;
  addMember: (member: Member) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  updateHouseholdName: (name: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  resetToDemoData: () => void;
  refreshData: () => Promise<void>;
  dismissOnboarding: () => void;
  resetOnboarding: () => void;

  // Interactive Onboarding Tour
  hasCompletedTutorial: boolean;
  isTutorialVisible: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => Promise<void>;
  resetTutorial: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'HF-';
  for (let i = 0; i < 5; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function computeDynamicCashFlow(txList: Transaction[]): MonthlyCashFlow[] {
  const base = getTrailingMonths();
  txList.forEach((tx) => {
    base.forEach((slot) => {
      const matchMonth = tx.date.toLowerCase().includes(slot.month.toLowerCase());
      if (matchMonth) {
        if (tx.type === 'income') slot.income += tx.amount;
        if (tx.type === 'expenditure') slot.expenditure += tx.amount;
      }
    });
  });
  return base;
}

const ONBOARDING_DISMISSED_KEY = '@hft_onboarding_dismissed';
const TUTORIAL_COMPLETED_KEY = '@hft_tutorial_completed';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [householdName, setHouseholdName] = useState<string>('My Household');
  const [inviteCode, setInviteCode] = useState<string>(generateInviteCode());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [monthlyCashFlow, setMonthlyCashFlow] = useState<MonthlyCashFlow[]>(getTrailingMonths());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState<boolean>(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean>(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState<boolean>(false);
  const [userHouseholds, setUserHouseholds] = useState<HouseholdInfo[]>([]);
  const [isHouseholdSwitcherOpen, setIsHouseholdSwitcherOpen] = useState<boolean>(false);

  const openHouseholdSwitcher = () => setIsHouseholdSwitcherOpen(true);
  const closeHouseholdSwitcher = () => setIsHouseholdSwitcherOpen(false);

  // Load onboarding dismissal state
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DISMISSED_KEY).then((val) => {
      if (val === 'true') setHasDismissedOnboarding(true);
    });
    AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY).then((val) => {
      if (val === 'true') setHasCompletedTutorial(true);
    });
  }, []);

  const dismissOnboarding = async () => {
    setHasDismissedOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
  };

  const resetOnboarding = async () => {
    setHasDismissedOnboarding(false);
    await AsyncStorage.removeItem(ONBOARDING_DISMISSED_KEY);
  };

  const openTutorial = () => setIsTutorialVisible(true);
  const closeTutorial = () => setIsTutorialVisible(false);

  const completeTutorial = async () => {
    setHasCompletedTutorial(true);
    setIsTutorialVisible(false);
    await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  };

  const resetTutorial = async () => {
    setHasCompletedTutorial(false);
    await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    setIsTutorialVisible(true);
  };

  // Load app data for the active household from Supabase
  const loadHouseholdData = useCallback(async (householdId?: string, currentUser?: UserSession | null) => {
    try {
      if (householdId) {
        // 1. Fetch Household Details
        const { data: hh } = await supabase
          .from('households')
          .select('name, invite_code')
          .eq('id', householdId)
          .maybeSingle();

        if (hh?.name) setHouseholdName(hh.name);
        if (hh?.invite_code) setInviteCode(hh.invite_code);

        // 2. Fetch Transactions
        const { data: dbTx } = await supabase
          .from('transactions')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false });

        if (dbTx && dbTx.length > 0) {
          const loaded = dbTx.map((t: any) => ({
            id: t.id,
            date: t.date,
            fullDate: t.full_date,
            description: t.description,
            category: t.category,
            type: t.type,
            amount: Number(t.amount),
            memberId: t.member_id,
            memberName: t.member_name,
            notes: t.notes || undefined,
            receiptUrl: t.receipt_url || undefined,
            isRecurring: t.is_recurring || false,
          }));
          setTransactions(loaded);
          setMonthlyCashFlow(computeDynamicCashFlow(loaded));
        } else {
          setTransactions([]);
          setMonthlyCashFlow(getTrailingMonths());
        }

        // 3. Fetch Members
        const { data: dbMembers } = await supabase
          .from('members')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true });

        if (dbMembers && dbMembers.length > 0) {
          setMembers(
            dbMembers.map((m: any) => ({
              id: m.id,
              name: m.name,
              avatarLetter: m.avatar_letter,
              colorBg: m.color_bg,
              colorText: m.color_text,
              role: m.role,
              email: m.email,
            }))
          );
        } else if (currentUser) {
          setMembers([
            {
              id: currentUser.userId,
              name: currentUser.name || 'Account Admin',
              avatarLetter: (currentUser.name || 'A')[0].toUpperCase(),
              colorBg: '#5e6ad2',
              colorText: '#ffffff',
              role: 'Primary Account',
              email: currentUser.email,
            },
          ]);
        }

        // 4. Fetch Recurring Items
        const { data: dbRec } = await supabase
          .from('recurring_items')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true });

        if (dbRec && dbRec.length > 0) {
          setRecurringItems(
            dbRec.map((r: any) => ({
              id: r.id,
              title: r.title,
              category: r.category,
              amount: Number(r.amount),
              type: r.type,
              frequency: r.frequency,
              nextDueDate: r.next_due_date,
              autoPay: r.auto_pay,
              memberId: r.member_id,
            }))
          );
        } else {
          setRecurringItems([]);
        }
      }
    } catch (err) {
      console.warn('Error loading Supabase data:', err);
    }
  }, []);

  // Check stored session on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const session = await getUserSession();
        if (isMounted) {
          setUser(session);
          if (session?.userId) {
            const hhs = session.availableHouseholds && session.availableHouseholds.length > 0
              ? session.availableHouseholds
              : await fetchUserHouseholds(session.userId);
            setUserHouseholds(hhs);
          }
          if (session?.householdId) {
            await loadHouseholdData(session.householdId, session);
          } else if (session) {
            setMembers([
              {
                id: session.userId,
                name: session.name || 'Account Admin',
                avatarLetter: (session.name || 'A')[0].toUpperCase(),
                colorBg: '#5e6ad2',
                colorText: '#ffffff',
                role: 'Primary Account',
                email: session.email,
              },
            ]);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [loadHouseholdData]);

  // Auth: Login
  const login = async (email: string, pass: string) => {
    const res = await signInWithCredentials(email, pass);
    if (res.success && res.session) {
      setUser(res.session);
      if (res.session.availableHouseholds) {
        setUserHouseholds(res.session.availableHouseholds);
      } else if (res.session.userId) {
        fetchUserHouseholds(res.session.userId).then(setUserHouseholds);
      }
      if (res.session.householdId) {
        await loadHouseholdData(res.session.householdId, res.session);
      }
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Auth: Signup
  const signup = async (name: string, email: string, pass: string) => {
    const res = await signUpWithCredentials(name, email, pass);
    if (res.success && res.session) {
      setUser(res.session);
      setMembers([
        {
          id: res.session.userId,
          name: res.session.name || name,
          avatarLetter: (name || 'A')[0].toUpperCase(),
          colorBg: '#5e6ad2',
          colorText: '#ffffff',
          role: 'Primary Account',
          email: res.session.email,
        },
      ]);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Auth: Logout
  const logout = async () => {
    await clearUserSession();
    setUser(null);
    setUserHouseholds([]);
    setIsHouseholdSwitcherOpen(false);
    setHouseholdName('My Household');
    setInviteCode(generateInviteCode());
    setTransactions([]);
    setMembers(INITIAL_MEMBERS);
    setRecurringItems([]);
    setMonthlyCashFlow(getTrailingMonths());
  };

  // Multi-Household Switcher: Switch active household
  const switchHousehold = async (targetHouseholdId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not signed in.' };
    try {
      setIsLoading(true);
      const targetHh = userHouseholds.find((h) => h.id === targetHouseholdId);
      let hhName = targetHh?.name;
      let hhCode = targetHh?.inviteCode;

      if (!hhName || !hhCode) {
        const { data: dbHh } = await supabase
          .from('households')
          .select('id, name, invite_code')
          .eq('id', targetHouseholdId)
          .maybeSingle();

        if (dbHh) {
          hhName = dbHh.name;
          hhCode = dbHh.invite_code;
        }
      }

      const freshList = await fetchUserHouseholds(user.userId);
      setUserHouseholds(freshList);

      const updatedSession: UserSession = {
        ...user,
        householdId: targetHouseholdId,
        householdName: hhName || householdName,
        inviteCode: hhCode || inviteCode,
        availableHouseholds: freshList,
      };

      await saveUserSession(updatedSession);
      setUser(updatedSession);
      if (hhName) setHouseholdName(hhName);
      if (hhCode) setInviteCode(hhCode);

      await loadHouseholdData(targetHouseholdId, updatedSession);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to switch household.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Household: Create
  const createHousehold = async (name: string) => {
    if (!user) return { success: false, error: 'User not signed in.' };
    const res = await createHouseholdForUser(name, user);
    if (res.success && res.session) {
      setUser(res.session);
      if (res.session.householdName) setHouseholdName(res.session.householdName);
      if (res.session.inviteCode) setInviteCode(res.session.inviteCode);
      if (res.session.availableHouseholds) {
        setUserHouseholds(res.session.availableHouseholds);
      } else {
        const list = await fetchUserHouseholds(user.userId);
        setUserHouseholds(list);
      }
      await loadHouseholdData(res.session.householdId, res.session);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Household: Join
  const joinHousehold = async (code: string) => {
    if (!user) return { success: false, error: 'User not signed in.' };
    const res = await joinHouseholdWithCode(code, user);
    if (res.success && res.session) {
      setUser(res.session);
      if (res.session.householdName) setHouseholdName(res.session.householdName);
      if (res.session.inviteCode) setInviteCode(res.session.inviteCode);
      if (res.session.availableHouseholds) {
        setUserHouseholds(res.session.availableHouseholds);
      } else {
        const list = await fetchUserHouseholds(user.userId);
        setUserHouseholds(list);
      }
      await loadHouseholdData(res.session.householdId, res.session);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Add Transaction
  const addTransaction = async (tx: Transaction) => {
    setTransactions((prev) => {
      const updated = [tx, ...prev];
      setMonthlyCashFlow(computeDynamicCashFlow(updated));
      return updated;
    });

    // Persist to Supabase if household exists
    if (user?.householdId) {
      try {
        await supabase.from('transactions').insert({
          id: tx.id,
          household_id: user.householdId,
          date: tx.date,
          full_date: tx.fullDate,
          description: tx.description,
          category: tx.category,
          type: tx.type,
          amount: tx.amount,
          member_id: tx.memberId,
          member_name: tx.memberName,
          notes: tx.notes || null,
          receipt_url: tx.receiptUrl || null,
          is_recurring: tx.isRecurring || false,
        });
      } catch (err) {
        console.warn('Supabase insert transaction error:', err);
      }
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      setMonthlyCashFlow(computeDynamicCashFlow(updated));
      return updated;
    });

    if (user?.householdId) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete transaction error:', err);
      }
    }
  };

  // Update Transaction (e.g. category edit)
  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<{ success: boolean; error?: string }> => {
    // Optimistically update local state
    setTransactions((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      setMonthlyCashFlow(computeDynamicCashFlow(updated));
      return updated;
    });

    if (user?.householdId) {
      try {
        // Map camelCase fields to snake_case DB columns
        const dbUpdates: Record<string, unknown> = {};
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
        if (updates.type !== undefined) dbUpdates.type = updates.type;

        const { error } = await supabase
          .from('transactions')
          .update(dbUpdates)
          .eq('id', id);

        if (error) {
          console.warn('Supabase update transaction error:', error);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('Supabase update transaction error:', err);
        return { success: false, error: err?.message || 'Unknown error' };
      }
    }
    return { success: true };
  };

  // Add Recurring Item
  const addRecurring = async (item: RecurringItem) => {
    setRecurringItems((prev) => [...prev, item]);
    if (user?.householdId) {
      try {
        await supabase.from('recurring_items').insert({
          id: item.id,
          household_id: user.householdId,
          title: item.title,
          category: item.category,
          amount: item.amount,
          type: item.type,
          frequency: item.frequency,
          next_due_date: item.nextDueDate,
          auto_pay: item.autoPay,
          member_id: item.memberId,
        });
      } catch (err) {
        console.warn('Supabase insert recurring error:', err);
      }
    }
  };

  // Deduct / Execute Recurring Item into Ledger
  const deductRecurringNow = async (item: RecurringItem) => {
    const tx = buildTransactionFromRecurring(item, members);
    await addTransaction(tx);
  };

  // Auto-deduct recurring obligations on their due date
  useEffect(() => {
    if (isLoading || recurringItems.length === 0) return;
    const today = new Date();
    recurringItems.forEach((item) => {
      const info = getRecurringScheduleInfo(item, transactions, today);
      if (info.isDueToday && !info.isSettledThisMonth && item.autoPay) {
        deductRecurringNow(item);
      }
    });
  }, [isLoading, recurringItems, transactions]);

  // Delete Recurring Item
  const deleteRecurring = async (id: string) => {
    setRecurringItems((prev) => prev.filter((r) => r.id !== id));
    if (user?.householdId) {
      try {
        await supabase.from('recurring_items').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete recurring error:', err);
      }
    }
  };

  // Add Member
  const addMember = async (m: Member) => {
    setMembers((prev) => [...prev, m]);
    if (user?.householdId) {
      try {
        await supabase.from('members').insert({
          id: m.id,
          household_id: user.householdId,
          name: m.name,
          avatar_letter: m.avatarLetter,
          color_bg: m.colorBg,
          color_text: m.colorText,
          role: m.role,
          email: m.email,
        });
      } catch (err) {
        console.warn('Supabase insert member error:', err);
      }
    }
  };

  // Remove Member
  const removeMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (user?.householdId) {
      try {
        await supabase.from('members').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete member error:', err);
      }
    }
  };

  // Update Household Name
  const updateHouseholdName = async (name: string) => {
    setHouseholdName(name);
    if (user?.householdId) {
      try {
        await supabase.from('households').update({ name }).eq('id', user.householdId);
      } catch (err) {
        console.warn('Supabase update household error:', err);
      }
    }
  };

  // Clear all data (Start Fresh)
  const clearAllData = async () => {
    setTransactions([]);
    setRecurringItems([]);
    setMonthlyCashFlow(getTrailingMonths());
    if (user?.householdId) {
      try {
        await supabase.from('transactions').delete().eq('household_id', user.householdId);
        await supabase.from('recurring_items').delete().eq('household_id', user.householdId);
      } catch (err) {
        console.warn('Supabase clear error:', err);
      }
    }
  };

  // Backward-compatible alias
  const resetToDemoData = () => {
    clearAllData();
  };

  // Refresh latest data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      if (user?.userId) {
        const hhs = await fetchUserHouseholds(user.userId);
        setUserHouseholds(hhs);
      }
      if (user?.householdId) {
        await loadHouseholdData(user.householdId, user);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        householdName,
        inviteCode,
        transactions,
        members,
        recurringItems,
        monthlyCashFlow,
        isLoading,
        isRefreshing,
        hasDismissedOnboarding,
        userHouseholds,
        activeHouseholdId: user?.householdId || null,
        isHouseholdSwitcherOpen,
        openHouseholdSwitcher,
        closeHouseholdSwitcher,
        switchHousehold,
        login,
        signup,
        logout,
        createHousehold,
        joinHousehold,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        addRecurring,
        deleteRecurring,
        deductRecurringNow,
        addMember,
        removeMember,
        updateHouseholdName,
        clearAllData,
        resetToDemoData,
        refreshData,
        dismissOnboarding,
        resetOnboarding,
        hasCompletedTutorial,
        isTutorialVisible,
        openTutorial,
        closeTutorial,
        completeTutorial,
        resetTutorial,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

