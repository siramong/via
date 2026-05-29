import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MapBackground } from '../components/MapView';
import { MapSearchBar } from '../components/MapSearchBar';
import { StationDetailSheet } from '../components/StationDetailSheet';
import { useLocationStore } from '../state/locationStore';
import { useUserStore } from '../state/userStore';
import { getBestStation, getNearbyStations } from '../services/pricing';
import { colors, radius, spacing } from '../theme';
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
    } else {
      setLocked(false);
    }

    if (loaded.current) return;
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
      .catch(() => {
        setAllMarkers([]);
      })
      .finally(() => setLoading(false));

    if (accessRemaining > 0) {
      consumeAccess().catch(() => {});
    }
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
      const preferred = allMarkers.filter((m) => m.fuelType === preferredFuel);
      if (preferred.length > 0) {
        result = preferred;
      }
    }

    return result;
  }, [allMarkers, search, preferredFuel]);

  const handleMarkerPress = useCallback((station: StationMarker) => {
    setSelectedStation(station);
  }, []);

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
        interactive
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
        <View style={styles.lockedBanner}>
          <Ionicons name="lock-closed" size={14} color={colors.warning} />
          <Text style={styles.lockedBannerText}>
            Acceso bloqueado — contribuye para buscar y actualizar
          </Text>
            <Pressable onPress={handleContribute} style={styles.lockedBannerBtn}>
              <Text style={styles.lockedBannerBtnText}>Contribuir</Text>
            </Pressable>
        </View>
      )}
      <StationDetailSheet station={selectedStation} onClose={handleCloseSheet} />
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
  lockedBanner: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    zIndex: 50,
  },
  lockedBannerText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  lockedBannerBtn: {
    backgroundColor: colors.warning,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lockedBannerBtnText: {
    color: '#0B1020',
    fontSize: 12,
    fontWeight: '700',
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
