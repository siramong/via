import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../state/userStore';
import { AccessCounter } from '../components/AccessCounter';
import { MapBackground } from '../components/MapView';
import { colors, radius, spacing } from '../theme';

export const ProfileScreen = () => {
  const { profile, signOut, status } = useUserStore();

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  if (!profile) {
    return (
      <View style={styles.container}>
        <MapBackground />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={colors.textPrimary} />
          </View>
          <View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.displayName}>{profile.display_name}</Text>
          </View>
        </View>

        <AccessCounter remaining={profile.access_remaining} />

        <View style={styles.stats}>
          <StatCard icon="shield-checkmark" label="Reputation" value={profile.reputation.toString()} />
          <StatCard icon="calendar" label="Joined" value="Day 1" />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={styles.infoTitle}>How it works</Text>
          </View>
          <Text style={styles.body}>
            You start with 3 free queries. Each search uses 1 access point.
          </Text>
          <Text style={styles.body}>
            Contribute verified fuel prices to earn access back and increase reputation.
          </Text>
        </View>

        <Pressable style={styles.dangerButton} onPress={handleSignOut} disabled={status === 'loading'}>
          {status === 'loading' ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <>
              <Ionicons name="log-out" size={16} color={colors.danger} />
              <Text style={styles.dangerButtonText}>Sign Out</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
};

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

const StatCard = ({ icon, label, value }: StatCardProps) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 12,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  stats: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  infoCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  dangerButton: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dangerButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
