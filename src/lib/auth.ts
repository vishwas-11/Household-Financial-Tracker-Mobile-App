// src/lib/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { UserSession } from '../types';

export const SESSION_STORAGE_KEY = '@hft_mobile_session';

// Standard 64-character alphabet used by bcrypt
const BCRYPT_CHARS = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Configure random byte generator fallback for bcryptjs in React Native mobile environment
if (typeof bcrypt.setRandomFallback === 'function') {
  bcrypt.setRandomFallback((len: number) => {
    try {
      const array = new Uint8Array(len);
      Crypto.getRandomValues(array);
      return Array.from(array);
    } catch {
      const fallback: number[] = [];
      for (let i = 0; i < len; i++) {
        fallback.push(Math.floor(Math.random() * 256));
      }
      return fallback;
    }
  });
}

/**
 * Generates a valid standard bcrypt salt string (e.g. $2b$10$...)
 * Guaranteed to produce a valid string regardless of platform/crypto availability
 */
export function generateBcryptSalt(rounds: number = 10): string {
  try {
    const salt = bcrypt.genSaltSync(rounds);
    if (typeof salt === 'string' && salt.length > 20) {
      return salt;
    }
  } catch {
    // Fall back to direct standard bcrypt salt generation
  }

  // Construct valid standard bcrypt salt: $2b$<rounds>$<22 random characters>
  const r = rounds < 10 ? `0${rounds}` : `${rounds}`;
  let salt = `$2b$${r}$`;

  try {
    const bytes = new Uint8Array(22);
    Crypto.getRandomValues(bytes);
    for (let i = 0; i < 22; i++) {
      salt += BCRYPT_CHARS.charAt(bytes[i] % BCRYPT_CHARS.length);
    }
  } catch {
    for (let i = 0; i < 22; i++) {
      salt += BCRYPT_CHARS.charAt(Math.floor(Math.random() * BCRYPT_CHARS.length));
    }
  }

  return salt;
}

export function generateInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HF-${randomPart}`;
}

/**
 * Hashes plain text password using bcrypt with 10 salt rounds.
 * Uses explicit salt generation and hashSync to guarantee a valid string salt
 * is always passed, completely avoiding "Invalid string / salt: Not a string" errors in React Native.
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string' || !password) {
    throw new Error('Password must be a non-empty string');
  }
  const salt = generateBcryptSalt(10);
  return bcrypt.hashSync(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    if (!password || !hash) return false;
    return bcrypt.compareSync(password, hash);
  } catch (err) {
    console.warn('comparePassword error:', err);
    return false;
  }
}

export async function saveUserSession(session: UserSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function getUserSession(): Promise<UserSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export async function clearUserSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Sign in user by checking credentials against public.users table in Supabase
 */
export async function signInWithCredentials(
  email: string,
  pass: string
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, name')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error && (error.message.includes('relation') || error.code === '42P01')) {
      return {
        success: false,
        error: 'Database tables not found. Please verify Supabase schema is installed.',
      };
    }

    if (!user || !user.password_hash) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const isValid = await comparePassword(pass, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Lookup household for user
    let householdId: string | undefined = undefined;
    let householdName: string | undefined = undefined;
    let inviteCode: string | undefined = undefined;

    const { data: ownedHh } = await supabase
      .from('households')
      .select('id, name, invite_code')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (ownedHh) {
      householdId = ownedHh.id;
      householdName = ownedHh.name;
      inviteCode = ownedHh.invite_code;
    } else {
      const { data: membership } = await supabase
        .from('members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership?.household_id) {
        const { data: memberHh } = await supabase
          .from('households')
          .select('id, name, invite_code')
          .eq('id', membership.household_id)
          .maybeSingle();

        if (memberHh) {
          householdId = memberHh.id;
          householdName = memberHh.name;
          inviteCode = memberHh.invite_code;
        }
      }
    }

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      householdId,
      householdName,
      inviteCode,
    };

    await saveUserSession(session);
    return { success: true, session };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Authentication error' };
  }
}

/**
 * Sign up a new user and insert into public.users table in Supabase
 */
export async function signUpWithCredentials(
  name: string,
  email: string,
  pass: string
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const hashed = await hashPassword(pass);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: cleanEmail,
        password_hash: hashed,
        name: name.trim(),
      })
      .select('id, email, name')
      .maybeSingle();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    const session: UserSession = {
      userId: newUser?.id || `usr-${Date.now()}`,
      email: cleanEmail,
      name: name.trim(),
    };

    await saveUserSession(session);
    return { success: true, session };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed' };
  }
}

/**
 * Create a new household in Supabase
 */
export async function createHouseholdForUser(
  householdName: string,
  user: UserSession
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  try {
    const trimmedName = householdName.trim() || `${user.name}'s Family`;
    const inviteCode = generateInviteCode();

    const { data: newHh, error } = await supabase
      .from('households')
      .insert({
        name: trimmedName,
        owner_id: user.userId,
        invite_code: inviteCode,
      })
      .select('id, name, invite_code')
      .maybeSingle();

    const householdId = newHh?.id || `hh-${Date.now()}`;
    const finalCode = newHh?.invite_code || inviteCode;

    // Add user as primary member
    const initialMember = {
      id: `${user.name.charAt(0).toUpperCase()}-${householdId.slice(0, 4)}`,
      household_id: householdId,
      user_id: user.userId,
      name: user.name,
      avatar_letter: user.name.charAt(0).toUpperCase(),
      color_bg: '#c7e9c4',
      color_text: '#314d33',
      role: 'Primary Account',
      email: user.email,
    };

    await supabase.from('members').insert([initialMember]);

    const updatedSession: UserSession = {
      ...user,
      householdId,
      householdName: trimmedName,
      inviteCode: finalCode,
    };

    await saveUserSession(updatedSession);
    return { success: true, session: updatedSession };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create household' };
  }
}

/**
 * Join an existing household using an invite code
 */
export async function joinHouseholdWithCode(
  inviteCode: string,
  user: UserSession
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  try {
    const cleanCode = inviteCode.trim().toUpperCase();

    const { data: hh, error } = await supabase
      .from('households')
      .select('id, name, invite_code')
      .ilike('invite_code', cleanCode)
      .maybeSingle();

    if (error || !hh) {
      return { success: false, error: `No household found with code "${cleanCode}".` };
    }

    const memberInitial = user.name.charAt(0).toUpperCase();
    const newMember = {
      id: `${memberInitial}-${Date.now().toString().slice(-4)}`,
      household_id: hh.id,
      user_id: user.userId,
      name: user.name,
      avatar_letter: memberInitial,
      color_bg: '#ffdbd1',
      color_text: '#77321e',
      role: 'Contributor',
      email: user.email,
    };

    await supabase.from('members').insert([newMember]);

    const updatedSession: UserSession = {
      ...user,
      householdId: hh.id,
      householdName: hh.name,
      inviteCode: hh.invite_code,
    };

    await saveUserSession(updatedSession);
    return { success: true, session: updatedSession };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to join household' };
  }
}
