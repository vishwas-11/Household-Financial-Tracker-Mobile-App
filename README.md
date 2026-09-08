# Household Funds Tracker - Mobile App 📱

A production-grade mobile application built with **Expo (React Native)** and **TypeScript**, styled in the ultra-sleek **Linear Dark** theme. Seamlessly connected to your Supabase project for real-time multi-contributor database synchronization and dedicated file storage (`mobile-receipts`) for receipt photos.

---

## Features

- **Performance Dashboard**: Net Monthly Balance in Indian Rupees (₹), Inflow, Expenditure, Budget Health percentage, interactive touchable dual-bar Cash Flow Analytics, and recent transaction records.
- **Transaction Ledger**: Full itemized digital records with category icons, member attribution badges, type tags (Income, Expense, Savings), search filters, and member filtering.
- **Receipt & Bill Photo Attachment**: Attach receipts from your photo library or take a photo with the camera. Uploads directly to the dedicated `mobile-receipts` bucket in Supabase Storage with in-app fullscreen image preview.
- **Recurring Commitments**: Track automated bills, salary inflows, and EMI obligations with Auto-Pay indicators and due date reminders.
- **Family Multi-Contributor Management**: Unique 8-character household invite code (`HF-XXXXX`) with 1-tap clipboard copy and native share sheet. View contributor statistics (entries logged, total inflow, disbursed) and invite new family members.
- **Data Export & Backup**: Export transaction history to CSV and full JSON snapshot with 1-tap sharing to WhatsApp, Google Drive, Files, or Email.
- **Secure Authentication**: Bcrypt-hashed credentials querying the `public.users` table in Supabase, keeping logins 100% interoperable with the web application.

---

## Project Structure

```
Household-funds-tracker-mobille-app/
├── App.tsx                          # App root with SafeAreaProvider & Status bar
├── app.json                         # Expo configuration & permissions
├── .env                             # Supabase URL & publishable key
├── migrations/002_storage_setup.sql       # SQL migration for 'mobile-receipts' bucket
└── src/
    ├── constants/
    │   ├── colors.ts                # Linear Dark theme palette tokens
    │   └── initialData.ts           # Categories & fallback seed data
    ├── types/
    │   └── index.ts                 # TypeScript interfaces
    ├── lib/
    │   ├── supabase.ts              # Supabase client with AsyncStorage
    │   ├── auth.ts                  # Bcrypt hashing, sessions & household setup
    │   ├── storage.ts               # 'mobile-receipts' bucket upload & preview
    │   └── currency.ts              # Indian Rupee (₹) & Lakhs/Crores formatting
    ├── context/
    │   └── AppContext.tsx           # Global state & Supabase data sync
    ├── components/
    │   ├── Header.tsx               # Top bar with logo, title & avatar
    │   ├── StatCard.tsx             # Metric card with percentage badges
    │   ├── CashFlowChart.tsx        # Interactive dual-bar monthly cash flow chart
    │   ├── TransactionItem.tsx      # Ledger entry with category icon & receipt preview
    │   ├── RecurringItemRow.tsx     # Recurring schedule row with auto-pay badge
    │   ├── MemberCard.tsx           # Member summary card with inflow/outflow breakdown
    │   ├── AddTransactionModal.tsx  # Modal with image picker for receipt attachments
    │   ├── AddRecurringModal.tsx    # Modal for new recurring schedules
    │   ├── InviteMemberModal.tsx    # Modal to invite contributors
    │   ├── ReceiptViewerModal.tsx   # Fullscreen receipt viewer
    │   └── HouseholdFundsLogo.tsx   # Vector logo icon
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx      # Sign in screen
    │   │   ├── SignupScreen.tsx     # Registration screen
    │   │   └── OnboardingScreen.tsx # Create Household or Join with code
    │   └── main/
    │       ├── DashboardScreen.tsx  # Overview screen
    │       ├── LedgerScreen.tsx     # Ledger screen
    │       ├── RecurringScreen.tsx  # Recurring bills screen
    │       ├── MembersScreen.tsx    # Family members screen
    │       └── SettingsScreen.tsx   # Settings, exports, FAQs & profile
    └── navigation/
        ├── RootNavigator.tsx        # Auth gating (Auth Stack vs Main Tabs)
        ├── AuthNavigator.tsx        # Login -> Signup -> Onboarding
        └── AppNavigator.tsx         # Bottom Tab Navigation
```

---

## How to Run the Application

### 1. Open Terminal in the mobile app directory
```bash
cd "c:\Household Management\Household-funds-tracker-mobille-app"
```

### 2. Start the Expo development server
```bash
npx expo start
```
or
```bash
npm start
```

### 3. Open on your device or browser:
- **On Physical Phone (Expo Go)**:
  - Install the **Expo Go** app from App Store (iOS) or Play Store (Android).
  - On iOS: Scan the QR code using your iPhone's Camera app and tap the notification.
  - On Android: Scan the QR code using the Expo Go app.
- **On Web Browser**:
  - Press `w` in the terminal to open the web preview in your default browser.
- **On Android Emulator**:
  - Make sure Android Studio emulator is running, then press `a` in the terminal.
- **On iOS Simulator (macOS only)**:
  - Press `i` in the terminal.

---

## Supabase Database & File Storage Setup

The mobile app connects to your existing Supabase project.

### 1. Database Schema
Ensure the SQL in `c:\Household Management\household-funds-tracker\migrations\001_initial_schema.sql` is executed in your Supabase project's **SQL Editor**.

### 2. Dedicated Mobile Storage Bucket
To enable the dedicated `mobile-receipts` bucket for receipt uploads, run the SQL script in `migrations/002_storage_setup.sql` in your Supabase **SQL Editor**:
- It creates the `mobile-receipts` storage bucket with public read access.
- It creates the `web-receipts` storage bucket for the web app.
- It adds the `receipt_url` column to the `transactions` table.

*(Note: If the bucket is not created yet, the mobile app includes a graceful fallback that saves and previews the local image URI without interruption!)*

