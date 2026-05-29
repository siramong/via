import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MapBackground } from '../components/MapView';
import { MapSearchBar } from '../components/MapSearchBar';
import { StationDetailSheet } from '../components/StationDetailSheet';
import { Button } from '../components/ui/Button';
import { useLocationStore } from '../state/locationStore';
import { useUserStore } from '../state/userStore';
import { getBestStation, getNearbyStations } from '../services/pricing';
import { colors, radius, spacing, typography } from '../theme';
import type { StationMarker } from '../types';

export const MapScreen = () => {
  const { coords, refresh, status } = useLocationStore();
  const { profile, consumeAccess } = useUserStore();
  const navigation = useNavigation<any>();
  const [allMarkers, setAllMarkers] = useState<StationMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<StationMarker | null>(null);
  const [locked, setLocked] = useState(false);
  const [bestStationId, setBestStationId] = useState<string | undefined>(undefined);
  const mapRef = useRef<any>(null);
  const loaded = useRef(false);

  const accessRemaining = profile?.access_remaining ?? 0;
  const preferredFuel = profile?.preferred_fuel;

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (!coords) return;

    if (accessRemaining <= 0) {
      setLocked(true);
      loaded.current = false;
      return;
    }

    if (loaded.current) return;
    loaded.current = true;

    setLocked(false);
    setLoading(true);

    getNearbyStations(coords)
      .then((markers) => {
        setAllMarkers(markers);
        return getBestStation(coords, preferredFuel);
      })
      .then((best) => {
        if (best) setBestStationId(best.stationId);
      })
      .catch(() => {
        setAllMarkers([]);
      })
      .finally(() => setLoading(false));

    consumeAccess().catch(() => {});
  }, [coords, accessRemaining, consumeAccess, preferredFuel]);

  const handleRefreshMarkers = useCallback(() => {
    if (!coords) return;
    loaded.current = true;
    setLoading(true);
    getNearbyStations(coords)
      .then((markers) => {
        setAllMarkers(markers);
        return getBestStation(coords, preferredFuel);
      })
      .then((best) => {
        if (best) setBestStationId(best.stationId);
      })
      .catch(() => setAllMarkers([]))
      .finally(() => setLoading(false));
    if (!locked) consumeAccess().catch(() => {});
  }, [coords, locked, consumeAccess, preferredFuel]);

  const filteredMarkers = useMemo(() => {
    let result = allMarkers;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }

    if (preferredFuel) {
      result = result.filter((m) => m.fuelType == null || m.fuelType === preferredFuel);
    }

    return result;
  }, [allMarkers, search, preferredFuel]);

  const handleMarkerPress = useCallback((station: StationMarker) => {
    if (locked) return;
    setSelectedStation(station);
  }, [locked]);

  const handleCloseSheet = useCallback(() => {
    setSelectedStation(null);
  }, []);

  const handleContribute = useCallback(() => {
    navigation.navigate('Contribute');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <MapBackground
        mapRef={mapRef}
        interactive={!locked}
        markers={filteredMarkers}
        onMarkerPress={handleMarkerPress}
        selectedStationId={selectedStation?.stationId}
        bestStationId={bestStationId}
      />
      {!locked && (
        <MapSearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
        />
      )}
      {(loading || status === 'loading') && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
      {locked && (
        <View style={styles.lockedOverlay} pointerEvents="box-none">
          <View style={styles.lockedWrap}>
            <View style={styles.lockedIcon}>
              <Ionicons name="lock-closed" size={28} color={colors.warning} />
            </View>
            <Text style={styles.lockedTitle}>Access locked</Text>
            <Text style={styles.lockedSubtitle}>
              Contribute a fuel price to earn more map views.
            </Text>
            <Button
              title="Contribute now"
              icon="camera"
              variant="primary"
              onPress={handleContribute}
              size="md"
              style={{ alignSelf: 'stretch' }}
            />
          </View>
        </View>
      )}
      {!locked && <StationDetailSheet station={selectedStation} onClose={handleCloseSheet} />}
      {!locked && (
        <Pressable style={styles.refreshBtn} onPress={handleRefreshMarkers}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </Pressable>
      )}
      <View style={styles.accessBadge}>
        <Ionicons name="flash" size={12} color={colors.primary} />
        <Text style={styles.accessText}>{accessRemaining}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 8, 18, 0.6)',
    zIndex: 50,
  },
  lockedWrap: {
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    maxWidth: 320,
  },
  lockedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  lockedSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshBtn: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  accessBadge: {
    position: 'absolute',
    top: 104,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.glass,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accessText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
