import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { MapBackground } from '../components/MapView';
import { MapSearchBar } from '../components/MapSearchBar';
import { StationDetailSheet } from '../components/StationDetailSheet';
import { useLocationStore } from '../state/locationStore';
import { getNearbyStations } from '../services/pricing';
import { colors } from '../theme';
import type { StationMarker } from '../types';

export const MapScreen = () => {
  const { coords, refresh, status } = useLocationStore();
  const [allMarkers, setAllMarkers] = useState<StationMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<StationMarker | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    getNearbyStations(coords)
      .then(setAllMarkers)
      .catch(() => setAllMarkers([]))
      .finally(() => setLoading(false));
  }, [coords]);

  const filteredMarkers = useMemo(() => {
    if (!search.trim()) return allMarkers;
    const q = search.toLowerCase();
    return allMarkers.filter((m) => m.name.toLowerCase().includes(q));
  }, [allMarkers, search]);

  const handleMarkerPress = useCallback((station: StationMarker) => {
    setSelectedStation(station);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedStation(null);
  }, []);

  return (
    <View style={styles.container}>
      <MapBackground
        mapRef={mapRef}
        interactive
        markers={filteredMarkers}
        onMarkerPress={handleMarkerPress}
        selectedStationId={selectedStation?.stationId}
      />
      <MapSearchBar
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
      />
      {(loading || status === 'loading') && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
      <StationDetailSheet station={selectedStation} onClose={handleCloseSheet} />
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
});
