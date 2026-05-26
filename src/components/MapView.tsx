import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, UrlTile } from 'react-native-maps';
import { colors } from '../theme';
import { useLocationStore } from '../state/locationStore';
import type { StationMarker } from '../types';

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
  const region = useRef(new AnimatedRegion(defaultRegion)).current;

  useEffect(() => {
    if (coords) {
      region.timing({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [coords, region]);

  useEffect(() => {
    let active = true;
    const pulse = () => {
      if (!active) return;
      region.timing({
        latitudeDelta: 0.058,
        longitudeDelta: 0.058,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        region.timing({
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
          duration: 250,
          useNativeDriver: false,
        }).start(() => {
          pulse();
        });
      });
    };
    pulse();
    return () => {
      active = false;
    };
  }, [region]);

  const markerElements = useMemo(
    () =>
      markers.map((marker) => (
        <Marker
          key={marker.stationId}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.name}
          pinColor={colors.primary}
        />
      )),
    [markers],
  );

  return (
    <View style={styles.container} pointerEvents={interactive ? 'auto' : 'none'}>
      <MapView.Animated
        style={StyleSheet.absoluteFill}
        customMapStyle={[]}
        region={region}
        rotateEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation
      >
        <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
        {markerElements}
      </MapView.Animated>
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 26, 0.6)',
  },
});
