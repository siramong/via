import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useLocationStore } from '../state/locationStore';
import type { StationMarker } from '../types';

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
};

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [-34.9, -56.2],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    var markers = {};

    function setMarkers(data) {
      for (var id in markers) {
        map.removeLayer(markers[id]);
      }
      markers = {};

      data.forEach(function(m) {
        var icon = L.divIcon({
          className: '',
          html: '<div style="background:#121A2E;border:1px solid #4CC9F0;border-radius:12px;padding:3px 8px;color:#4CC9F0;font-size:11px;font-weight:700;white-space:nowrap;margin-bottom:2px">' +
            (m.price ? '$' + m.price.toFixed(2) : '?') +
            '</div><div style="width:26px;height:26px;border-radius:13px;background:rgba(18,26,46,0.78);border:1.5px solid #4CC9F0;display:flex;align-items:center;justify-content:center;margin:0 auto"><svg viewBox="0 0 24 24" width="18" height="18" fill="#4CC9F0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
          iconSize: [80, 50],
          iconAnchor: [40, 50],
        });

        var marker = L.marker([m.latitude, m.longitude], { icon: icon }).addTo(map);

        marker.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', stationId: m.stationId }));
        });

        markers[m.stationId] = marker;
      });
    }

    function flyTo(lat, lng) {
      map.flyTo([lat, lng], 14, { duration: 0.3 });
    }

    window.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'setMarkers') setMarkers(msg.data);
        if (msg.type === 'flyTo') flyTo(msg.lat, msg.lng);
      } catch(err) {}
    });

    document.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'setMarkers') setMarkers(msg.data);
        if (msg.type === 'flyTo') flyTo(msg.lat, msg.lng);
      } catch(err) {}
    });
  </script>
</body>
</html>
`;

export const MapBackground = ({
  interactive = false,
  markers = [],
  onMarkerPress,
  selectedStationId,
  mapRef: externalRef,
}: Props) => {
  const { coords } = useLocationStore();
  const webViewRef = useRef<WebView>(null);
  const internalRef = useRef<any>(null);
  const mapRef = externalRef ?? internalRef;
  const initialRender = useRef(true);

  useEffect(() => {
    if (coords && initialRender.current) {
      initialRender.current = false;
      setTimeout(() => {
        webViewRef.current?.postMessage(JSON.stringify({ type: 'flyTo', lat: coords.latitude, lng: coords.longitude }));
      }, 500);
    }
  }, [coords]);

  useEffect(() => {
    if (webViewRef.current && markers.length > 0) {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'setMarkers', data: markers }));
    }
  }, [markers]);

  mapRef.current = {
    animateToRegion: () => {},
    recenter: () => {
      if (coords) {
        webViewRef.current?.postMessage(JSON.stringify({ type: 'flyTo', lat: coords.latitude, lng: coords.longitude }));
      }
    },
  };

  const recenter = () => {
    if (coords) {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'flyTo', lat: coords.latitude, lng: coords.longitude }));
    }
  };

  const handleMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'markerPress') {
        const station = markers.find((m) => m.stationId === msg.stationId);
        if (station) onMarkerPress?.(station);
      }
    } catch {}
  }, [markers, onMarkerPress]);

  const showUserLocation = Boolean(coords);

  return (
    <View style={styles.container} pointerEvents={interactive ? 'auto' : 'none'}>
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        pointerEvents={interactive ? 'auto' : 'none'}
      />
      <LinearGradient
        colors={[colors.overlay, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topFade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', colors.overlay]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bottomFade}
        pointerEvents="none"
      />
      <View style={styles.overlay} pointerEvents="none" />
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
