import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FuelCard } from '../components/FuelCard';
import { MapBackground } from '../components/MapView';
import { StationListItem } from '../components/StationListItem';
import { SkeletonCard } from '../components/ui/Skeleton';
import { FUEL_DISPLAY } from '../constants/fuelLabels';
import { useLocationStore } from '../state/locationStore';
import { useUserStore } from '../state/userStore';
import { getNearbyStations } from '../services/pricing';
import { colors, spacing } from '../theme';
import type { StationMarker } from '../types';
import type { FuelType } from '../types';

const computeBestScore = (
  stations: StationMarker[],
  preferredFuel: FuelType | null | undefined,
): StationMarker[] => {
  let filtered = stations;

  if (preferredFuel) {
    filtered = filtered.filter(
      (s) => s.fuelType == null || s.fuelType === preferredFuel,
    );
  }

  const withPrices = filtered.filter((s) => s.price != null);
  if (withPrices.length === 0) return [];

  const maxPrice = Math.max(...withPrices.map((s) => s.price!));
  const maxDist = Math.max(...withPrices.map((s) => s.distanceMeters));

  const scored = withPrices.map((s) => ({
    ...s,
    bestScore:
      0.6 * (maxPrice > 0 ? 1 - s.price! / maxPrice : 0.5) +
      0.4 * (maxDist > 0 ? 1 - s.distanceMeters / maxDist : 0.5),
  }));

  scored.sort((a, b) => b.bestScore - a.bestScore);
  return scored;
};

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { coords, refresh, status: locationStatus } = useLocationStore();
  const { profile } = useUserStore();
  const navigation = useNavigation<any>();
  const [stations, setStations] = useState<StationMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preferredFuel = profile?.preferred_fuel;
  const prevFuelRef = useRef(preferredFuel);

  const loadStations = useCallback(async (isRefresh = false) => {
    if (!coords) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await getNearbyStations(coords);
      setStations(result);
    } catch (err) {
      const errMsg = (err as Error).message;
      if (!errMsg.includes('CORS') && !errMsg.includes('Failed to fetch')) {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (coords) {
      void loadStations();
    }
  }, [coords, loadStations]);

  useEffect(() => {
    if (preferredFuel !== prevFuelRef.current) {
      prevFuelRef.current = preferredFuel;
      if (coords) {
        void loadStations();
      }
    }
  }, [preferredFuel, coords, loadStations]);

  const handleRefresh = useCallback(() => {
    refresh().catch(() => {});
    void loadStations(true);
  }, [refresh, loadStations]);

  const processed = useMemo(
    () => computeBestScore(stations, preferredFuel),
    [stations, preferredFuel],
  );

  const bestStation = processed.length > 0 ? processed[0] : null;

  const bestStationResult = useMemo(() => {
    if (!bestStation || bestStation.price == null) return null;
    return {
      stationId: bestStation.stationId,
      name: bestStation.name,
      fuelType: (bestStation.fuelType ?? 'regular') as FuelType,
      price: bestStation.price!,
      distanceMeters: bestStation.distanceMeters,
      trustScore: bestStation.trustScore ?? 50,
      freshness: (bestStation.freshness ?? 'stale') as any,
    };
  }, [bestStation]);

  const remaining = useMemo(
    () => processed.slice(1),
    [processed],
  );

  const noPrice = useMemo(() => {
    let filtered = stations;
    if (preferredFuel) {
      filtered = filtered.filter(
        (s) => s.fuelType == null || s.fuelType === preferredFuel,
      );
    }
    return filtered.filter((s) => s.price == null);
  }, [stations, preferredFuel]);

  const handleStationPress = useCallback((station: StationMarker) => {
    navigation.navigate('Map');
  }, [navigation]);

  const handleViewOnMap = useCallback(() => {
    navigation.navigate('Map');
  }, [navigation]);

  const showSkeleton = loading || locationStatus === 'loading';

  return (
    <View style={styles.container}>
      <MapBackground />
      <FlatList
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 120 }]}
        data={remaining}
        keyExtractor={(item) => item.stationId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Best nearby</Text>
            {preferredFuel && (
              <Text style={styles.filterHint}>
                Showing {FUEL_DISPLAY[preferredFuel]}
              </Text>
            )}
            {bestStationResult && (
              <View style={styles.featuredCard}>
                <FuelCard
                  result={bestStationResult}
                  locked={false}
                  onViewOnMap={handleViewOnMap}
                />
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <StationListItem station={item} rank={index} onPress={handleStationPress} />
        )}
        ListEmptyComponent={
          showSkeleton ? (
            <View style={styles.skeletonWrap}>
              <SkeletonCard />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {error ? 'Could not load stations' : 'No stations found'}
              </Text>
              {!!error && <Text style={styles.emptySub}>{error}</Text>}
            </View>
          )
        }
        ListFooterComponent={
          noPrice.length > 0 ? (
            <View style={styles.noPriceSection}>
              <Text style={styles.noPriceTitle}>
                {noPrice.length} station{noPrice.length > 1 ? 's' : ''} without recent prices
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
      {!coords && !loading && (
        <Text style={styles.hint}>Enable location to find the best fuel prices</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  filterHint: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  skeletonWrap: {
    marginTop: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  noPriceSection: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  noPriceTitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  featuredCard: {
    marginTop: spacing.md,
  },
  hint: {
    color: colors.textSecondary,
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
