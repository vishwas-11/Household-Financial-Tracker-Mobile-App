// src/screens/auth/LoginScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
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
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Zap,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { HouseholdFundsLogo } from '../../components/HouseholdFundsLogo';
import { useApp } from '../../context/AppContext';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
      Animated.parallel([
        Animated.spring(cardAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    ]).start();
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) setError(res.error || 'Invalid credentials.');
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
          {/* Brand Hero */}
          <Animated.View style={[styles.hero, { opacity: logoAnim }]}>
            <LinearGradient
              colors={['#3B5BDB', '#1971C2', '#0C8599'] as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <HouseholdFundsLogo size={26} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.appTitle}>Household Funds</Text>
            <Text style={styles.appSubtitle}>Your family's shared financial ledger</Text>

            {/* Decorative stat pills */}
            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Zap size={11} color={Colors.income} />
                <Text style={styles.heroPillText}>Real-time sync</Text>
              </View>
              <View style={styles.heroPill}>
                <ShieldCheck size={11} color={Colors.brand} />
                <Text style={styles.heroPillText}>Supabase encrypted</Text>
              </View>
            </View>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOpacity }]}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtitle}>Access your household ledger</Text>

            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color={Colors.expense} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
                <Mail
                  size={16}
                  color={focusedField === 'email' ? Colors.brand : Colors.textSubdued}
                  style={{ marginRight: 10 }}
                />
                <TextInput
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
                  placeholder="Enter password"
                  placeholderTextColor={Colors.textSubdued}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  style={[styles.input, { flex: 1 }]}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.82}
              style={{ overflow: 'hidden', borderRadius: 12, marginTop: 4 }}
            >
              <LinearGradient
                colors={(loading ? [Colors.surfaceHighlight, Colors.surfaceHighlight] : ['#3B5BDB', '#0C8599']) as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Sign In</Text>
                    <ArrowRight size={16} color={Colors.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>No account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.linkText}>Create one</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.securityRow}>
            <ShieldCheck size={12} color={Colors.textSubdued} />
            <Text style={styles.securityText}>End-to-end encrypted · Supabase backend</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, padding: 22, paddingTop: 36, paddingBottom: 40 },

  // Hero
  hero: { alignItems: 'center', marginBottom: 28 },
  logoGradient: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#3B5BDB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  appTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.6, marginBottom: 6 },
  appSubtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 14, textAlign: 'center' },
  heroPills: { flexDirection: 'row', gap: 8 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroPillText: { fontSize: 10.5, color: Colors.textSecondary, fontWeight: '600' },

  // Card
  card: { backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 22, gap: 16 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 12.5, color: Colors.textMuted, marginTop: -8 },

  // Error
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.expenseSubdued, borderColor: Colors.expenseBorder, borderWidth: 1, borderRadius: 10, padding: 11 },
  errorText: { fontSize: 12, color: Colors.expense, flex: 1 },

  // Inputs
  inputGroup: { gap: 7 },
  inputLabel: { fontSize: 10, fontFamily: 'monospace', color: Colors.textMuted, letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingHorizontal: 14, height: 50 },
  inputWrapperFocused: { borderColor: Colors.brandBorder, backgroundColor: 'rgba(94,106,210,0.06)' },
  input: { flex: 1, color: Colors.text, fontSize: 14 },

  // Submit
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  // Footer
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  footerText: { fontSize: 12.5, color: Colors.textMuted },
  linkText: { fontSize: 12.5, color: Colors.brand, fontWeight: '700' },

  // Security
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  securityText: { fontSize: 10.5, fontFamily: 'monospace', color: Colors.textSubdued },
});
