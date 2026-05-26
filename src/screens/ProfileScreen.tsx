import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUserStore } from '../state/userStore';
import { AccessCounter } from '../components/AccessCounter';
import { colors, radius, spacing } from '../theme';

export const ProfileScreen = () => {
  const { profile, signOut, status } = useUserStore();

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  if (!profile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.displayName}>{profile.display_name}</Text>
      </View>

      <AccessCounter remaining={profile.access_remaining} />

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Reputation</Text>
          <Text style={styles.statValue}>{profile.reputation}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Joined</Text>
          <Text style={styles.statValue}>Day 1</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.body}>
          You start with 3 free queries. Each search uses 1 access point.
        </Text>
        <Text style={styles.body}>
          Contribute verified fuel prices to earn access points back and build your reputation.
        </Text>
      </View>

      <Pressable style={styles.dangerButton} onPress={handleSignOut} disabled={status === 'loading'}>
        {status === 'loading' ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <Text style={styles.dangerButtonText}>Sign Out</Text>
        )}
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 12,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  stats: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  dangerButton: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
