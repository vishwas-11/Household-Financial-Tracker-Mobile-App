-- =============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Core schema for Household Funds Tracker
-- Tables: users, households, members, transactions, recurring_items, monthly_cash_flows
-- =============================================================================

-- Enable pgcrypto / uuid-ossp for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (Custom Auth with bcrypt password hashing)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by email during login
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Households Table (with unique invite code for family onboarding)
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Sharma Family',
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_households_owner_id ON public.households(owner_id);
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON public.households(invite_code);

-- 3. Members Table
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  avatar_letter TEXT NOT NULL,
  color_bg TEXT NOT NULL DEFAULT '#e0e7ff',
  color_text TEXT NOT NULL DEFAULT '#3730a3',
  role TEXT NOT NULL DEFAULT 'Contributor',
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_household_id ON public.members(household_id);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  full_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expenditure', 'savings')),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_household_id ON public.transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_full_date ON public.transactions(full_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- 5. Recurring Commitments Table
CREATE TABLE IF NOT EXISTS public.recurring_items (
  id TEXT PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  type TEXT NOT NULL CHECK (type IN ('income', 'expenditure', 'savings')),
  frequency TEXT NOT NULL DEFAULT 'Monthly' CHECK (frequency IN ('Monthly', 'Bi-weekly', 'Weekly', 'Annual')),
  next_due_date TEXT NOT NULL,
  auto_pay BOOLEAN NOT NULL DEFAULT TRUE,
  member_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_items_household_id ON public.recurring_items(household_id);

-- 6. Monthly Cash Flow Analytics Table
CREATE TABLE IF NOT EXISTS public.monthly_cash_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  expenditure NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_flows_household_id ON public.monthly_cash_flows(household_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_cash_flows ENABLE ROW LEVEL SECURITY;

-- Idempotent policies (drop if exists first so re-running never errors)
DROP POLICY IF EXISTS "Allow service/anon operations" ON public.users;
CREATE POLICY "Allow service/anon operations" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service/anon operations" ON public.households;
CREATE POLICY "Allow service/anon operations" ON public.households FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service/anon operations" ON public.members;
CREATE POLICY "Allow service/anon operations" ON public.members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service/anon operations" ON public.transactions;
CREATE POLICY "Allow service/anon operations" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service/anon operations" ON public.recurring_items;
CREATE POLICY "Allow service/anon operations" ON public.recurring_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service/anon operations" ON public.monthly_cash_flows;
CREATE POLICY "Allow service/anon operations" ON public.monthly_cash_flows FOR ALL USING (true) WITH CHECK (true);
