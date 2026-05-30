import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { runOcrWithRetries, type OcrOutput } from '../services/ocr';
import { PriceSelector } from '../components/PriceSelector';
import { PhotoPreview } from '../components/PhotoPreview';
import { StationSelector } from '../components/StationSelector';
import { MapBackground } from '../components/MapView';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FUEL_DISPLAY } from '../constants/fuelLabels';
import { colors, radius, spacing, typography } from '../theme';
import { supabase } from '../services/supabase';
import { useUserStore } from '../state/userStore';
import { useLocationStore } from '../state/locationStore';
import { toast } from '../state/toastStore';
import type { FuelType, FuelPriceInput, StationMarker } from '../types';

export const ContributeScreen = () => {
  const insets = useSafeAreaInsets();
  const { profile, grantAccess, session } = useUserStore();
  const { coords } = useLocationStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prices, setPrices] = useState<FuelPriceInput>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'camera' | 'review' | 'confirm'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationMarker | null>(null);
  const [showStationPicker, setShowStationPicker] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrRawText, setOcrRawText] = useState<string>('');
  const [ocrError, setOcrError] = useState<string>('');
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = 14;
    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [step]);

  const stepStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const pickImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hasPermission = await ImagePicker.getCameraPermissionsAsync();
      if (!hasPermission.granted) {
        const req = await ImagePicker.requestCameraPermissionsAsync();
        if (!req.granted) {
          setError('Permiso de cámara denegado');
          setLoading(false);
          return;
        }
      }
    } catch (permErr) {
      console.warn('[Camera] Permission check failed:', permErr);
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        cameraType: ImagePicker.CameraType.back,
        allowsEditing: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        setError('No se recibió foto de la cámara');
        setLoading(false);
        return;
      }

      const uri = asset.uri;
      setImageUri(uri);
      setOcrRawText('');
      setOcrError('');
      setOcrDone(false);
      setStep('review');

      await runOcr(uri);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown camera error';
      console.error('[Camera]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const runOcr = useCallback(async (uri: string) => {
    setLoading(true);
    try {
      const { output } = await runOcrWithRetries(uri);
      setPrices(output.prices);
      setOcrRawText(output.rawText || '(empty)');
      if (output.error) {
        setOcrError(output.error);
      }
      if (Object.keys(output.prices).length === 0) {
        toast.info('No se detectaron precios. Ingrésalos manualmente.');
      }
    } catch (err) {
      const msg = (err as Error).message;
      console.error('[OCR]', msg);
      setOcrError(msg);
      toast.error('OCR falló. Ingresa los precios manualmente.');
    } finally {
      setOcrDone(true);
      setLoading(false);
    }
  }, []);

  const updatePrice = (fuelType: FuelType, value: number) => {
    setPrices((prev: FuelPriceInput) => ({ ...prev, [fuelType]: value }));
  };

  const submitReport = useCallback(async () => {
    if (!imageUri || !session || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const filename = `${profile.id}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filename, {
          uri: imageUri,
          name: filename,
          type: 'image/jpeg',
        } as any);

      if (uploadError) throw uploadError;

      const { error: reportError } = await supabase.from('reports').insert({
        user_id: profile.id,
        image_url: uploadData?.path ?? filename,
        ocr_json: prices,
        station_id: selectedStation?.stationId ?? null,
        status: 'pending',
      });

      if (reportError) throw reportError;

      await grantAccess(2, 'valid_report');

      toast.success('¡Reporte enviado! Ganaste +2 accesos.');
      setImageUri(null);
      setPrices({});
      setSelectedStation(null);
      setStep('camera');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [imageUri, session, profile, prices, selectedStation, grantAccess]);

  const resetAll = useCallback(() => {
    setStep('camera');
    setImageUri(null);
    setPrices({});
    setSelectedStation(null);
    setError(null);
    setOcrRawText('');
    setOcrError('');
  }, []);

  const hasPrices = Object.values(prices).some((v) => typeof v === 'number' && v > 0);
  const allFuelTypes: FuelType[] = ['ecopais', 'super', 'diesel'];

  return (
    <View style={styles.container}>
      <MapBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="camera" size={18} color={colors.textPrimary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Contribuir</Text>
            <Text style={styles.subtitle}>Comparte precios frescos y gana acceso.</Text>
          </View>
        </View>

        {step === 'camera' && (
          <Animated.View style={stepStyle}>
            <Card variant="glass">
              <View style={styles.sectionHeader}>
                <Ionicons name="camera" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Captura el display del surtidor</Text>
              </View>
              <Text style={styles.bodyText}>
                Una foto clara mejora la precisión del OCR y acelera la revisión.
              </Text>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Button
                title="Abrir cámara"
                icon="camera"
                variant="primary"
                loading={loading}
                onPress={pickImage}
                size="lg"
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          </Animated.View>
        )}

        {step === 'review' && imageUri && (
          <Animated.View style={stepStyle}>
            <PhotoPreview uri={imageUri} onRetake={resetAll} />

            <Card variant="glass" style={{ marginTop: spacing.md }}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pricetags" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Precios</Text>
              </View>
              <Text style={styles.bodyText}>
                  {ocrDone ? 'Ajusta cualquier valor incorrecto abajo.' : 'Ejecutando OCR...'}
              </Text>
              {loading && !ocrDone ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
              ) : (
                <View style={styles.prices}>
                  {allFuelTypes.map((fuelType) => (
                    <PriceSelector
                      key={fuelType}
                      label={FUEL_DISPLAY[fuelType]}
                      value={prices[fuelType] ?? 0}
                      onChange={(v) => updatePrice(fuelType, v)}
                    />
                  ))}
                </View>
              )}
            </Card>

            {ocrDone && ocrRawText && (
              <Card variant="glass" style={{ marginTop: spacing.md }}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="text" size={18} color={colors.warning} />
                  <Text style={styles.sectionTitle}>Texto OCR Crudo</Text>
                </View>
                <Text style={styles.ocrRawText}>{ocrRawText}</Text>
                {!!ocrError && (
                  <Text style={[styles.error, { marginTop: spacing.xs }]}>Error: {ocrError}</Text>
                )}
              </Card>
            )}

            <Card variant="glass" style={{ marginTop: spacing.md }}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Estación</Text>
              </View>
              <Text style={styles.bodyText}>
                Selecciona a qué estación pertenece este precio.
              </Text>
              <Button
                title={selectedStation?.name ?? 'Elegir estación...'}
                icon={selectedStation ? 'checkmark-circle' : 'ellipse-outline'}
                variant="secondary"
                size="sm"
                onPress={() => setShowStationPicker(true)}
                style={{ marginTop: spacing.md }}
              />
            </Card>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <Button title="Atrás" variant="secondary" icon="arrow-back" onPress={resetAll} size="md" style={{ flex: 1 }} />
              <Button
                title="Continuar"
                variant="primary"
                icon="arrow-forward"
                disabled={!hasPrices}
                onPress={() => setStep('confirm')}
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Animated.View>
        )}

        {step === 'confirm' && imageUri && (
          <Animated.View style={stepStyle}>
            <Card variant="glass">
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.sectionTitle}>Confirmar reporte</Text>
              </View>

              <View style={styles.confirmPhoto}>
                <Ionicons name="image" size={16} color={colors.textMuted} />
                <Text style={styles.confirmPhotoText}>Foto capturada</Text>
              </View>

              {selectedStation && (
                <View style={styles.confirmRow}>
                  <Ionicons name="location" size={16} color={colors.textSecondary} />
                  <Text style={styles.confirmLabel}>Estación:</Text>
                  <Text style={styles.confirmValue} numberOfLines={1}>{selectedStation.name}</Text>
                </View>
              )}

              <View style={styles.confirmPrices}>
                <Text style={styles.confirmPricesLabel}>Precios</Text>
                <View style={styles.confirmPricesGrid}>
                  {allFuelTypes.map((ft) => {
                    const v = prices[ft];
                    if (v == null || v === 0) return null;
                    return (
                      <View key={ft} style={styles.confirmPriceItem}>
                        <Badge variant="info" label={FUEL_DISPLAY[ft]} />
                        <Text style={styles.confirmPriceValue}>${v.toFixed(2)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.actions}>
                <Button
                  title="Editar"
                  variant="secondary"
                  icon="arrow-back"
                  onPress={() => setStep('review')}
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Enviar"
                  variant="primary"
                  icon="cloud-upload"
                  loading={loading}
                  onPress={submitReport}
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {showStationPicker && (
        <StationSelector
          selectedId={selectedStation?.stationId ?? null}
          userCoords={coords}
          onSelect={(s) => {
            setSelectedStation(s);
            setShowStationPicker(false);
          }}
          onClose={() => setShowStationPicker(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  bodyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  prices: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  actions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
  },
  confirmPhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  confirmPhotoText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  confirmLabel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  confirmValue: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  confirmPrices: {
    marginTop: spacing.md,
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  confirmPricesLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  confirmPricesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  confirmPriceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  confirmPriceValue: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  ocrRawText: {
    ...typography.caption,
    color: colors.warning,
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
});
