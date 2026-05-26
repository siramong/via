import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import type { Freshness, StationResult } from '../types';

type Props = {
  result: StationResult | null;
  locked: boolean;
  onViewOnMap?: () => void;
  onContribute?: () => void;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const freshnessBadge = (freshness: Freshness) => {
  if (freshness === 'fresh') return { variant: 'success' as const, icon: 'flash' as const };
  if (freshness === 'recent') return { variant: 'warning' as const, icon: 'time' as const };
  return { variant: 'neutral' as const, icon: 'alert-circle' as const };
};

export const FuelCard = ({ result, locked, onViewOnMap, onContribute }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  if (!result) {
    return (
      <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search-outline" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No stations found</Text>
          <Text style={styles.emptySubtitle}>Try expanding your search area.</Text>
        </View>
      </Animated.View>
    );
  }

  const fb = freshnessBadge(result.freshness);

  if (locked) {
    return (
      <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.lockedWrap}>
          <View style={styles.lockedIcon}>
            <Ionicons name="lock-closed" size={24} color={colors.warning} />
          </View>
          <Text style={styles.lockedTitle}>Access locked</Text>
          <Text style={styles.lockedSubtitle}>
            You've used all your access points. Contribute a fuel price to earn more.
          </Text>
          <Button
            title="Contribute now"
            icon="camera"
            variant="primary"
            onPress={onContribute}
            size="md"
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Cheapest Station</Text>
        <Badge variant="info" label={`Trust ${result.trustScore}`} icon="shield-checkmark" />
      </View>

      <Text style={styles.name}>{result.name}</Text>

      <View style={styles.distanceRow}>
        <Ionicons name="navigate" size={14} color={colors.textSecondary} />
        <Text style={styles.distance}>{formatDistance(result.distanceMeters)} away</Text>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.priceLabel}>Best price</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${result.price.toFixed(2)}</Text>
          <Badge variant="info" label={result.fuelType} />
        </View>
      </View>

      <View style={styles.tags}>
        <Badge variant={fb.variant} label={result.freshness} icon={fb.icon} />
      </View>

      <View style={styles.divider} />

      <Button
        title="View on Map"
        icon="map"
        variant="secondary"
        size="sm"
        onPress={onViewOnMap}
        style={{ alignSelf: 'stretch' }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  distanceRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distance: {
    ...typography.body,
    color: colors.textSecondary,
  },
  priceSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  priceLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    ...typography.price,
    color: colors.textPrimary,
  },
  tags: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  lockedWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  lockedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  lockedTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  lockedSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
});
