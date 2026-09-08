// src/components/InviteMemberModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, UserPlus } from 'lucide-react-native';
import { Member } from '../types';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  onClose,
}) => {
  const { addMember } = useApp();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Contributor' | 'Manager'>('Contributor');

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return;

    const initial = name.trim().charAt(0).toUpperCase();
    const colors = [
      { bg: '#dbeafe', text: '#1d4ed8' },
      { bg: '#fef3c7', text: '#b45309' },
      { bg: '#f3e8ff', text: '#7e22ce' },
      { bg: '#fee2e2', text: '#b91c1c' },
      { bg: '#dcfce7', text: '#15803d' },
    ];
    const pick = colors[Math.floor(Math.random() * colors.length)];

    const newMember: Member = {
      id: `${initial}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      avatarLetter: initial,
      colorBg: pick.bg,
      colorText: pick.text,
      role,
      email: email.trim().toLowerCase(),
    };

    await addMember(newMember);
    setName('');
    setEmail('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.container,
              { maxHeight: Math.round(windowHeight * 0.9) },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Invite Contributor</Text>
                <Text style={styles.headerSubtitle}>Grant access to shared household ledger</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor={Colors.textSubdued}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. priya@household.org"
                  placeholderTextColor={Colors.textSubdued}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ROLE</Text>
                <View style={styles.roleRow}>
                  {(['Contributor', 'Manager'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={[styles.roleTab, role === r && styles.roleTabActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity onPress={handleAdd} style={styles.submitBtn} activeOpacity={0.8}>
                <UserPlus size={16} color={Colors.white} />
                <Text style={styles.submitBtnText}>Add Contributor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
  },
  formContent: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 13,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleTabActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brand,
  },
  roleText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  roleTextActive: {
    color: Colors.brand,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    borderRadius: 8,
    paddingVertical: 14,
  },
  submitBtnText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});
