// src/screens/main/MembersScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { KeyRound, Copy, Check, Share2, UserPlus, Users } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/Header';
import { MemberCard } from '../../components/MemberCard';
import { InviteMemberModal } from '../../components/InviteMemberModal';
import { useApp } from '../../context/AppContext';

export const MembersScreen: React.FC = () => {
  const { members, transactions, inviteCode, removeMember, isRefreshing, refreshData } = useApp();

  const [copied, setCopied] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join our household ledger on Household Funds Tracker using invite code: ${inviteCode}`,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        onOpenAddModal={() => setIsInviteModalOpen(true)}
        title="Family Members"
        subtitle="Multi-Contributor"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={Colors.brand}
          />
        }
      >
        {/* Family Invite Code Banner */}
        <View style={styles.inviteBanner}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIcon}>
              <KeyRound size={16} color={Colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerLabel}>FAMILY ONBOARDING INVITE CODE</Text>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
          </View>

          <Text style={styles.bannerDesc}>
            Share this invite code with your spouse, family members, or co-owners so they can
            connect to this shared ledger from their mobile app.
          </Text>

          <View style={styles.bannerActions}>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={styles.codeActionBtn}
              activeOpacity={0.7}
            >
              {copied ? (
                <>
                  <Check size={14} color={Colors.income} />
                  <Text style={[styles.codeActionText, { color: Colors.income }]}>Copied!</Text>
                </>
              ) : (
                <>
                  <Copy size={14} color={Colors.textMuted} />
                  <Text style={styles.codeActionText}>Copy Code</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareCode}
              style={[styles.codeActionBtn, styles.shareBtn]}
              activeOpacity={0.7}
            >
              <Share2 size={14} color={Colors.white} />
              <Text style={[styles.codeActionText, { color: Colors.white }]}>Share Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Members Header & Invite Button */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Household Members ({members.length})</Text>
          <TouchableOpacity
            onPress={() => setIsInviteModalOpen(true)}
            style={styles.inviteBtn}
            activeOpacity={0.8}
          >
            <UserPlus size={13} color={Colors.white} />
            <Text style={styles.inviteBtnText}>Invite Contributor</Text>
          </TouchableOpacity>
        </View>

        {/* Member Cards */}
        {members.map((member) => {
          const memberIncome = transactions
            .filter((t) => t.memberId === member.id && t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const memberExpense = transactions
            .filter((t) => t.memberId === member.id && t.type === 'expenditure')
            .reduce((sum, t) => sum + t.amount, 0);

          const txCount = transactions.filter((t) => t.memberId === member.id).length;

          return (
            <MemberCard
              key={member.id}
              member={member}
              txCount={txCount}
              inflow={memberIncome}
              outflow={memberExpense}
              canRemove={members.length > 1}
              onRemove={(id) => {
                Alert.alert(
                  'Remove Member',
                  `Are you sure you want to remove ${member.name} from this household?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => removeMember(id) },
                  ]
                );
              }}
            />
          );
        })}

        {/* Solo Member Guidance Tip */}
        {members.length <= 1 && (
          <View style={styles.soloMemberTip}>
            <Users size={16} color={Colors.brand} />
            <View style={{ flex: 1 }}>
              <Text style={styles.soloTipTitle}>Collaborate on Shared Expenses</Text>
              <Text style={styles.soloTipDesc}>
                You are currently the sole member. Share your invite code above with your spouse or family members so they can log entries and view live balances together.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Invite Member Modal */}
      <InviteMemberModal
        visible={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  inviteBanner: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.brandSubdued,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 1,
    marginTop: 2,
  },
  bannerDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 14,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingVertical: 8,
  },
  shareBtn: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  codeActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  soloMemberTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(94, 106, 210, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  soloTipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  soloTipDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
