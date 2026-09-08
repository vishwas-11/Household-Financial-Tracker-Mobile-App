// src/components/MemberCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mail, Shield, Trash2 } from 'lucide-react-native';
import { Member } from '../types';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';

interface MemberCardProps {
  member: Member;
  txCount: number;
  inflow: number;
  outflow: number;
  canRemove?: boolean;
  onRemove?: (id: string) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  txCount,
  inflow,
  outflow,
  canRemove = false,
  onRemove,
}) => {
  return (
    <View style={styles.card}>
      {/* Top Profile Row */}
      <View style={styles.topRow}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{member.avatarLetter}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.name} numberOfLines={1}>
              {member.name}
            </Text>
            <View style={styles.emailRow}>
              <Mail size={11} color={Colors.textSubdued} />
              <Text style={styles.email} numberOfLines={1}>
                {member.email}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.roleContainer}>
          <View style={styles.roleBadge}>
            <Shield size={10} color={Colors.brand} />
            <Text style={styles.roleText}>{member.role.toUpperCase()}</Text>
          </View>
          {canRemove && onRemove && (
            <TouchableOpacity
              onPress={() => onRemove(member.id)}
              style={styles.removeBtn}
              activeOpacity={0.6}
              accessibilityLabel="Remove member"
            >
              <Trash2 size={13} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3-Stat Split Footer */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ENTRIES</Text>
          <Text style={styles.statValue}>{txCount} logged</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>INFLOW</Text>
          <Text style={[styles.statValue, { color: Colors.income }]}>
            +{formatCurrency(inflow, { showDecimals: false })}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DISBURSED</Text>
          <Text style={styles.statValue}>
            -{formatCurrency(outflow, { showDecimals: false })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: Colors.text,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  email: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brandBorder,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.brand,
  },
  removeBtn: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.text,
  },
});
