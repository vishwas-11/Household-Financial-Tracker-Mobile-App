// src/screens/auth/SignupScreen.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Check,
  Circle,
  KeyRound,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { HouseholdFundsLogo } from '../../components/HouseholdFundsLogo';
import { useApp } from '../../context/AppContext';

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { signup } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  // Compute real-time password strength metrics (Strict 5-point policy)
  const passwordStats = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    let label = 'Required';
    let color = Colors.textSubdued;
    if (password.length > 0) {
      if (score >= 5) {
        label = 'Strong & Ready';
        color = '#10b981';
      } else if (score >= 4) {
        label = 'Good';
        color = '#20c997';
      } else if (score >= 3) {
        label = 'Fair';
        color = '#f59f00';
      } else {
        label = 'Weak';
        color = Colors.expense;
      }
    }

    return {
      score,
      isValid: score === 5,
      label,
      color,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    };
  }, [password]);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (!passwordStats.isValid) {
      const missing: string[] = [];
      if (!passwordStats.hasMinLength) missing.push('8+ characters');
      if (!passwordStats.hasUppercase) missing.push('an uppercase letter (A-Z)');
      if (!passwordStats.hasLowercase) missing.push('a lowercase letter (a-z)');
      if (!passwordStats.hasNumber) missing.push('a number (0-9)');
      if (!passwordStats.hasSpecial) missing.push('a special character (!@#$%^&*)');

      setError(`Password must satisfy all 5 requirements. Missing: ${missing.join(', ')}.`);
      return;
    }

    setError(null);
    setLoading(true);
    const res = await signup(name, email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Sign up failed.');
    } else {
      navigation.navigate('Onboarding');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#3B5BDB', '#1971C2', '#0C8599'] as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <HouseholdFundsLogo size={36} />
            </LinearGradient>
            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSubtitle}>Set up your personal access to family finances</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color={Colors.expense} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YOUR FULL NAME</Text>
              <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputWrapperFocused]}>
                <User
                  size={16}
                  color={focusedField === 'name' ? Colors.brand : Colors.textSubdued}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={Colors.textSubdued}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  style={styles.input}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
                <Mail
                  size={16}
                  color={focusedField === 'email' ? Colors.brand : Colors.textSubdued}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  ref={emailInputRef}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@family.local"
                  placeholderTextColor={Colors.textSubdued}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  style={styles.input}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
                <Lock
                  size={16}
                  color={focusedField === 'password' ? Colors.brand : Colors.textSubdued}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  ref={passwordInputRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a strong password"
                  placeholderTextColor={Colors.textSubdued}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                  style={[styles.input, { flex: 1 }]}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
                </TouchableOpacity>
              </View>

              {/* ALWAYS VISIBLE Password Strength Meter & Interactive Checklist */}
              <View style={styles.strengthContainer}>
                <View style={styles.strengthHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <KeyRound size={12} color={Colors.textMuted} />
                    <Text style={styles.strengthTitle}>SECURITY REQUIREMENTS</Text>
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStats.color }]}>
                    {passwordStats.label}
                  </Text>
                </View>

                {/* 5-part Segmented Progress Bar */}
                <View style={styles.strengthBarsRow}>
                  {[1, 2, 3, 4, 5].map((idx) => {
                    const isFilled = password.length > 0 && passwordStats.score >= idx;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor: isFilled
                              ? passwordStats.color
                              : 'rgba(255,255,255,0.07)',
                          },
                        ]}
                      />
                    );
                  })}
                </View>

                {/* 5 Requirements Checklist */}
                <View style={styles.criteriaContainer}>
                  {/* 1. Min 8 Chars */}
                  <View style={styles.criterionItem}>
                    <View
                      style={[
                        styles.criterionBadge,
                        passwordStats.hasMinLength && styles.criterionBadgeMet,
                      ]}
                    >
                      {passwordStats.hasMinLength ? (
                        <Check size={11} color="#10b981" strokeWidth={3} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.criterionText,
                        passwordStats.hasMinLength && styles.criterionTextMet,
                      ]}
                    >
                      At least 8 characters
                    </Text>
                  </View>

                  {/* 2. Uppercase */}
                  <View style={styles.criterionItem}>
                    <View
                      style={[
                        styles.criterionBadge,
                        passwordStats.hasUppercase && styles.criterionBadgeMet,
                      ]}
                    >
                      {passwordStats.hasUppercase ? (
                        <Check size={11} color="#10b981" strokeWidth={3} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.criterionText,
                        passwordStats.hasUppercase && styles.criterionTextMet,
                      ]}
                    >
                      One uppercase letter (A-Z)
                    </Text>
                  </View>

                  {/* 3. Lowercase */}
                  <View style={styles.criterionItem}>
                    <View
                      style={[
                        styles.criterionBadge,
                        passwordStats.hasLowercase && styles.criterionBadgeMet,
                      ]}
                    >
                      {passwordStats.hasLowercase ? (
                        <Check size={11} color="#10b981" strokeWidth={3} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.criterionText,
                        passwordStats.hasLowercase && styles.criterionTextMet,
                      ]}
                    >
                      One lowercase letter (a-z)
                    </Text>
                  </View>

                  {/* 4. Number */}
                  <View style={styles.criterionItem}>
                    <View
                      style={[
                        styles.criterionBadge,
                        passwordStats.hasNumber && styles.criterionBadgeMet,
                      ]}
                    >
                      {passwordStats.hasNumber ? (
                        <Check size={11} color="#10b981" strokeWidth={3} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.criterionText,
                        passwordStats.hasNumber && styles.criterionTextMet,
                      ]}
                    >
                      At least one number (0-9)
                    </Text>
                  </View>

                  {/* 5. Special symbol */}
                  <View style={styles.criterionItem}>
                    <View
                      style={[
                        styles.criterionBadge,
                        passwordStats.hasSpecial && styles.criterionBadgeMet,
                      ]}
                    >
                      {passwordStats.hasSpecial ? (
                        <Check size={11} color="#10b981" strokeWidth={3} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.criterionText,
                        passwordStats.hasSpecial && styles.criterionTextMet,
                      ]}
                    >
                      One special character (!@#$%^&*)
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.82}
              style={{ overflow: 'hidden', borderRadius: 12, marginTop: 6 }}
            >
              <LinearGradient
                colors={
                  (loading
                    ? [Colors.surfaceHighlight, Colors.surfaceHighlight]
                    : !passwordStats.isValid
                    ? ['#26282b', '#26282b']
                    : ['#3B5BDB', '#0C8599']) as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.submitBtn,
                  !passwordStats.isValid && !loading && styles.submitBtnLocked,
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.submitBtnText,
                        !passwordStats.isValid && styles.submitBtnTextLocked,
                      ]}
                    >
                      {passwordStats.isValid ? 'Create Account & Continue' : 'Satisfy All 5 Rules to Continue'}
                    </Text>
                    <ArrowRight
                      size={16}
                      color={passwordStats.isValid ? Colors.white : Colors.textSubdued}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.securityRow}>
            <ShieldCheck size={12} color={Colors.textSubdued} />
            <Text style={styles.securityText}>Supabase encrypted · Password salted & hashed</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, padding: 22, paddingTop: 24, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 20 },
  logoGradient: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#3B5BDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: 4 },
  heroSubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.expenseSubdued,
    borderColor: Colors.expenseBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 11,
  },
  errorText: { fontSize: 12, color: Colors.expense, flex: 1 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 10, fontFamily: 'monospace', color: Colors.textMuted, letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputWrapperFocused: { borderColor: Colors.brandBorder, backgroundColor: 'rgba(94,106,210,0.06)' },
  input: { flex: 1, color: Colors.text, fontSize: 14 },

  // Password Strength Styles
  strengthContainer: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    gap: 9,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthTitle: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  criteriaContainer: {
    marginTop: 2,
    gap: 6,
  },
  criterionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criterionBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criterionBadgeMet: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  criterionText: {
    fontSize: 11.5,
    color: Colors.textSubdued,
  },
  criterionTextMet: {
    color: '#d3f9d8',
    fontWeight: '600',
  },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitBtnLocked: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  submitBtnText: { fontSize: 14.5, fontWeight: '700', color: Colors.white },
  submitBtnTextLocked: { color: Colors.textSubdued, fontSize: 13 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 13,
  },
  footerText: { fontSize: 12.5, color: Colors.textMuted },
  linkText: { fontSize: 12.5, color: Colors.brand, fontWeight: '700' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  securityText: { fontSize: 10.5, fontFamily: 'monospace', color: Colors.textSubdued },
});
