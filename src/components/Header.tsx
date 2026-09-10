// src/components/Header.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react-native';
import { HouseholdDropdownMenu } from './HouseholdDropdownMenu';
import { Colors } from '../constants/colors';
import { HouseholdFundsLogo } from './HouseholdFundsLogo';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenAddModal?: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal, title, subtitle }) => {
  const { user, householdName } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AS';

  return (
    <>
      <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.logoBadge}>
          <HouseholdFundsLogo size={20} />
        </View>
        <TouchableOpacity
          style={styles.titleWrapper}
          onPress={() => setIsDropdownOpen(true)}
          activeOpacity={0.7}
          accessibilityLabel="Switch Household"
          accessibilityRole="button"
        >
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title || householdName || 'Household Funds'}
            </Text>
            {isDropdownOpen ? (
              <ChevronUp size={13} color={Colors.brand} style={styles.chevronIcon} />
            ) : (
              <ChevronDown size={13} color={Colors.textMuted} style={styles.chevronIcon} />
            )}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle || 'Verified Ledger'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightRow}>
        {onOpenAddModal && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={onOpenAddModal}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Add transaction"
            accessibilityRole="button"
          >
            <Plus size={14} color={Colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}

        <View style={styles.avatarPill}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </View>
      </View>
    </View>

      <HouseholdDropdownMenu
        visible={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 58,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  titleWrapper: {
    flex: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevronIcon: {
    marginTop: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  avatarPill: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
