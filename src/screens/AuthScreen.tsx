import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../state/userStore';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { MapBackground } from '../components/MapView';
import { colors, radius, spacing } from '../theme';

export const AuthScreen = () => {
  const { signInWithGoogle, status, error } = useUserStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  const switchMode = useCallback((newMode: 'login' | 'signup') => {
    setMode(newMode);
    setAuthError(null);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const handleEmailAuth = useCallback(async () => {
    if (!email || !password) {
      setAuthError('Email and password required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    if (!isSupabaseConfigured()) {
      setAuthError('Supabase not configured');
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            },
          },
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthError(null);
          setEmail('');
          setPassword('');
          setMode('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setAuthError(error.message);
        }
      }
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [email, password, mode]);

  const displayError = authError || error;

  return (
    <View style={styles.container}>
      <MapBackground />
      <LinearGradient
        colors={['rgba(9, 14, 28, 0.85)', 'rgba(9, 14, 28, 0.65)', 'rgba(9, 14, 28, 0.9)']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="navigate" size={20} color={colors.textPrimary} />
          </View>
          <Text style={styles.appName}>VIA</Text>
        </View>
        <Text style={styles.tagline}>Live fuel prices powered by your city.</Text>

        <View style={styles.featureList}>
          <Feature icon="locate" text="Nearest stations in real time" />
          <Feature icon="pricetags" text="Community verified prices" />
          <Feature icon="camera" text="Submit a photo in seconds" />
        </View>

        <Animated.View style={[styles.authCard, { opacity, transform: [{ translateY }] }]}>
          <View style={styles.modeTabs}>
            <Pressable
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>Login</Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
              onPress={() => switchMode('signup')}
            >
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                Create
              </Text>
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="mail" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          {!!displayError && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={14} color={colors.danger} />
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          <Pressable onPress={handleEmailAuth} disabled={loading} style={styles.primaryButton}>
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.primaryButtonFill}>
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.googleButton} onPress={handleGoogleSignIn} disabled={status === 'loading'}>
            {status === 'loading' ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <Text style={styles.disclaimer}>
          No anonymous access. Sign in required to view fuel prices.
        </Text>
      </ScrollView>
    </View>
  );
};

type FeatureProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

const Feature = ({ icon, text }: FeatureProps) => (
  <View style={styles.feature}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={16} color={colors.primary} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  tagline: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: 15,
  },
  featureList: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(76, 201, 240, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  authCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 22, 40, 0.7)',
    borderRadius: 999,
    padding: 4,
    marginBottom: spacing.md,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(12, 18, 34, 0.85)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  primaryButton: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  primaryButtonFill: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.lg,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  dividerRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  googleButton: {
    backgroundColor: 'rgba(18, 26, 46, 0.8)',
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    flex: 1,
  },
  disclaimer: {
    color: colors.textSecondary,
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});
