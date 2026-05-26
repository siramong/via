import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { colors } from '../theme';
import { useLocationStore } from '../state/locationStore';
import type { StationMarker } from '../types';

// Only import maps on native platforms
let MapView: any = null;
let Marker: any = null;
let UrlTile: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    UrlTile = maps.UrlTile;
  } catch (e) {
    // Maps not available
  }
}

type Props = {
  interactive?: boolean;
  markers?: StationMarker[];
};

const defaultRegion = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export const MapBackground = ({ interactive = false, markers = [] }: Props) => {
  const { coords } = useLocationStore();
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (coords && mapRef.current && MapView) {
      mapRef.current.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        },
        250,
      );
    }
  }, [coords]);

  const markerElements = useMemo(
    () => {
      if (!Marker) return null;
      return markers.map((marker) => (
        <Marker
          key={marker.stationId}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.name}
          pinColor={colors.primary}
        />
      ));
    },
    [markers],
  );

  // Web fallback: simple gradient background
  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={[styles.container, styles.webFallback]}>
        <View style={styles.overlay} />
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents={interactive ? 'auto' : 'none'}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={defaultRegion}
        rotateEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation
      >
        <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
        {markerElements}
      </MapView>
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
  },
  webFallback: {
    backgroundColor: colors.card,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 15, 26, 0.6)',
  },
});
