import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FUEL_DISPLAY } from '../constants/fuelLabels';
import { Badge } from './ui/Badge';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { StationMarker } from '../types';

type Props = {
  station: StationMarker;
  rank: number;
  onPress: (station: StationMarker) => void;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export const StationListItem = ({ station, rank, onPress }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: rank * 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 300, delay: rank * 50, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateX, rank]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <Pressable style={styles.card} onPress={() => onPress(station)}>
        <View style={styles.left}>
          <Text style={styles.rank}>#{rank + 1}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.name} numberOfLines={1}>{station.name}</Text>
          <View style={styles.meta}>
            <Ionicons name="navigate" size={10} color={colors.textMuted} />
            <Text style={styles.distance}>{formatDistance(station.distanceMeters)}</Text>
            {station.fuelType && (
              <Badge variant="info" label={FUEL_DISPLAY[station.fuelType]} size="sm" />
            )}
          </View>
        </View>
        <View style={styles.right}>
          {station.price != null ? (
            <>
              <Text style={styles.price}>${station.price.toFixed(2)}</Text>
              {station.trustScore != null && (
                <Text style={styles.trust}>Confianza {station.trustScore}</Text>
              )}
            </>
          ) : (
            <Text style={styles.noPrice}>?</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  left: {
    width: 32,
    alignItems: 'center',
  },
  rank: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  center: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  distance: {
    color: colors.textMuted,
    fontSize: 11,
    marginRight: spacing.xs,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  trust: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  noPrice: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '800',
  },
});
