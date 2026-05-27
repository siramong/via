import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { StationMarker } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 360;

type Props = {
  stations: StationMarker[];
  selectedId: string | null;
  onSelect: (station: StationMarker) => void;
  onClose: () => void;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export const StationSelector = ({ stations, selectedId, onSelect, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [translateY, backdropOpacity]);

  const filtered = useMemo(() => {
    if (!search.trim()) return stations;
    const q = search.toLowerCase();
    return stations.filter((s) => s.name.toLowerCase().includes(q));
  }, [stations, search]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Select station</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item: StationMarker) => item.stationId}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: StationMarker }) => {
            const isSelected = item.stationId === selectedId;
            return (
              <Pressable
                style={[styles.station, isSelected && styles.stationSelected]}
                onPress={() => onSelect(item)}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stationName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.stationMeta}>
                    <Ionicons name="navigate" size={12} color={colors.textMuted} />
                    <Text style={styles.stationDist}>{formatDistance(item.distanceMeters)}</Text>
                  </View>
                </View>
                {item.price != null && (
                  <Text style={styles.stationPrice}>${item.price.toFixed(2)}</Text>
                )}
              </Pressable>
            );
          }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    maxHeight: SHEET_HEIGHT,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: spacing.xs,
  },
  station: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  stationSelected: {
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  stationName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stationDist: {
    ...typography.caption,
    color: colors.textMuted,
  },
  stationPrice: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
