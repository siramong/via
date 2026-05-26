import { Animated, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import type { Freshness, StationResult } from '../types';

type Props = {
  result: StationResult | null;
  locked: boolean;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const freshnessTone = (freshness: Freshness) => {
  if (freshness === 'fresh') return colors.success;
  if (freshness === 'recent') return colors.warning;
  return colors.danger;
};

export const FuelCard = ({ result, locked }: Props) => {
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
      <View style={styles.card}>
        <Text style={styles.title}>Cheapest Station</Text>
        <Text style={styles.subtitle}>No data available yet.</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Cheapest Station</Text>
        {!locked && (
          <View style={styles.trustPill}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.trustText}>{result.trustScore}</Text>
          </View>
        )}
      </View>
      <Text style={styles.name}>{result.name}</Text>
      <View style={styles.distanceRow}>
        <Ionicons name="navigate" size={14} color={colors.textSecondary} />
        <Text style={styles.distance}>{formatDistance(result.distanceMeters)} away</Text>
      </View>
      {locked ? (
        <View style={styles.locked}>
          <Ionicons name="lock-closed" size={14} color={colors.warning} />
          <Text style={styles.lockedText}>Price locked</Text>
        </View>
      ) : (
        <>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${result.price.toFixed(2)}</Text>
            <View style={styles.fuelPill}>
              <Text style={styles.fuelText}>{result.fuelType}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { borderColor: freshnessTone(result.freshness) }]}>
              <Ionicons name="flash" size={12} color={freshnessTone(result.freshness)} />
              <Text style={[styles.metaText, { color: freshnessTone(result.freshness) }]}>
                {result.freshness}
              </Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="pricetag" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>Trust {result.trustScore}</Text>
            </View>
          </View>
        </>
      )}
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    fontSize: 11,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  distanceRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distance: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  priceRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 32,
  },
  fuelPill: {
    backgroundColor: 'rgba(76, 201, 240, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  fuelText: {
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(76, 201, 240, 0.15)',
  },
  trustText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  locked: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  lockedText: {
    color: colors.warning,
    fontWeight: '600',
  },
});
