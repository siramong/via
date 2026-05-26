import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useUserStore } from '../state/userStore';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { colors, radius, spacing } from '../theme';

export const AuthScreen = () => {
  const { signInWithGoogle, status, error } = useUserStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const handleEmailAuth = useCallback(async () => {
    if (!email || !password) {
      setAuthError('Email and password required');
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.appName}>VIA</Text>
          <Text style={styles.tagline}>Find the cheapest fuel, instantly</Text>
        </View>

        <View style={styles.features}>
          <Feature icon="📍" text="Real-time geolocation" />
          <Feature icon="💰" text="Community-verified prices" />
          <Feature icon="📸" text="Snap a photo to contribute" />
        </View>

        {/* Email/Password Auth */}
        <View style={styles.authForm}>
          <View style={styles.modeTabs}>
            <Pressable
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                Login
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {!!authError && <Text style={styles.error}>{authError}</Text>}

          <Pressable
            style={styles.emailButton}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Google OAuth */}
        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Text style={styles.googleIcon}>🔐</Text>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          No anonymous users. Sign in required to access fuel price data.
        </Text>
      </ScrollView>
    </View>
  );
};

type FeatureProps = {
  icon: string;
  text: string;
};

const Feature = ({ icon, text }: FeatureProps) => (
  <View style={styles.feature}>
    <Text style={styles.featureIcon}>{icon}</Text>
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
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  hero: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  appName: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 3,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  features: {
    marginVertical: spacing.xl,
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  authForm: {
    width: '100%',
    marginVertical: spacing.lg,
  },
  modeTabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.md,
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
    color: colors.textPrimary,
  },
  input: {
    width: '100%',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  emailButton: {
    width: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  googleButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 240,
  },
  googleIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  googleButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontSize: 12,
  },
  disclaimer: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
