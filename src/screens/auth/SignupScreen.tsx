// src/screens/auth/SignupScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle,
  Home, Users,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { HouseholdFundsLogo } from '../../components/HouseholdFundsLogo';
import { useApp } from '../../context/AppContext';

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { signup } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password || !householdName.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await signup(name, email, password);
    setLoading(false);
    if (!res.success) setError(res.error || 'Sign up failed.');
  };

  const InputField = ({
    id, label, icon, value, onChange, placeholder, secureEntry, showToggle, onToggle, keyboardType, autoCapitalize,
  }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, focusedField === id && styles.inputWrapperFocused]}>
        {React.cloneElement(icon, { color: focusedField === id ? Colors.brand : Colors.textSubdued, style: { marginRight: 10 } })}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSubdued}
          secureTextEntry={secureEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          style={[styles.input, showToggle && { flex: 1 }]}
          onFocus={() => setFocusedField(id)}
          onBlur={() => setFocusedField(null)}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
            {!secureEntry ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Brand Header */}
          <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#3B5BDB', '#1971C2', '#0C8599'] as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <HouseholdFundsLogo size={26} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSubtitle}>Set up your household financial ledger</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>

            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color={Colors.expense} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <InputField
              id="name" label="FULL NAME"
              icon={<User size={16} />}
              value={name} onChange={setName}
              placeholder="Your name"
              autoCapitalize="words"
            />
            <InputField
              id="household" label="HOUSEHOLD NAME"
              icon={<Home size={16} />}
              value={householdName} onChange={setHouseholdName}
              placeholder="e.g. The Sharma Family"
              autoCapitalize="words"
            />
            <InputField
              id="email" label="EMAIL"
              icon={<Mail size={16} />}
              value={email} onChange={setEmail}
              placeholder="name@family.local"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              id="password" label="PASSWORD"
              icon={<Lock size={16} />}
              value={password} onChange={setPassword}
              placeholder="Choose a strong password"
              secureEntry={!showPassword}
              showToggle
              onToggle={() => setShowPassword(!showPassword)}
              autoCapitalize="none"
            />

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.82}
              style={{ overflow: 'hidden', borderRadius: 12, marginTop: 4 }}
            >
              <LinearGradient
                colors={(loading ? [Colors.surfaceHighlight, Colors.surfaceHighlight] : ['#3B5BDB', '#0C8599']) as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Create Account</Text>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingTop: 32 },
  hero: { alignItems: 'center', marginBottom: 28 },
  logoGradient: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#3B5BDB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: 5 },
  heroSubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 22, gap: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.expenseSubdued, borderColor: Colors.expenseBorder, borderWidth: 1, borderRadius: 10, padding: 11 },
  errorText: { fontSize: 12, color: Colors.expense, flex: 1 },
  inputGroup: { gap: 7 },
  inputLabel: { fontSize: 10, fontFamily: 'monospace', color: Colors.textMuted, letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingHorizontal: 14, height: 50 },
  inputWrapperFocused: { borderColor: Colors.brandBorder, backgroundColor: 'rgba(94,106,210,0.06)' },
  input: { flex: 1, color: Colors.text, fontSize: 14 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  footerText: { fontSize: 12.5, color: Colors.textMuted },
  linkText: { fontSize: 12.5, color: Colors.brand, fontWeight: '700' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  securityText: { fontSize: 10.5, fontFamily: 'monospace', color: Colors.textSubdued },
});


