import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
  bestStationId?: string;
  mapRef?: React.MutableRefObject<any>;
  topContentOffset?: number;
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
    @keyframes pulse-dot {
      0% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.4); opacity: 0.4; }
      100% { transform: scale(1); opacity: 0.8; }
    }
    .user-loc-pulse {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: rgba(76, 201, 240, 0.25);
      position: absolute;
      top: -12px; left: -12px;
      animation: pulse-dot 2s infinite;
    }
    .user-loc-dot {
      width: 12px; height: 12px;
      border-radius: 50%;
      background: #034af8;
      border: 2px solid #011360;
      position: absolute;
      top: -6px; left: -6px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { center: [-34.9, -56.2], zoom: 12, zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    var markers = {};
    var userMarker = null;
    var selectedId = null;
    var bestId = null;

    function setUserLocation(lat, lng) {
      if (userMarker) { map.removeLayer(userMarker); }
      var html = '<div style="position:relative"><div class="user-loc-pulse"></div><div class="user-loc-dot"></div></div>';
      var icon = L.divIcon({ className: '', html: html, iconSize: [24, 24], iconAnchor: [12, 12] });
      userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
    }

    function setMarkers(data) {
      for (var id in markers) { map.removeLayer(markers[id]); }
      markers = {};

      data.forEach(function(m) {
        var isSelected = m.stationId === selectedId;
        var isBest = m.stationId === bestId;
        var borderColor = isBest ? '#FFD700' : (isSelected ? '#35D07F' : '#034af8');
        var bgBadge = isBest ? '#FFD700' : (isSelected ? '#35D07F' : '#021A70');
        var textColor = isBest ? '#011360' : (isSelected ? '#011360' : '#034af8');
        var iconColor = isBest ? '#011360' : (isSelected ? '#011360' : '#034af8');

        var starHtml = isBest ? '<span style="position:absolute;top:-8px;right:-8px;font-size:14px;z-index:1">\\u2B50</span>' : '';
        var html = '<div style="display:flex;flex-direction:column;align-items:center;position:relative">' + starHtml +
          '<div style="background:' + bgBadge + ';border:1px solid ' + borderColor + ';border-radius:12px;padding:3px 8px;color:' + textColor + ';font-size:11px;font-weight:700;white-space:nowrap">' +
          (m.price ? '$' + m.price.toFixed(2) : '?') +
          '</div><div style="width:26px;height:26px;margin-top:2px;border-radius:13px;background:rgba(18,26,46,0.78);border:1.5px solid ' + borderColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" width="18" height="18" fill="' + iconColor + '"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div></div>';

        var icon = L.divIcon({ className: '', html: html, iconSize: [120, 56], iconAnchor: [60, 56] });
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

    function fitAll(points, topOffset) {
      if (!points || points.length === 0) return;
      if (points.length === 1) {
        map.setView(points[0], 14, { animate: true, duration: 0.5 });
        return;
      }
      var bounds = L.latLngBounds(points);
      var opts = { maxZoom: 15, animate: true, duration: 0.5 };
      if (topOffset) {
        opts.paddingTopLeft = [60, topOffset];
        opts.paddingBottomRight = [60, 60];
      } else {
        opts.padding = [60, 60];
      }
      map.fitBounds(bounds, opts);
    }

    function handleMessage(data) {
      try {
        var msg = JSON.parse(data);
        if (msg.type === 'setMarkers') { selectedId = msg.selectedId || null; bestId = msg.bestId || null; setMarkers(msg.data); }
        if (msg.type === 'flyTo') flyTo(msg.lat, msg.lng);
        if (msg.type === 'setUserLocation') setUserLocation(msg.lat, msg.lng);
        if (msg.type === 'fitAll') fitAll(msg.points, msg.topOffset);
      } catch(err) {}
    }

    window.addEventListener('message', function(e) { handleMessage(e.data); });
    document.addEventListener('message', function(e) { handleMessage(e.data); });
  </script>
</body>
</html>
`;

export const MapBackground = ({
  interactive = false,
  markers = [],
  onMarkerPress,
  selectedStationId,
  bestStationId,
  mapRef: externalRef,
  topContentOffset = 0,
}: Props) => {
  const { coords } = useLocationStore();
  const webViewRef = useRef<WebView>(null);
  const internalRef = useRef<any>(null);
  const mapRef = externalRef ?? internalRef;
  const [webviewReady, setWebviewReady] = useState(false);
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const bestIdRef = useRef(bestStationId);
  bestIdRef.current = bestStationId;

  const postToWebview = useCallback((msg: object) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(msg));
    }
  }, []);

  const sendMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      postToWebview({ type: 'setMarkers', data: markersRef.current, selectedId: selectedStationId, bestId: bestIdRef.current });
    }
  }, [postToWebview, selectedStationId]);

  const flyToCoords = useCallback((lat: number, lng: number) => {
    postToWebview({ type: 'flyTo', lat, lng });
  }, [postToWebview]);

  const sendUserLocation = useCallback((lat: number, lng: number) => {
    postToWebview({ type: 'setUserLocation', lat, lng });
  }, [postToWebview]);

  useEffect(() => {
    if (webviewReady && markers.length > 0) {
      sendMarkers();
    }
  }, [markers, webviewReady, sendMarkers]);

  useEffect(() => {
    if (webviewReady && selectedStationId) {
      sendMarkers();
    }
  }, [selectedStationId, webviewReady, sendMarkers]);

  useEffect(() => {
    if (webviewReady && bestStationId) {
      sendMarkers();
    }
  }, [bestStationId, webviewReady, sendMarkers]);

  useEffect(() => {
    if (coords && webviewReady) {
      sendUserLocation(coords.latitude, coords.longitude);
      setTimeout(() => flyToCoords(coords.latitude, coords.longitude), 200);
    }
  }, [coords, webviewReady, flyToCoords, sendUserLocation]);

  useEffect(() => {
    if (coords && markers.length > 0 && webviewReady) {
      const points: Array<[number, number]> = markers.map(m => [m.latitude, m.longitude] as [number, number]);
      points.push([coords.latitude, coords.longitude]);
      setTimeout(() => postToWebview({ type: 'fitAll', points, topOffset: topContentOffset }), 500);
    }
  }, [coords, markers, webviewReady, postToWebview, topContentOffset]);

  mapRef.current = {
    animateToRegion: () => {},
    recenter: () => {
      if (coords) flyToCoords(coords.latitude, coords.longitude);
    },
  };

  const recenter = () => {
    if (coords) flyToCoords(coords.latitude, coords.longitude);
  };

  const handleMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'markerPress') {
        const station = markersRef.current.find((m) => m.stationId === msg.stationId);
        if (station) onMarkerPress?.(station);
      }
    } catch {}
  }, [onMarkerPress]);

  const handleLoad = useCallback(() => {
    setWebviewReady(true);
  }, []);

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
        onLoad={handleLoad}
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
