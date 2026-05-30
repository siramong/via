import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { findNearbyRealStations, ensureStation } from '../services/pricing';
import { Button } from './ui/Button';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { StationMarker } from '../types';
import type { RealtimeStation } from '../types';
import type { Coordinates } from '../services/location';

const SHEET_HEIGHT = 420;

type Props = {
  selectedId: string | null;
  userCoords: Coordinates | null;
  onSelect: (station: StationMarker) => void;
  onClose: () => void;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const haversineDistance = (a: Coordinates, b: { latitude: number; longitude: number }): number => {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
};

export const StationSelector = ({ selectedId, userCoords, onSelect, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const [realStations, setRealStations] = useState<RealtimeStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
    backdropOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const loadStations = useCallback(async () => {
    if (!userCoords) {
      setLoading(false);
      setError('Ubicación no disponible.');
      return;
    }
    setLoading(true);
    setError(null);
    setRealStations([]);
    try {
      const stations = await findNearbyRealStations(userCoords);
      if (stations.length === 0) {
        setError('No se encontraron estaciones en un radio amplio. Prueba otra ubicación.');
      } else {
        setRealStations(stations);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userCoords]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return realStations;
    const q = search.toLowerCase();
    return realStations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
    );
  }, [realStations, search]);

  const handleSelect = useCallback(
    async (realStation: RealtimeStation) => {
      setSavingId(realStation.placeId);
      try {
        const marker = await ensureStation(realStation);
        onSelect(marker);
      } catch {
        setError('No se pudo guardar la estación. Asegúrate de que las migraciones estén aplicadas e inténtalo de nuevo.');
      } finally {
        setSavingId(null);
      }
    },
    [onSelect, userCoords],
  );

  const hasStations = filtered.length > 0;

  return (
    <Modal transparent animationType="none" visible onRequestClose={onClose}>
      <View style={styles.wrapper} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.kbWrapper}
        >
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
            ]}
          >
            <View style={styles.headerSection}>
              <View style={styles.handle} />
              <Text style={styles.title}>Seleccionar estación</Text>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar estaciones cercanas..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>

            <View style={styles.contentSection}>
              {loading && (
                <View style={styles.centerWrap}>
                  <ActivityIndicator color={colors.primary} size="large" />
                  <Text style={styles.centerText}>Buscando estaciones de servicio cercanas...</Text>
                </View>
              )}

              {error && !loading && (
                <View style={styles.centerWrap}>
                  <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
                  <Text style={[styles.centerText, { color: colors.danger }]}>{error}</Text>
                  <Button
                    title="Reintentar"
                    icon="refresh"
                    variant="secondary"
                    size="sm"
                    onPress={loadStations}
                    style={{ marginTop: spacing.md }}
                  />
                </View>
              )}

              {!loading && !error && !hasStations && (
                <View style={styles.centerWrap}>
                  <Ionicons name="location-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.centerText}>
                    No se encontraron estaciones cercanas. Reintenta o verifica tu ubicación.
                  </Text>
                  <Button
                    title="Reintentar"
                    icon="refresh"
                    variant="secondary"
                    size="sm"
                    onPress={loadStations}
                    style={{ marginTop: spacing.md }}
                  />
                </View>
              )}

              {!loading && hasStations && (
                <FlatList
                  data={filtered}
                  keyExtractor={(item: RealtimeStation) => item.placeId}
                  keyboardShouldPersistTaps="handled"
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item }: { item: RealtimeStation }) => {
                    const isSaving = savingId === item.placeId;
                    const dist = userCoords ? haversineDistance(userCoords, item) : 0;
                    return (
                      <Pressable
                        style={[styles.station, isSaving && styles.stationSaving]}
                        onPress={() => handleSelect(item)}
                        disabled={isSaving}
                      >
                        <View style={styles.radio}>
                          {isSaving ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Ionicons name="location" size={16} color={colors.textMuted} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.stationName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.address ? (
                            <Text style={styles.stationAddress} numberOfLines={1}>
                              {item.address}
                            </Text>
                          ) : null}
                          <View style={styles.stationMeta}>
                            <Ionicons name="navigate" size={12} color={colors.textMuted} />
                            <Text style={styles.stationDist}>
                              {formatDistance(dist)}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="add-circle" size={22} color={colors.primary} />
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  kbWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 0,
    ...shadows.lg,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.xs,
  },
  station: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  stationSaving: {
    opacity: 0.6,
  },
  radio: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  stationAddress: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stationDist: {
    ...typography.caption,
    color: colors.textMuted,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  centerText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
