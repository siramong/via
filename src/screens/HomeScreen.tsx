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
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [coords, consumeAccess, profile]);

  useEffect(() => {
    refresh();
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
          <ActivityIndicator color={colors.primary} />
        ) : (
          <FuelCard result={result} locked={locked} />
        )}
        {!!locationError && <Text style={styles.error}>{locationError}</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}
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
    padding: spacing.lg,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
