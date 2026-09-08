# Supabase Database & Storage Migrations

This folder contains all SQL migrations required to set up and run the **Household Funds Tracker** backend on Supabase.

---

## Migration Scripts

| File | Description |
| :--- | :--- |
| [`001_initial_schema.sql`](./001_initial_schema.sql) | Core database tables (`users`, `households`, `members`, `transactions`, `recurring_items`, `monthly_cash_flows`), indexes, and Row Level Security (RLS) policies. |
| [`002_storage_setup.sql`](./002_storage_setup.sql) | Dedicated storage buckets (`mobile-receipts` for the mobile app, `web-receipts` for web), public storage access policies, and adds the `receipt_url` column to `transactions`. |

---

## How to Apply Migrations in Supabase

1. Open your **[Supabase Project Dashboard](https://supabase.com/dashboard)**.
2. Navigate to the **SQL Editor** from the left-hand navigation.
3. Click **New query**.
4. Copy and paste the contents of `001_initial_schema.sql` into the editor and click **Run**.
5. Copy and paste the contents of `002_storage_setup.sql` into the editor and click **Run**.
6. Both your database tables and dedicated storage buckets are now fully configured!
