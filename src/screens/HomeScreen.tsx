import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FuelCard } from '../components/FuelCard';
import { MapBackground } from '../components/MapView';
import { FUEL_DISPLAY } from '../constants/fuelLabels';
import { useLocationStore } from '../state/locationStore';
import { useUserStore } from '../state/userStore';
import { getBestStation } from '../services/pricing';
import { colors, spacing } from '../theme';

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { coords, refresh, status: locationStatus } = useLocationStore();
  const { profile } = useUserStore();
  const [bestStationResult, setBestStationResult] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const preferredFuel = profile?.preferred_fuel;
  const prevFuelRef = useRef(preferredFuel);

  const loadBestStation = useCallback(async (isRefresh = false) => {
    if (!coords) return;
    if (isRefresh) setRefreshing(true);
    try {
      const best = await getBestStation(coords, preferredFuel);
      setBestStationResult(best);
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  }, [coords, preferredFuel]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (coords) {
      void loadBestStation();
    }
  }, [coords, loadBestStation]);

  useEffect(() => {
    if (preferredFuel !== prevFuelRef.current) {
      prevFuelRef.current = preferredFuel;
      if (coords) {
        void loadBestStation();
      }
    }
  }, [preferredFuel, coords, loadBestStation]);

  const handleRefresh = useCallback(() => {
    refresh().catch(() => {});
    void loadBestStation(true);
  }, [refresh, loadBestStation]);

  return (
    <View style={styles.container}>
      <MapBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Text style={styles.title}>Best nearby</Text>
        {preferredFuel && (
          <Text style={styles.filterHint}>
            Showing {FUEL_DISPLAY[preferredFuel]}
          </Text>
        )}
        {bestStationResult && (
          <View style={styles.featuredCard}>
            <FuelCard result={bestStationResult} />
          </View>
        )}
      </ScrollView>
      {!coords && (
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
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
