import { Animated, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
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
      <Text style={styles.title}>Cheapest Station</Text>
      <Text style={styles.name}>{result.name}</Text>
      <View style={styles.row}>
        <Text style={styles.meta}>Distance</Text>
        <Text style={styles.metaValue}>{formatDistance(result.distanceMeters)}</Text>
      </View>
      {locked ? (
        <View style={styles.locked}>
          <Text style={styles.lockedText}>Price locked</Text>
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <Text style={styles.meta}>Fuel</Text>
            <Text style={styles.metaValue}>{result.fuelType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.meta}>Price</Text>
            <Text style={styles.price}>${result.price.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.meta}>Trust</Text>
            <Text style={styles.metaValue}>{result.trustScore}/100</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.meta}>Freshness</Text>
            <Text style={[styles.metaValue, { color: freshnessTone(result.freshness) }]}>
              {result.freshness}
            </Text>
          </View>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 12,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  row: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  metaValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  price: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 18,
  },
  locked: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'center',
  },
  lockedText: {
    color: colors.warning,
    fontWeight: '600',
  },
});
