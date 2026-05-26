import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MapBackground } from '../components/MapView';
import { FuelCard } from '../components/FuelCard';
import { useLocationStore } from '../state/locationStore';
import { useUserStore } from '../state/userStore';
import { getCheapestStation } from '../services/pricing';
import { colors, spacing } from '../theme';
import type { StationResult } from '../types';

export const HomeScreen = () => {
  const { coords, refresh, status: locationStatus, error: locationError } = useLocationStore();
  const { profile, consumeAccess } = useUserStore();
  const [result, setResult] = useState<StationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCheapest = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
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
    }
  }, [coords, consumeAccess, profile]);

  useEffect(() => {
    refresh().catch(() => {
      // Silently handle location errors for web dev
    });
  }, [refresh]);

  useEffect(() => {
    if (coords) {
      void loadCheapest();
    }
  }, [coords, loadCheapest]);

  const locked = (profile?.access_remaining ?? 0) === 0;

  return (
    <View style={styles.container}>
      <MapBackground />
      <View style={styles.content}>
        {loading || locationStatus === 'loading' ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <FuelCard result={result} locked={locked} />
        )}
        {!!locationError && <Text style={styles.error}>{locationError}</Text>}
        {!!error && !error.includes('CORS') && <Text style={styles.error}>{error}</Text>}
        {!coords && <Text style={styles.hint}>Enable location to find cheapest fuel</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
