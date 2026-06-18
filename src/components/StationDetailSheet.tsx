import { useEffect } from 'react';
import { Dimensions, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FUEL_DISPLAY } from '../constants/fuelLabels';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { freshnessToLabel, freshnessVariant, freshnessIcon } from '../utils/freshness';
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

export const StationDetailSheet = ({ station, onClose }: Props) => {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (station) {
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
    }
  }, [station]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!station) return null;

  const openMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.wrapper} pointerEvents="box-none">
        <Animated.View
          style={[styles.backdrop, backdropStyle]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />
          <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrap}>
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{station.name}</Text>
              <Text style={styles.distance}>{formatDistance(station.distanceMeters)}</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {station.price != null && (
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Mejor precio</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${station.price.toFixed(2)}</Text>
              {station.fuelType && (
                <Badge variant="info" label={FUEL_DISPLAY[station.fuelType]} style={{ alignSelf: 'center' }} />
              )}
            </View>
          </View>
        )}

        <View style={styles.tags}>
          {station.freshness && (
            <Badge
              variant={freshnessVariant(station.freshness)}
              label={freshnessToLabel(station.freshness)}
              icon={freshnessIcon(station.freshness)}
            />
          )}
          {station.trustScore != null && (
            <Badge
              variant="neutral"
              label={`Confianza ${station.trustScore}`}
              icon="shield-checkmark"
            />
          )}
        </View>

        <View style={styles.actions}>
          <Button
            variant="primary"
            title="Navegar"
            icon="navigate"
            onPress={openMaps}
            size="md"
            style={{ flex: 1 }}
          />
          <Button
            variant="secondary"
            title="Compartir"
            icon="share-outline"
            onPress={() => {}}
            size="md"
            style={{ width: 100 }}
          />
        </View>
      </Animated.View>
    </View>
    </Modal>
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
