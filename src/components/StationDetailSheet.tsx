import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import type { StationMarker } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 340;

type Props = {
  station: StationMarker | null;
  onClose: () => void;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const freshnessVariant = (freshness?: string) => {
  if (freshness === 'fresh') return 'success' as const;
  if (freshness === 'recent') return 'warning' as const;
  return 'neutral' as const;
};

const freshnessIcon = (freshness?: string) => {
  if (freshness === 'fresh') return 'flash';
  if (freshness === 'recent') return 'time';
  return 'alert-circle';
};

export const StationDetailSheet = ({ station, onClose }: Props) => {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (station) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      translateY.setValue(SHEET_HEIGHT);
      backdropOpacity.setValue(0);
    }
  }, [station, translateY, backdropOpacity]);

  if (!station) return null;

  const openMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrap}>
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{station.name}</Text>
              <Text style={styles.distance}>{formatDistance(station.distanceMeters)} away</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {station.price != null && (
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Best price</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${station.price.toFixed(2)}</Text>
              {station.fuelType && (
                <Badge variant="info" label={station.fuelType} style={{ alignSelf: 'center' }} />
              )}
            </View>
          </View>
        )}

        <View style={styles.tags}>
          {station.freshness && (
            <Badge
              variant={freshnessVariant(station.freshness)}
              label={station.freshness}
              icon={freshnessIcon(station.freshness)}
            />
          )}
          {station.trustScore != null && (
            <Badge
              variant="neutral"
              label={`Trust ${station.trustScore}`}
              icon="shield-checkmark"
            />
          )}
        </View>

        <View style={styles.actions}>
          <Button
            variant="primary"
            title="Navigate"
            icon="navigate"
            onPress={openMaps}
            size="md"
            style={{ flex: 1 }}
          />
          <Button
            variant="secondary"
            title="Share"
            icon="share-outline"
            onPress={() => {}}
            size="md"
            style={{ width: 52 }}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  distance: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceSection: {
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
