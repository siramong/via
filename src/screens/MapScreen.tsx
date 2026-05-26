import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { MapBackground } from '../components/MapView';
import { useLocationStore } from '../state/locationStore';
import { getNearbyStations } from '../services/pricing';
import { colors } from '../theme';
import type { StationMarker } from '../types';

export const MapScreen = () => {
  const { coords, refresh, status } = useLocationStore();
  const [markers, setMarkers] = useState<StationMarker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    getNearbyStations(coords)
      .then(setMarkers)
      .finally(() => setLoading(false));
  }, [coords]);

  return (
    <View style={styles.container}>
      <MapBackground interactive markers={markers} />
      {(loading || status === 'loading') && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
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
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
});
