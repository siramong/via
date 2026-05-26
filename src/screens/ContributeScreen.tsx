import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { runOcrWithRetries } from '../services/ocr';
import { PriceSelector } from '../components/PriceSelector';
import { MapBackground } from '../components/MapView';
import { colors, radius, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useUserStore } from '../state/userStore';
import type { FuelType, FuelPriceInput } from '../types';

export const ContributeScreen = () => {
  const { profile, grantAccess, session } = useUserStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prices, setPrices] = useState<FuelPriceInput>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'camera' | 'ocr' | 'review'>('camera');
  const [error, setError] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, step]);

  const pickImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setStep('ocr');
        await runOcr(result.assets[0].uri);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const runOcr = useCallback(async (uri: string) => {
    setLoading(true);
    try {
      const { output, manualFallback } = await runOcrWithRetries(uri);
      setPrices(output.prices);
      if (manualFallback) {
        Alert.alert('OCR', 'Confidence low. Please adjust prices manually.');
      }
      setStep('review');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePrice = (fuelType: FuelType, value: number) => {
    setPrices((prev) => ({ ...prev, [fuelType]: value }));
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
        status: 'pending',
      });

      if (reportError) throw reportError;

      await grantAccess(2, 'valid_report');

      Alert.alert('Success', 'Report submitted! You earned +2 access.');
      setImageUri(null);
      setPrices({});
      setStep('camera');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [imageUri, session, profile, prices, grantAccess]);

  return (
    <View style={styles.container}>
      <MapBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="camera" size={18} color={colors.textPrimary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Contribute</Text>
            <Text style={styles.subtitle}>Share fresh prices and earn access.</Text>
          </View>
        </View>

        {step === 'camera' && (
          <Animated.View style={[styles.panel, { opacity, transform: [{ translateY }] }]}>
            <View style={styles.panelHeader}>
              <Ionicons name="camera" size={18} color={colors.primary} />
              <Text style={styles.panelTitle}>Capture the pump display</Text>
            </View>
            <Text style={styles.panelBody}>
              A clear photo improves OCR accuracy and speeds up the review.
            </Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primaryButton} onPress={pickImage} disabled={loading}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.primaryButtonFill}>
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <>
                    <Ionicons name="camera" size={18} color={colors.background} />
                    <Text style={styles.primaryButtonText}>Open Camera</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {step === 'review' && imageUri && (
          <Animated.View style={[styles.panel, { opacity, transform: [{ translateY }] }]}>
            <View style={styles.panelHeader}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.panelTitle}>Verify prices</Text>
            </View>
            <Text style={styles.panelBody}>Adjust any incorrect values below.</Text>

            <View style={styles.prices}>
              {(['regular', 'premium', 'diesel'] as const).map((fuelType) => (
                <PriceSelector
                  key={fuelType}
                  label={fuelType}
                  value={prices[fuelType] ?? 0}
                  onChange={(v) => updatePrice(fuelType, v)}
                />
              ))}
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  setStep('camera');
                  setImageUri(null);
                  setPrices({});
                }}
              >
                <Ionicons name="refresh" size={16} color={colors.textPrimary} />
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={submitReport} disabled={loading}>
                <LinearGradient colors={[colors.primary, colors.accent]} style={styles.primaryButtonFill}>
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={18} color={colors.background} />
                      <Text style={styles.primaryButtonText}>Submit</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
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
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  panel: {
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  panelBody: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  prices: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    flex: 1,
  },
  primaryButtonFill: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'rgba(16, 22, 40, 0.85)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  button: {
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    flex: 1,
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
});
