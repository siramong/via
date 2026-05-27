import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
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
import { getUserReports } from '../services/supabase';
import { AccessCounter } from '../components/AccessCounter';
import { MapBackground } from '../components/MapView';
import { Badge } from '../components/ui/Badge';
import { useScalePress } from '../hooks/useScalePress';
import { colors, radius, spacing, typography } from '../theme';
import type { UserReport } from '../types';

const getInitials = (name: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'approved': return 'success' as const;
    case 'rejected': return 'danger' as const;
    case 'pending': return 'warning' as const;
    default: return 'neutral' as const;
  }
};

export const ProfileScreen = () => {
  const { profile, signOut, status, updateDisplayName } = useUserStore();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!profile) return;
    setReportsLoading(true);
    getUserReports(profile.id)
      .then(setReports)
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, [profile]);

  const handleOpenNameEdit = useCallback(() => {
    setEditName(profile?.display_name ?? '');
    setShowNameModal(true);
  }, [profile]);

  const handleSaveName = useCallback(async () => {
    const trimmed = editName.trim();
    if (!trimmed || !profile) return;
    await updateDisplayName(trimmed);
    setShowNameModal(false);
  }, [editName, profile, updateDisplayName]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const signOutScale = useScalePress(0.96);
  const accessOptionScale = useScalePress(0.97);

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
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with avatar */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#4CC9F0', '#8CF4FF']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitials(profile.display_name)}</Text>
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Profile</Text>
            <Pressable onPress={handleOpenNameEdit} style={styles.nameRow}>
              <Text style={styles.displayName}>{profile.display_name}</Text>
              <Ionicons name="pencil" size={14} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <AccessCounter remaining={profile.access_remaining} />

        {/* Stats */}
        <View style={styles.stats}>
          <StatCard icon="shield-checkmark" label="Reputation" value={profile.reputation.toString()} />
          <StatCard icon="calendar" label="Joined" value={formatDate(profile.created_at)} />
        </View>

        {/* Contribution history */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Recent Reports</Text>
          </View>
          {reportsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : reports.length === 0 ? (
            <Text style={styles.emptyText}>No reports yet. Submit your first price!</Text>
          ) : (
            <View style={styles.reportList}>
              {reports.map((r) => (
                <View key={r.id} style={styles.reportItem}>
                  <View style={styles.reportMeta}>
                    <Text style={styles.reportStation} numberOfLines={1}>
                      {r.station_name ?? 'Unknown station'}
                    </Text>
                    <Text style={styles.reportDate}>{formatDate(r.created_at)}</Text>
                  </View>
                  <Badge variant={statusBadgeVariant(r.status)} label={r.status} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Get more access */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Get More Access</Text>
          </View>
          <Text style={styles.bodyText}>
            Earn access points by contributing verified fuel prices.
          </Text>
          <View style={styles.accessOptions}>
            <Animated.View style={{ transform: [{ scale: accessOptionScale.scale }] }}>
              <AccessOption
                icon="camera"
                title="Submit a report"
                description="Earn 2 access points per verified report"
                onPress={() => {}}
              />
            </Animated.View>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={styles.infoTitle}>How it works</Text>
          </View>
          <Text style={styles.bodyText}>
            You start with 3 free queries. Each search uses 1 access point.
          </Text>
          <Text style={styles.bodyText}>
            Contribute verified fuel prices to earn access back and increase reputation.
          </Text>
        </View>

        {/* Sign out */}
        <Animated.View style={{ transform: [{ scale: signOutScale.scale }] }}>
          <Pressable style={styles.dangerButton} onPress={handleSignOut} onPressIn={signOutScale.onPressIn} onPressOut={signOutScale.onPressOut} disabled={status === 'loading'}>
            {status === 'loading' ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <>
                <Ionicons name="log-out" size={16} color={colors.danger} />
                <Text style={styles.dangerButtonText}>Sign Out</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Edit name modal */}
      <Modal visible={showNameModal} transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowNameModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Edit display name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setShowNameModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleSaveName}>
                <LinearGradient colors={[colors.primary, colors.accent]} style={styles.modalSaveFill}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

type AccessOptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
};

const AccessOption = ({ icon, title, description, onPress }: AccessOptionProps) => (
  <Pressable style={styles.accessOption} onPress={onPress}>
    <View style={styles.accessIcon}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <View style={styles.accessInfo}>
      <Text style={styles.accessTitle}>{title}</Text>
      <Text style={styles.accessDesc}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
  </Pressable>
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
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.background,
    fontSize: 20,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
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
  section: {
    marginTop: spacing.xl,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  bodyText: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  reportList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface1,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  reportMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  reportStation: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  reportDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  accessOptions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  accessOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  accessIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessInfo: {
    flex: 1,
  },
  accessTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  accessDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSave: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  modalSaveFill: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.background,
    fontWeight: '700',
  },
});
