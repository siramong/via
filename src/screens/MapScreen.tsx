import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapBackground } from '../components/MapView';
import { useLocationStore } from '../state/locationStore';
import { getNearbyStations } from '../services/pricing';
import { colors, spacing } from '../theme';
import type { StationMarker } from '../types';

export const MapScreen = () => {
  const { coords, refresh, status } = useLocationStore();
  const [markers, setMarkers] = useState<StationMarker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh().catch(() => {
      // Silently handle on web
    });
  }, [refresh]);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    getNearbyStations(coords)
      .then(setMarkers)
      .catch(() => {
        setMarkers([]);
      })
      .finally(() => setLoading(false));
  }, [coords]);

  return (
    <View style={styles.container}>
      <MapBackground interactive markers={markers} />
      <View style={styles.header}>
        <View style={styles.headerPill}>
          <Ionicons name="map" size={16} color={colors.primary} />
          <Text style={styles.headerText}>Nearby stations</Text>
        </View>
      </View>
      {(loading || status === 'loading') && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  headerText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
});
