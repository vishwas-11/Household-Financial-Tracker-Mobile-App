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

  // Compute real-time password strength metrics
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

    let label = 'Very Weak';
    let color = Colors.expense;
    if (score >= 5) {
      label = 'Strong';
      color = '#10b981';
    } else if (score >= 4) {
      label = 'Good';
      color = '#38d9a9';
    } else if (score >= 3) {
      label = 'Fair';
      color = '#f59f00';
    } else if (score >= 1) {
      label = 'Weak';
      color = Colors.expense;
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
      setError('Please fill in all fields.');
      return;
    }

    if (!passwordStats.isValid) {
      setError('Password must meet all 5 security requirements below.');
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
              <HouseholdFundsLogo size={26} color={Colors.white} />
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
                  placeholder="Choose a strong password"
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

              {/* Real-time Password Strength Meter */}
              {(password.length > 0 || focusedField === 'password') && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthHeader}>
                    <Text style={styles.strengthTitle}>PASSWORD STRENGTH</Text>
                    <Text style={[styles.strengthLabel, { color: passwordStats.color }]}>
                      {passwordStats.label}
                    </Text>
                  </View>

                  {/* 5-part Segmented Progress Bar */}
                  <View style={styles.strengthBarsRow}>
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              passwordStats.score >= idx
                                ? passwordStats.color
                                : 'rgba(255,255,255,0.08)',
                          },
                        ]}
                      />
                    ))}
                  </View>

                  {/* Requirements Checklist */}
                  <View style={styles.criteriaContainer}>
                    <View style={styles.criterionItem}>
                      {passwordStats.hasMinLength ? (
                        <Check size={12} color="#10b981" strokeWidth={2.5} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                      <Text
                        style={[
                          styles.criterionText,
                          passwordStats.hasMinLength && styles.criterionTextMet,
                        ]}
                      >
                        At least 8 characters
                      </Text>
                    </View>

                    <View style={styles.criterionItem}>
                      {passwordStats.hasUppercase ? (
                        <Check size={12} color="#10b981" strokeWidth={2.5} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                      <Text
                        style={[
                          styles.criterionText,
                          passwordStats.hasUppercase && styles.criterionTextMet,
                        ]}
                      >
                        One uppercase letter (A-Z)
                      </Text>
                    </View>

                    <View style={styles.criterionItem}>
                      {passwordStats.hasLowercase ? (
                        <Check size={12} color="#10b981" strokeWidth={2.5} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                      <Text
                        style={[
                          styles.criterionText,
                          passwordStats.hasLowercase && styles.criterionTextMet,
                        ]}
                      >
                        One lowercase letter (a-z)
                      </Text>
                    </View>

                    <View style={styles.criterionItem}>
                      {passwordStats.hasNumber ? (
                        <Check size={12} color="#10b981" strokeWidth={2.5} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                      <Text
                        style={[
                          styles.criterionText,
                          passwordStats.hasNumber && styles.criterionTextMet,
                        ]}
                      >
                        At least one number (0-9)
                      </Text>
                    </View>

                    <View style={styles.criterionItem}>
                      {passwordStats.hasSpecial ? (
                        <Check size={12} color="#10b981" strokeWidth={2.5} />
                      ) : (
                        <Circle size={6} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" />
                      )}
                      <Text
                        style={[
                          styles.criterionText,
                          passwordStats.hasSpecial && styles.criterionTextMet,
                        ]}
                      >
                        One special symbol (!@#$%^&*)
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.82}
              style={{ overflow: 'hidden', borderRadius: 12, marginTop: 4 }}
            >
              <LinearGradient
                colors={
                  (loading
                    ? [Colors.surfaceHighlight, Colors.surfaceHighlight]
                    : password.length > 0 && !passwordStats.isValid
                    ? ['#343a40', '#495057']
                    : ['#3B5BDB', '#0C8599']) as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Continue to Setup</Text>
                    <ArrowRight size={16} color={Colors.white} />
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
            <Text style={styles.securityText}>Supabase encrypted · Your data stays private</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, padding: 22, paddingTop: 28, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 24 },
  logoGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#3B5BDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: 5 },
  heroSubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 22,
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
  inputGroup: { gap: 7 },
  inputLabel: { fontSize: 10, fontFamily: 'monospace', color: Colors.textMuted, letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperFocused: { borderColor: Colors.brandBorder, backgroundColor: 'rgba(94,106,210,0.06)' },
  input: { flex: 1, color: Colors.text, fontSize: 14 },

  // Password Strength Styles
  strengthContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    gap: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthTitle: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    color: Colors.textSubdued,
    letterSpacing: 0.8,
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
    marginTop: 4,
    gap: 5,
  },
  criterionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  criterionText: {
    fontSize: 11.5,
    color: Colors.textSubdued,
  },
  criterionTextMet: {
    color: '#d3f9d8',
    fontWeight: '500',
  },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  footerText: { fontSize: 12.5, color: Colors.textMuted },
  linkText: { fontSize: 12.5, color: Colors.brand, fontWeight: '700' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  securityText: { fontSize: 10.5, fontFamily: 'monospace', color: Colors.textSubdued },
});
