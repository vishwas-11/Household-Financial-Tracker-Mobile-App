// src/constants/onboardingSteps.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BookOpen,
  ArrowRightLeft,
  Repeat,
  FileSpreadsheet,
} from 'lucide-react-native';
import { Colors } from './colors';

export interface OnboardingStep {
  id: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'ledger',
    tag: 'VERIFIED LEDGER',
    title: 'Track Shared Expenses & Income',
    description:
      'Log transactions in real time with category tags, member attribution, and secure photo receipt uploads stored directly in the cloud.',
    accentColor: Colors.brand,
    icon: (
      <View style={[styles.iconWrap, { borderColor: 'rgba(94, 106, 210, 0.4)', backgroundColor: 'rgba(94, 106, 210, 0.12)' }]}>
        <BookOpen size={44} color={Colors.brand} strokeWidth={1.8} />
      </View>
    ),
  },
  {
    id: 'multi-household',
    tag: 'MULTI-HOUSEHOLD SWITCHER',
    title: 'Manage Multiple Funds Seamlessly',
    description:
      'Belong to different households, vacation homes, or roommate pools. Tap the header to switch between ledgers instantly or join with an invite code.',
    accentColor: '#38bdf8',
    icon: (
      <View style={[styles.iconWrap, { borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
        <ArrowRightLeft size={44} color="#38bdf8" strokeWidth={1.8} />
      </View>
    ),
  },
  {
    id: 'recurring',
    tag: 'RECURRING OBLIGATIONS',
    title: 'Automate Fixed Bills & Subscriptions',
    description:
      'Never miss rent, utility bills, or subscriptions. Set monthly schedules with auto-deduction right when obligations are due.',
    accentColor: '#a855f7',
    icon: (
      <View style={[styles.iconWrap, { borderColor: 'rgba(168, 85, 247, 0.4)', backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
        <Repeat size={44} color="#a855f7" strokeWidth={1.8} />
      </View>
    ),
  },
  {
    id: 'audit-export',
    tag: 'CPA AUDIT & EXPORTS',
    title: 'Generate Instant Audit Statements',
    description:
      'Download formal CPA statement sheets, visual cash-flow charts, and export complete ledgers to CSV or JSON with 1-tap sharing.',
    accentColor: Colors.income,
    icon: (
      <View style={[styles.iconWrap, { borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
        <FileSpreadsheet size={44} color={Colors.income} strokeWidth={1.8} />
      </View>
    ),
  },
];
