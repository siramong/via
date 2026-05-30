import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../state/userStore';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useScalePress } from '../hooks/useScalePress';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { colors, radius, spacing } from '../theme';

export const AuthScreen = () => {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, status, error } = useUserStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const googleScale = useScalePress(0.97);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  const switchMode = useCallback((newMode: 'login' | 'signup') => {
    setMode(newMode);
    setAuthError(null);
    setSignupSuccess(false);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const handleEmailAuth = useCallback(async () => {
    if (!email || !password) {
      setAuthError('Correo y contraseña requeridos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Ingresa un correo válido');
      return;
    }

    if (password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!isSupabaseConfigured()) {
      setAuthError('Supabase no configurado');
      return;
    }

    setLoading(true);
    setAuthError(null);
    setSignupSuccess(false);

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
          setSignupSuccess(true);
          setEmail('');
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setAuthError('Correo no confirmado. Revisa tu bandeja de entrada.');
          } else {
            setAuthError(error.message);
          }
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
      <LinearGradient
        colors={['#0B1020', '#121A2E', '#0B1020']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(76, 201, 240, 0.06)', 'transparent']}
        style={[StyleSheet.absoluteFill, { top: 0, height: '45%' }]}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="navigate" size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.appName}>VIA</Text>
          </View>
          <Text style={styles.tagline}>Precios de combustible en vivo impulsados por tu ciudad.</Text>

          <Animated.View style={[styles.authCard, { opacity, transform: [{ translateY }] }]}>
            <View style={styles.modeTabs}>
              <Pressable
                style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
                onPress={() => switchMode('login')}
              >
                <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>Iniciar sesión</Text>
              </Pressable>
              <Pressable
                style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
                onPress={() => switchMode('signup')}
              >
                <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                  Crear cuenta
                </Text>
              </Pressable>
            </View>

            {signupSuccess ? (
              <View style={styles.successCard}>
                <Ionicons name="mail-open" size={20} color={colors.success} />
                <Text style={styles.successTitle}>Revisa tu correo</Text>
                <Text style={styles.successText}>
                  Te enviamos un enlace de confirmación a {email}. Revisa tu bandeja de entrada y luego inicia sesión.
                </Text>
              </View>
            ) : (
              <>
                <TextField
                  icon="mail"
                  placeholder="Correo electrónico"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ marginBottom: spacing.md }}
                />

                <TextField
                  icon="lock-closed"
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  rightAction={
                    <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  }
                />

                {!!displayError && (
                  <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{displayError}</Text>
                  </View>
                )}

                <Button
                  title={mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
                  onPress={handleEmailAuth}
                  loading={loading}
                  disabled={loading}
                  style={{ marginTop: spacing.md }}
                  size="lg"
                />
              </>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <Animated.View style={{ transform: [{ scale: googleScale.scale }] }}>
              <Button
                title="Continuar con Google"
                icon="logo-google"
                variant="secondary"
                onPress={handleGoogleSignIn}
                loading={status === 'loading'}
                disabled={status === 'loading'}
                size="md"
              />
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
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
  successCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  successTitle: {
    color: colors.success,
    fontSize: 17,
    fontWeight: '700',
  },
  successText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    flex: 1,
  },
});
