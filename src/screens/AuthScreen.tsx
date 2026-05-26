import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUserStore } from '../state/userStore';
import { colors, radius, spacing } from '../theme';

export const AuthScreen = () => {
  const { signInWithGoogle, status, error } = useUserStore();

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.appName}>VIA</Text>
          <Text style={styles.tagline}>Find the cheapest fuel, instantly</Text>
        </View>

        <View style={styles.features}>
          <Feature icon="📍" text="Real-time geolocation" />
          <Feature icon="💰" text="Community-verified prices" />
          <Feature icon="📸" text="Snap a photo to contribute" />
        </View>

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
      </View>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
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
  googleButton: {
    marginTop: spacing.xl,
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
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  disclaimer: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
