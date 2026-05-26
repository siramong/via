import { useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useLocationStore } from '../state/locationStore';
import { CustomMarker } from './CustomMarker';
import type { StationMarker } from '../types';

let MapView: any = null;
let Marker: any = null;
let UrlTile: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default ?? maps;
    Marker = maps.Marker ?? maps.default?.Marker ?? null;
    UrlTile = maps.UrlTile ?? maps.default?.UrlTile ?? null;
  } catch (e) {}
}

type Props = {
  interactive?: boolean;
  markers?: StationMarker[];
  onMarkerPress?: (station: StationMarker) => void;
  selectedStationId?: string;
  mapRef?: React.MutableRefObject<any>;
};

const defaultRegion = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export const MapBackground = ({
  interactive = false,
  markers = [],
  onMarkerPress,
  selectedStationId,
  mapRef: externalRef,
}: Props) => {
  const { coords } = useLocationStore();
  const internalRef = useRef<any>(null);
  const mapRef = externalRef ?? internalRef;
  const showUserLocation = Boolean(coords);

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

    const recenter = () => {
      if (coords && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          },
          300,
        );
      }
    };

    const markerElements = useMemo(() => {
      if (!Marker) return null;
      return markers.map((marker) => (
        <Marker
          key={marker.stationId}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          onPress={() => onMarkerPress?.(marker)}
        >
          <CustomMarker
            price={marker.price}
            selected={marker.stationId === selectedStationId}
          />
        </Marker>
      ));
    }, [markers, onMarkerPress, selectedStationId]);

    // Web fallback
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={[styles.container, styles.webFallback]}>
          <LinearGradient
            colors={[colors.card, colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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
          showsUserLocation={showUserLocation}
        >
          {UrlTile ? (
            <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
          ) : null}
          {markerElements}
        </MapView>
        <LinearGradient
          colors={[colors.overlay, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topFade}
        />
        <LinearGradient
          colors={['transparent', colors.overlay]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomFade}
        />
        <View style={styles.overlay} />
        {interactive && coords && (
          <Pressable style={styles.locationBtn} onPress={recenter}>
            <Ionicons name="locate" size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>
    );
};

MapBackground.displayName = 'MapBackground';

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
    backgroundColor: 'rgba(5, 8, 18, 0.35)',
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  locationBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
