import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MapBackground } from '../components/MapView';
import { FuelCard } from '../components/FuelCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useLocationStore } from '../state/locationStore';
import { useUserStore } from '../state/userStore';
import { getCheapestStation } from '../services/pricing';
import { colors, spacing } from '../theme';
import type { StationResult } from '../types';

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { coords, refresh, status: locationStatus, error: locationError } = useLocationStore();
  const { profile, consumeAccess } = useUserStore();
  const navigation = useNavigation<any>();
  const [result, setResult] = useState<StationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCheapest = useCallback(async (isRefresh = false) => {
    if (!coords) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const station = await getCheapestStation(coords);
      setResult(station);
      if (profile && profile.access_remaining > 0) {
        await consumeAccess();
      }
    } catch (err) {
      const errMsg = (err as Error).message;
      if (!errMsg.includes('CORS') && !errMsg.includes('Failed to fetch')) {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, consumeAccess, profile]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (coords) {
      void loadCheapest();
    }
  }, [coords, loadCheapest]);

  const handleRefresh = useCallback(() => {
    refresh().catch(() => {});
    void loadCheapest(true);
  }, [refresh, loadCheapest]);

  const handleViewOnMap = useCallback(() => {
    navigation.navigate('Map');
  }, [navigation]);

  const handleContribute = useCallback(() => {
    navigation.navigate('Contribute');
  }, [navigation]);

  const locked = (profile?.access_remaining ?? 0) === 0;
  const showSkeleton = loading || locationStatus === 'loading';

  return (
    <View style={styles.container}>
      <MapBackground />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {showSkeleton ? (
          <SkeletonCard />
        ) : (
          <FuelCard
            result={result}
            locked={locked}
            onViewOnMap={handleViewOnMap}
            onContribute={handleContribute}
          />
        )}
        {!!locationError && <Text style={styles.error}>{locationError}</Text>}
        {!!error && !error.includes('CORS') && <Text style={styles.error}>{error}</Text>}
        {!coords && !loading && (
          <Text style={styles.hint}>Enable location to find cheapest fuel</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: 96,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 14,
  },
  hint: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
